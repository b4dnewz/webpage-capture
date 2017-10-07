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
  'https://gravatar.com/pewdiepie',
  'https://profiles.wordpress.org/pewdiepie',
  'https://myspace.com/pewdiepie',
  'https://www.flickr.com/photos/pewdiepie'
];

webpageCapture(pages, options, function (err, res) {
  if (err) {
    return console.log(err);
  }
  console.log('Result screenshots created at:', res);
});
