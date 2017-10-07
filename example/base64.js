'use strict';

const webpageCapture = require('../lib/index');

webpageCapture('https://codekraft.it/', {
  outputType: 'base64'
}, function (err, res) {
  if (err) {
    return console.log(err);
  }
  console.log('Result:', res);
});
