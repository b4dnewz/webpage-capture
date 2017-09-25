'use strict';

// Script dependencies
const pkg = require('../package.json');
const debug = require('debug')(pkg.name);
const phantom = require('phantom');

// The url regexp
const URL_REGEXP = /^(http[s]?)?(:\/{2})?([\w\-.]+[^#?\s/]+)(.*)$/;

// Phantomjs render supported formats
const supportedFormats = ['pdf', 'png', 'jpeg', 'bmp', 'ppm'];

// Default script options
const defaults = {
  renderDelay: 0,
  renderOptions: {
    format: 'png',
    quality: 80
  },
  crop: false,
  clipRect: {
    top: 0,
    left: 0
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

    // Check for  non supported render format
    options.renderOptions.format = (supportedFormats.indexOf(options.renderOptions.format.toLowerCase()) === -1) ?
      'png' :
      options.renderOptions.format;

    // Optionally crop the rendered area
    if (options.crop) {
      _p.property('clipRect', Object.assign(options.clipRect, {
        width: options.viewportSize.width,
        height: options.viewportSize.height
      }));
    } else {
      _p.property('clipRect', options.clipRect);
    }

    // Set page options
    debug('Setting phantomjs page viewport size.');
    return _p.property('viewportSize', options.viewportSize);
  }).then(() => {
    debug('Started phantomjs HTTP request.');
    return _p.open(url);
  }).then(s => {
    debug('Ended phantomjs HTTP request.');

    // Check the response status
    if (s !== 'success') {
      callback(new Error(`The response has not a success status: ${s}`));
      return;
    }

    // Evaluate the page to run optional scripts based on options
    debug('Evaluating phantomjs page to run optional scripts.');
    _p.evaluate(function (options) {
      // Optionally set a default white background for the page
      if (options.whiteBackground) {
        document.body.style.backgroundColor = 'white';
      }

      // Optionally add custom css style to the page
      if (options.customCSS) {
        var style = document.createElement('style');
        var text = document.createTextNode(options.customCSS);
        style.setAttribute('type', 'text/css');
        style.appendChild(text);
        // Ensure custom style is loaded before others
        document.head.insertBefore(style, document.head.firstChild);
      }

      // Force the viewport size
      document.body.style.overflow = 'hidden';
      document.body.clientWidth = options.viewportSize.width;
      document.body.clientWidth = options.viewportSize.width;
      window.innerWidth = options.viewportSize.width;
      window.innerHeight = options.viewportSize.height;
    }, options).then(function () {
      debug('Evaluating phantomjs scripts completed.');
      debug('Starting the screenshot rendering process.');

      // Take the actual screenshot
      _p.render(options.output, options.renderOptions || {}).then(res => {
        debug('Ended the screenshot rendering process.', res);
        callback(null, options.output);
        _ph.exit();
      });
    });
  }).catch(callback);
};

// // Export module
module.exports = webpageCapture;
