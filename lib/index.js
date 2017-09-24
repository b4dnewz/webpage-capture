'use strict';

// Script dependencies
const pkg = require('../package.json');
const debug = require('debug')(pkg.name);
const phantom = require('phantom');

// The url regexp
const URL_REGEXP = /^(http[s]?)?(:\/{2})?([\w\-.]+[^#?\s/]+)(.*)$/;

// Default script options
const defaults = {
  renderDelay: 0,
  renderOptions: {
    format: 'png',
    quality: 80
  },
  viewportSize: {
    width: 1280,
    height: 800
  }
};

// Main script
const webpageCapture = (input, options = {}, callback) => {
  debug('Booting %o', pkg.name);
  debug('Validating input string %o as url.', input);
  // Exit if input not valid
  if (!URL_REGEXP.test(input)) {
    throw new Error(`Invalid url: ${input}`);
  }

  // Parse input url
  let _p;
  let _ph;
  let matches = input.match(URL_REGEXP);
  let url = matches[0];

  // Ensure url has protocol set
  if (typeof matches[1] === 'undefined') {
    debug('Adding missing protocol to input url.');
    url = `http://${url}`;
  }

  // Extend with default options
  options = Object.assign({}, defaults, options);

  // Ensure output property
  options.output = options.output || `./output/${matches[3]}.png`;
  debug('The output will be created at: %o', options.output);

  // Init phantom module
  debug('Starting new phantomjs instance.');
  phantom.create().then(ph => {
    _ph = ph;
    return _ph.createPage();
  }).then(p => {
    _p = p;

    // Set page options
    _p.property('viewportSize', options.viewportSize);

    // Optionally set a default white background for the page
    if (options.whiteBackground) {
      _p.evaluate(function () {
        document.body.bgColor = 'white';
      });
    }

    // Optionally add custom css style to the page
    if (options.customCSS) {
      _p.evaluate(function (customCSS) {
        const style = document.createElement('style');
        const text = document.createTextNode(customCSS);
        style.setAttribute('type', 'text/css');
        style.appendChild(text);
        // Ensure custom style is loaded before others
        document.head.insertBefore(style, document.head.firstChild);
      }, options.customCSS);
    }

    debug('Started request for url: %o', url);
    return _p.open(url);
  }).then(s => {
    debug('Ended request for url: %o', url);
    // Check the response status
    if (s !== 'success') {
      callback(new Error(`The response has not a success status: ${s}`));
      return;
    }

    debug('Starting the screenshot rendering process.');
    _p.render(options.output, options.renderOptions || {}).then(() => {
      debug('Ending the screenshot rendering process.');
      callback(null, options.output);
      process.exit();
    });
  }).catch(callback);
};

// // Export module
module.exports = webpageCapture;
