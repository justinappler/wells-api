var request = require('request');
var cheerio = require('cheerio');
var redis = require('redis').createClient(process.env.REDIS_URL || 'redis://127.0.0.1:6379');

var WELLS_URL = 'https://www.wellsfargo.com/mortgage/rates/';
var WELLS_DATA_REDIS_KEY = 'WELLSDATA';

// Table indices of the various rate types
var RATE_INDICES = {
  THIRTY_FIXED: 2,
  FIFTEEN_FIXED: 5,
  SEVEN_ONE: 6,
  FIVE_ONE: 7,
  THIRTY_FIXED_JUMBO: 10,
  FIFTEEN_FIXED_JUMBO: 11,
  SEVEN_ONE_JUMBO: 12
}

function getMortgageRatesHTML(cb) {
  console.log('Getting Mortgage Rates HTML');
  request(WELLS_URL, function (err, response, body) {
    console.log('Response Received (' + response.statusCode + ')');

    if (err) {
      cb(err, null);
    } else {
      cb(null, body);
    }
  });
}

function getRateAtIndexFromHTML(jq, index) {
  var rateText = jq('table#PurchaseRatesTable tbody tr:nth-child(' + index + ') td:nth-child(3)').text();
  return Number.parseFloat(rateText);
}

function cacheRates(data) {
  console.log('Caching rates');
  redis.set(WELLS_DATA_REDIS_KEY, JSON.stringify(data));
}

function getRatesFromWeb(cb) {
  getMortgageRatesHTML(function (err, html) {
    if (err) {
      cb(err, null);
      return;
    }

    var $ = cheerio.load(html);

    var data = {};

    data['UPDATED_AT'] = new Date().toString();

    Object.keys(RATE_INDICES).map(function (key) {
      data[key] = getRateAtIndexFromHTML($, RATE_INDICES[key]);
    });

    cacheRates(data);

    cb(null, data);
  });
}

function getRates(cb, refresh) {
  console.log('Checking redis for cached rates');
  redis.get(WELLS_DATA_REDIS_KEY, function (err, reply) {
    if (reply && !refresh) {
      console.log('Cached Rates Found');
      var cachedData = JSON.parse(reply);

      var lastUpdated = new Date(cachedData.UPDATED_AT);
      console.log('Cached Rates from: ' + lastUpdated.toDateString());

      if (lastUpdated.toDateString() === new Date().toDateString()) {
        console.log('Cached Rates are current, using...');
        cb(null, cachedData);
      } else {
        getRatesFromWeb(cb);
      }
    } else {
      getRatesFromWeb(cb);
    }
  });
}

module.exports = {
  getRates: getRates
};
