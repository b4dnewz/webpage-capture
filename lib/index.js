'use strict';

// Script dependencies
const pkg = require('../package.json');
const debug = require('debug')(pkg.name);
const url = require('url');
const phantom = require('phantom');
const async = require('async');

// Phantomjs render supported formats
const supportedFormats = ['pdf', 'png', 'jpeg', 'bmp', 'ppm'];

// PhantomJS instance options
const phantomOptions = ['--ignore-ssl-errors=yes'];

// Default script options
const defaults = {
  onlySuccess: false,
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
  },
  userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36'
};

// Evaluate the page against custom options or scripts
const evaluatePage = (page, options) => {
  debug('Evaluating phantomjs page to run optional scripts.');
  page.evaluate(function (options) {
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
  }, options);
};

// Load the url and take a screenshot
const renderAsHTML = (page, content, options) => {
  return new Promise((resolve, reject) => {
    page.property('content', content)
      .then(() => {
        // Evaluate resulting page
        evaluatePage(page, options);
        // Take the actual screenshot
        page.render(options.output, options.renderOptions).then(() => {
          debug('Ended the screenshot rendering process.');
          resolve(options.output);
        });
      }).catch(reject);
  });
};

// Load the url and take a screenshot
const renderAsURL = (page, url, options) => {
  return new Promise((resolve, reject) => {
    page.open(url)
      .then(status => {
        // Check the response status
        if (status !== 'success') {
          return reject(new Error(`The response has not a success status: ${status}`));
        }
        // Evaluate resulting page
        evaluatePage(page, options);
        // Take the actual screenshot
        page.render(options.output, options.renderOptions).then(() => {
          debug('Ended the screenshot rendering process.');
          resolve(options.output);
        });
      });
  });
};

// Open input as a string
const openFromString = (page, string, options) => {
  // Try to parse string as url
  let urlObject = url.parse(string);
  let promise = null;

  // If is a valid url
  if (urlObject.hostname) {
    debug('Rendering input string as url.');
    // Ensure output property
    options.output = `./output/${urlObject.hostname}.${options.renderOptions.format}`;
    promise = renderAsURL(page, url.format(urlObject), options);
  } else {
    debug('Rendering input string as HTML body.');
    // Ensure output property
    options.output = `./output/${Date.now()}.${options.renderOptions.format}`;
    promise = renderAsHTML(page, string, options);
  }

  return promise;
};

// Open input as array of entries
// the entries can be either string or objects
const openFromArray = (page, array, options) => {
  return new Promise((resolve, reject) => {
    async.mapSeries(array, (entry, cb) => {
      // If array entry is a string
      if (typeof entry === 'string') {
        openFromString(page, entry, options)
          .then(res => {
            cb(null, res);
          }).catch(err => {
            cb(null, {
              error: err
            });
          });
      }

      // If array entry is an object
      if (typeof entry === 'object') {
        openFromString(page, entry.url || entry.body, options)
          .then(res => {
            cb(null, res);
          }).catch(err => {
            cb(null, {
              error: err
            });
          });
      }
    }, (err, response) => {
      if (err) {
        return reject(err);
      }
      resolve(response);
    });
  });
};

// Main script
const webpageCapture = (input, options = {}, callback) => {
  debug('Booting %o', pkg.name);

  // Extend with default options
  options = Object.assign({}, defaults, options);

  // Ensure is lower cased
  options.renderOptions.format = options.renderOptions.format.toLowerCase();

  // Check for  non supported render format
  if (supportedFormats.indexOf(options.renderOptions.format) === -1) {
    throw new Error(`The selected output format is not valid: ${options.renderOptions.format}`);
  }

  // Init phantomjs variables
  let _p;
  let _ph;

  // Init phantom module
  debug('Starting new phantomjs instance.');
  phantom.create(phantomOptions, {
    logLevel: 'error'
  }).then(ph => {
    debug('Creating phantomjs browser page.');
    _ph = ph;
    return _ph.createPage();
  }).then(p => {
    debug('Created phantomjs browser page.');
    _p = p;

    // Optionally crop the rendered area
    if (options.crop) {
      _p.property('clipRect', Object.assign(options.clipRect, {
        width: options.viewportSize.width,
        height: options.viewportSize.height
      }));
    } else {
      _p.property('clipRect', options.clipRect);
    }

    // Listen to resources error for the current domain
    _p.on('onResourceError', function (res) {
      if (options.onlySuccess) {
        debug('An error occurred with resouce at url:', res.url);
        // Stop the page loading
        _p.stop();
      }
    });
  }).then(() => {
    debug('Setting phantomjs instance options.');
    return Promise.all([
      _p.setting('userAgent', options.userAgent),
      _p.property('viewportSize', options.viewportSize)
    ]);
  }).then(() => {
    return new Promise((resolve, reject) => {
      // Execute input as single string
      if (typeof input === 'string') {
        openFromString(_p, input, options)
          .then(resolve)
          .catch(reject);
      }

      // Execute input as array of multiple inputs
      if (Array.isArray(input)) {
        openFromArray(_p, input, options)
          .then(resolve)
          .catch(reject);
      }
    });
  }).then(result => {
    callback(null, result);
  }).catch(callback).then(() => {
    // Ensure phantomjs is properly closed after all
    // otherwise it will stay alive for life
    _ph.exit();
  });
};

// // Export module
module.exports = webpageCapture;
