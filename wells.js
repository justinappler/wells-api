var request = require('request');
var cheerio = require('cheerio');

var WELLS_URL = 'https://www.wellsfargo.com/mortgage/rates/';

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

function getRates(cb) {
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

    cb(null, data);
  });
}

module.exports = {
  getRates: getRates
};
