'use strict';

const webpageCapture = require('../lib/index');
const options = {
  onlySuccess: true,
  whiteBackground: true,
  crop: true,
  viewportSize: {
    width: 1280,
    height: 800
  }
};

webpageCapture('github.com/codekraft-studio', options, function (err, res) {
  if (err) {
    return console.log(err);
  }
  console.log('Screenshot created at:', res);
});
