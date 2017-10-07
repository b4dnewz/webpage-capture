'use strict';

const webpageCapture = require('../lib/index');
const options = {
  onlySuccess: true,
  whiteBackground: true,
  crop: true,
  viewportSize: {
    width: 412,
    height: 732
  }
};

webpageCapture('https://github.com/codekraft-studio', options, function (err, res) {
  if (err) {
    return console.log(err);
  }
  console.log('Result screenshot created at:', res);
});
