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
  outputDir: './output',
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
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36'
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
      if (typeof s[k] === 'object' && Array.isArray(s[k]) === false) {
        dest[k] = mergeDefined(dest[k] || {}, s[k]);
        return;
      }
      dest[k] = s[k];
    });
  });
  return dest;
};

// Validate a string as url
const validateURL = str => {
  let s = url.parse(str);
  return (s.hostname && s.hostname !== '');
};

/**
 * Construct unique filename using execution options
 * current date and current viewport details including sizes
 */
const getFilename = (str, opts, viewport) => {
  const obj = url.parse(str);
  const name = obj.hostname ? `${Date.now()}-${obj.hostname}` : Date.now();
  const parts = [
    `${opts.outputDir}/${name}`,
    `-${viewport.width}x${viewport.height}`
  ];
  if (viewport.name) {
    parts.push(`-${viewport.name}`);
  }
  parts.push(opts.crop ? `-cropped` : `-full`);
  parts.push(`.${opts.renderOptions.format}`);
  return parts.join('').trim().replace(/\s/g, '_').toLowerCase();
};

/**
 * Evaluate css and js scripts on the loaded page
 */
const evaluatePage = (page, options) => {
  debug('Evaluating phantomjs page to run optional scripts.');
  return page.evaluate(function (options) {
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
  }, options);
};

/**
 * Render the loaded page using the options given from the script execution
 */
const renderOutput = async (page, options) => {
  debug('Output type is %s', options.outputType);
  switch (options.outputType) {
    case 'base64':
      debug('Return the base64 encoded page');
      return page.renderBase64('PNG');
    case 'html':
      debug('Return the page HTML content');
      return page.property('content');
    default:
      debug('Rendering output to: %s', options.output);
      return page.render(options.output, options.renderOptions).then(() => {
        debug('The screenshot to file has been taken.');
        return options.output;
      });
  }
};

/**
 * Capture the page output and return the content that can be
 * the output file name, a base64 encoded string or a HTML string
 */
const captureThePage = async (page, options) => {
  await evaluatePage(page, options);
  const output = await renderOutput(page, options);
  return output;
};

// Load the url and take a screenshot
const renderAsHTML = (page, content, options) => {
  debug('Rendering input string as HTML string');
  return new Promise((resolve, reject) => {
    let func = function (status) {
      page.off('onLoadFinished', func);
      if (status !== 'success') {
        return reject(new Error(`The response has not a success status: ${status}`));
      }

      return captureThePage(page, options)
        .then(resolve)
        .catch(reject);
    };

    page.on('onLoadFinished', func).then(function () {
      debug('Trying to load content:', content);
      page.property('content', content)
        .then(function () {
          debug('The HTML content has been loaded.');
        }).catch(err => debug(err));
    }).catch(err => debug(err));
  });
};

// Load the url and take a screenshot
const renderAsURL = (page, url, options) => {
  debug('The input is a valid URL, opening in browser.');
  return page.open(url)
    .then(status => {
      if (status !== 'success') {
        throw new Error(`The response has not a success status: ${status}`);
      }

      return captureThePage(page, options);
    }).catch(err => debug(err));
};

/**
 * Setup the page properties, viewport and user agent to simulate the real client
 */
const setupPage = async (page, options) => {
  debug('Setting up the page properties: %O', options);
  const viewport = {
    width: options.width,
    height: options.height
  };
  await page.setting('userAgent', options.userAgent || defaults.userAgent);
  await page.property('viewportSize', viewport);

  if (options.crop) {
    await page.property('clipRect', Object.assign({
      top: 0,
      left: 0
    }, viewport));
  }
};

/**
 * Render a single input with the given options
 * if the viewport is an array it will take multiple shots
 */
const render = async (input, page, options) => {
  const viewports = options.viewport;
  const results = [];
  for (var i = 0; i < viewports.length; i++) {
    const filename = getFilename(input, options, viewports[i]);
    options.output = filename;
    viewports[i].crop = viewports[i].crop || options.crop;
    await setupPage(page, viewports[i]);
    if (validateURL(input)) {
      results.push(await renderAsURL(page, input, options));
    } else {
      results.push(await renderAsHTML(page, input, options));
    }
  }
  return results.length === 1 ? results[0] : results;
};

// Open input as a string
const openFromString = (page, input, opts) => {
  return render(input, page, opts);
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

  // Force input as an array
  input = Array.isArray(input) ? input : [input];

  // Programmatically enable the debug features
  if (options.debug) {
    debug.enabled = true;
  }

  debug('Booting %o', pkg.name);

  // Extend with default options
  options = mergeDefined({}, defaults, options);

  debug('Execution options:');
  debug(options);

  // Prepare viewports
  if (typeof options.viewport === 'string') {
    options.viewport = [supportedViewports[options.viewport]];
  } else if (Array.isArray(options.viewport)) {
    options.viewport = options.viewport.filter(v => {
      if (typeof v === 'string') {
        return supportedViewports[v];
      }
      if (typeof v === 'object') {
        return true;
      }
      return false;
    }).map(v => {
      if (typeof v === 'string') {
        return supportedViewports[v];
      }
      return v;
    });
  }

  if (options.userAgent === 'random') {
    options.userAgent = agents.random();
  } else if (Object.keys(agents.agents).includes(options.userAgent)) {
    options.userAgent = agents.randomByName(options.userAgent);
  }

  // Check for  non supported render format
  options.renderOptions.format = options.renderOptions.format.toLowerCase();
  if (supportedFormats.indexOf(options.renderOptions.format) === -1) {
    throw new Error(`The selected output format is not valid: ${options.renderOptions.format}`);
  }

  // Init phantomjs variables
  let _p;
  let _ph;

  // Init phantom module
  debug('Creating a new phantomjs instance.');
  phantom.create(phantomOptions, {
    logLevel: options.debug ? 'info' : 'error'
  }).then(ph => {
    debug('Creating a new browser page.');
    _ph = ph;
    return _ph.createPage();
  }).then(p => {
    _p = p;

    // If the onlySuccess option is enabled be sure to stop the page only
    // if resources coming from the page itself are failing, all the other external
    // resources will be ignored since they will not match the regexp test
    _p.on('onResourceError', function (err) {
      if (options.onlySuccess) {
        debug('Stop the loading since the resource produced error.');
        debug('%O', err);
        _p.stop();
      }
    });
  }).then(() => {
    debug('Parsing the input to decide what to do.');
    return openFromArray(_p, input, options);
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
