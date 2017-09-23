'use strict';

// Script dependencies
const phantom = require('phantom');

// The url regexp
const URL_REGEXP = /^(http[s]?)?(:\/{2})?([\w\-.]+[^#?\s/]+)(.*)$/;

// Main script
const webpageCapture = (input, options = {}, callback) => {
  // Exit if input not valid
  if (!URL_REGEXP.test(input)) {
    throw new Error(`Invalid url: ${input}`);
  }
  // Parse input url
  let matches = input.match(URL_REGEXP);
  let url = matches[0];

  // Ensure url has protocol set
  if (typeof matches[1] === 'undefined') {
    url = `http://${url}`;
  }

  // Ensure output property
  options.output = options.output || `./output/${matches[3]}.png`;

  // Init variables
  let _p;
  let _ph;

  // Init phantom module
  console.log('Capturing screenshot for:', url);
  phantom.create().then(ph => {
    _ph = ph;
    return _ph.createPage();
  }).then(p => {
    _p = p;
    // Open the url with phantom page instance
    return _p.open(url);
  }).then(s => {
    // Check the response status
    if (s !== 'success') {
      callback(new Error(`The response has not a success status: ${s}`));
      return;
    }
    // Render page
    _p.render(options.output, options.renderOptions || {});
    process.exit();
  }).catch(callback);
};

// // Export module
module.exports = webpageCapture;
