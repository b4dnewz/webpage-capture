'use strict';

const webpageCapture = require('../lib/index');

webpageCapture('https://codekraft.it/', {}, function (err, res) {
  if (err) {
    return console.log(err);
  }
  console.log('Result screenshot created at:', res);
});
