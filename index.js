var http = require('http');
var express = require('express');
var xml = require('xml');

var wells = require('./wells');

var app = express();
var port = process.env.PORT || 8082;

app.get('/', function (req, res) {
  res.redirect(301, '/rates.json');
});

app.get('/rates.json', function (req, res) {
  wells.getRates(function (err, rates) {
    if (err) {
      res.status(500).json({ error: err });
    } else {
      res.json(rates);
    }
  }, req.query.refresh);
});

app.get('/rates.xml', function (req, res) {
  wells.getRates(function (err, rates) {
    res.set('Content-Type', 'text/xml');

    if (err) {
      res.send(xml({ error: err }));
    } else {
      var rateObjs = [];
      Object.keys(rates).map(function (key) {
        var rateXmlObj = {};
        rateXmlObj[key] = rates[key];
        rateObjs.push(rateXmlObj);
      });

      res.send(xml([{ rates: rateObjs }], { declaration: true }));
    }
  }, req.query.refresh);
});

http
  .createServer(app)
  .listen(port, function() {
    console.log('Started');
  })
  .on('error', function (err) {
    console.log(err);
  });
