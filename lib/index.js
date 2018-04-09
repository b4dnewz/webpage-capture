'use strict';

const pkg = require('../package.json');
const debug = require('debug')(pkg.name);
const url = require('url');
const phantom = require('phantom');
const async = require('async');
const agents = require('./agents');
const supportedViewports = require('./viewports.json');
const supportedFormats = ['pdf', 'png', 'jpeg', 'bmp', 'ppm'];
const phantomOptions = ['--ignore-ssl-errors=yes'];

const defaults = {
  debug: false,
  output: './output',
  outputType: 'file',
  onlySuccess: false,
  whiteBackground: true,
  renderOptions: {
    format: 'png',
    quality: 80
  },
  crop: false,
  clipRect: {
    top: 0,
    left: 0
  },
  viewport: 'desktop',
  viewportSize: {
    width: 1280,
    height: 1024
  },
  userAgent: agents.randomByName(agents.randomBrowser())
};

/**
 * Custom Object.assign like function to merge only defined properties
 * @param  {object} dest The destination object
 * @param  {array} src   An array of multiple object to merge in order
 * @return {object}      The final object with merged properties
 */
const mergeDefined = (dest, ...src) => {
  src.forEach(s => {
    Object.keys(s).forEach(k => {
      if (!Object.prototype.hasOwnProperty.call(s, k) || typeof s[k] === 'undefined') {
        return;
      }
      if (typeof s[k] === 'object') {
        dest[k] = mergeDefined(dest[k] || {}, s[k]);
        return;
      }
      dest[k] = s[k];
    });
  });
  return dest;
};

const validateURL = str => {
  let s = url.parse(str);
  return (s.hostname && s.hostname !== '');
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

// Render the page to output
const renderOutput = (page, options, next) => {
  debug('Rendering output to: %s', options.output);
  debug('Output type is %s', options.outputType);
  switch (options.outputType) {
    case 'file':
      page.render(options.output, options.renderOptions).then(() => {
        debug('Ended the screenshot rendering process.');
        next(options.output);
      });
      break;
    case 'base64':
      page.renderBase64('PNG').then(next);
      break;
    default:
      next(null);
  }
};

// Load the url and take a screenshot
const renderAsHTML = (page, content, options) => {
  debug('Rendering input string as HTML body.');
  return new Promise((resolve, reject) => {
    page.property('content', content)
      .then(() => {
        // Temporary function to be called once
        let fn = function (status) {
          page.off('onLoadFinished', fn);
          if (status !== 'success') {
            return reject(new Error(`The response has not a success status: ${status}`));
          }

          // Evaluate resulting page
          evaluatePage(page, options);
          renderOutput(page, options, resolve);
        };

        // Add the onLoadFinished callback
        page.on('onLoadFinished', fn);
      });
  });
};

// Load the url and take a screenshot
const renderAsURL = (page, url, options) => {
  debug('The input is a valid URL, opening in browser.');
  return new Promise((resolve, reject) => {
    page.open(url)
      .then(status => {
        if (status !== 'success') {
          return reject(new Error(`The response has not a success status: ${status}`));
        }

        // Evaluate resulting page
        evaluatePage(page, options);
        renderOutput(page, options, resolve);
      });
  });
};

// Open input as a string
const openFromString = (page, string, opts, name = Date.now()) => {
  let urlObject = url.parse(string);
  let promise = null;

  let filename = [
    `${opts.output}/`,
    urlObject.hostname || name,
    `-${opts.viewportSize.width}x${opts.viewportSize.height}`,
    `-${opts.viewport}`,
    `.${opts.renderOptions.format}`
  ].join('');

  let options = Object.assign({}, opts, {
    output: filename.trim().toLowerCase()
  });
  debug('Output path will be: %s', options.output);

  if (validateURL(string)) {
    promise = renderAsURL(page, string, options);
  } else {
    promise = renderAsHTML(page, string, options);
  }

  return promise;
};

// Open input as array of entries
// the entries can be either string or objects
const openFromArray = (page, array, options) => {
  return new Promise((resolve, reject) => {
    async.mapSeries(array, (entry, cb) => {
      if (typeof entry === 'string') {
        openFromString(page, entry, options)
          .then(res => {
            cb(null, res);
          }).catch(err => {
            cb(null, {
              error: err.toString()
            });
          });
      }

      if (typeof entry === 'object') {
        let value = entry.url || entry.body;
        if (!value || value === '') {
          return cb(null, entry);
        }
        openFromString(page, value, options, entry.name)
          .then(res => {
            // Set entry output path
            entry.output = res;
            cb(null, entry);
          }).catch(err => {
            // Update entry error
            entry.error = err.toString();
            cb(null, entry);
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
  if (typeof input === 'undefined' || input === '' || input.length === 0) {
    throw new Error('The target can not be empty.');
  }

  // Programmatically enable the debug features
  if (options.debug) {
    debug.enabled = true;
  }

  debug('Booting %o', pkg.name);

  // Extend with default options
  options = mergeDefined({}, defaults, options);

  debug('Execution options:');
  debug(options);

  if (options.userAgent === 'random') {
    options.userAgent = agents.random();
  } else if (Object.keys(agents.agents).includes(options.userAgent)) {
    options.userAgent = agents.randomByName(options.userAgent);
  }

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
  debug('Creating a new phantomjs instance.');
  phantom.create(phantomOptions, {
    logLevel: options.debug ? 'debug' : 'error'
  }).then(ph => {
    debug('Creating a new browser page.');
    _ph = ph;
    return _ph.createPage();
  }).then(p => {
    _p = p;

    // Optionally crop the rendered area
    if (options.crop) {
      _p.property('clipRect', mergeDefined(options.clipRect, {
        width: options.viewportSize.width,
        height: options.viewportSize.height
      }));
    } else {
      _p.property('clipRect', options.clipRect);
    }

    // Listen to resources error for the current domain
    _p.on('onResourceError', function () {
      // TODO: This method should check if only resources coming directly from the domain
      // of the request are involved and in that case fail, any other case just ignore
      if (options.onlySuccess) {
        debug('Stop the loading since the resource produced error.');
        _p.stop();
      }
    });
  }).then(() => {
    debug('Setup page instance options.');
    return Promise.all([
      _p.setting('userAgent', options.userAgent || ''),
      _p.property('viewportSize', options.viewportSize)
    ]);
  }).then(() => {
    debug('Parsing the input to decide what to do.');
    return new Promise((resolve, reject) => {
      if (typeof input === 'string') {
        openFromString(_p, input, options)
          .then(resolve)
          .catch(reject);
      }

      if (Array.isArray(input)) {
        openFromArray(_p, input, options)
          .then(resolve)
          .catch(reject);
      }
    });
  }).then(result => {
    callback(null, result);
  }).catch(callback).then(() => _ph.exit());
};

// // Export module
module.exports = webpageCapture;
module.exports.agents = agents;

// Export module supported options
module.exports.supportedFormats = supportedFormats;
module.exports.supportedViewports = supportedViewports;
