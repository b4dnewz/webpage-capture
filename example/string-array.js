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

const pages = [
  'https://codekraft.it/',
  'https://github.com/codekraft-studio'
];

webpageCapture(pages, options, function (err, res) {
  if (err) {
    return console.log(err);
  }
  console.log('Result screenshots created at:', res);
});
