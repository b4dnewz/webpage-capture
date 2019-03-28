import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import URL from 'url';
import mkdirp from 'mkdirp';
import {performance} from 'perf_hooks';
import {EventEmitter} from 'events';
import puppeteer from 'puppeteer';

import * as _devices from './devices';
import getViewport from './utils/get-viewport';
import prepareViewports from './utils/prepare-viewports';
import prepareArguments from './utils/prepare-arguments';
import prepareScriptOptions from './utils/prepare-script-options';
import {isValidHTML, validateType} from './utils/validators';

const defaultViewport = {
  width: 1280,
  height: 800,
  deviceScaleFactor: 1
};

const defaultOptions = {
  headers: false,
  viewport: false,
  debug: false,
  timeout: 30000,
  outputDir: process.cwd(),
  launchArgs: []
};

class WebpageCapture extends EventEmitter {
  constructor(opts = {}) {
    super();

    this.browser = null;
    this.page = null;

    this.options = _.merge({}, defaultOptions, opts);
    this.counter = 0;

    this.styles = [];
    this.scripts = [];

    // Ensure the output folder exists or fail
    mkdirp.sync(this.options.outputDir);
  }

  /**
   * Prepare the browser instance, spawn a new page
   * and set the default viewport and configurations
   */
  async prepare() {
    const {
      debug,
      launchArgs
    } = this.options;
    const launchOpts = {
      headless: !debug,
      slowMo: debug ? 1000 : 0,
      args: launchArgs
    };

    // Launch the browser instance
    this.browser = await puppeteer.launch(launchOpts);

    // Get the default about:blank page
    this.page = (await this.browser.pages())[0];

    // Optionally set the default headers
    if (this.options.headers) {
      await this.page.setExtraHTTPHeaders(this.options.headers);
    }

    // Optionally override the default navigation timeout
    if (this.options.timeout) {
      this.page.setDefaultNavigationTimeout(this.options.timeout);
    }

    // Optionally try to set the given default viewport
    if (this.options.viewport) {
      const viewport = getViewport(this.options.viewport);
      if (!viewport || viewport === null) {
        this.emit('capture:warn', `Invalid viewport option value: ${this.options.viewport}`);
        this.options.viewport = false;
        await this.page.setViewport(defaultViewport);
      } else {
        await this.page.emulate(viewport);
      }
    }
  }

  /**
   * Return a base64 encoded string for a given source
   * it calls capture method internally defaulting some options
   * and it return a single element instead of an array of results
   */
  async base64(source, opts = {}) {
    const [res] = await this.capture(source, _.merge(opts, {
      type: 'base64'
    }));
    return res;
  }

  /**
   * Return a binary string buffer for a given source
   * it calls capture method internally defaulting some options
   * and it return a single element instead of an array of results
   */
  async buffer(source, opts = {}) {
    const [res] = await this.capture(source, _.merge(opts, {
      type: 'buffer'
    }));
    return res;
  }

  /**
   * Capture the source to file and return the output path
   * it calls capture method internally defaulting some options
   * and it return a single element instead of an array of results
   */
  async file(source, output, opts = {}) {
    const ext = path.extname(output).substr(1);
    const [res] = await this.capture(source, _.merge(opts, {
      type: ext || 'png',
      name: output
    }));
    return res;
  }

  /**
   * Prepare the sources and loop through each of them
   * running the capture function with defined options
   * return the results array with capture metadata
   */
  async capture(sources, opts = {}) {
    if (!this.browser) {
      await this.prepare();
    }

    if (_.isEmpty(sources)) {
      return [];
    }

    // Ensure default options
    opts = _.merge({
      type: 'png',
      options: {}
    }, opts);

    // TODO: Validate execution options
    validateType(opts.type);

    // Get the sources to capture
    sources = _.isArray(sources) ? _.uniq(sources) : [sources];
    sources = prepareArguments(sources);

    // Loop each source, load it and capture it in various formats
    const results = [];
    for (let i = 0; i < sources.length; i++) {
      const current = i + 1;
      const source = sources[i];

      // TODO: Check if source is url or html content
      const result = {
        input: source,
        output: null,
      };

      // Emit the capture start event with current array element
      const startTime = performance.now();
      this.emit('capture:start', {
        ...result,
        total: sources.length,
        current: current,
        remaining: sources.length - current
      });

      try {
        const outPath = await this.run(source, opts);
        result.output = outPath;
      } catch (e) {
        result.error = e.toString();
        this.emit('capture:error', e);
      }

      // Add the capture duration to the result properties
      result.duration = performance.now() - startTime;

      // Emit the capture end event with the current element
      this.emit('capture:end', {
        ...result,
        total: sources.length,
        current: current,
        remaining: sources.length - current
      });

      // Increase the global captures counter
      this.counter++;

      // Add the element to the results array
      results.push(result);
    }

    return results;
  }

  /**
   * Reset all the variables and closes the browser instance
   */
  async close() {
    if (!this.browser) {
      return;
    }

    await this.browser.close();
    this.browser = null;
    this.page = null;
  }
}

/**
 * Prepare the page by visiting the url or loading the html content
 * than it optionally load additional script and styles
 */
WebpageCapture.prototype.preparePage = async function(source, options) {
  const {
    viewport,
    scripts,
    styles
  } = options;
  const loadOptions = {
    waitUntil: this.options.waitUntil || 'load'
  };

  // If viewport exists emulate it
  if (viewport) {
    if (viewport.userAgent) {
      await this.page.emulate(viewport);
    } else {
      await this.page.setViewport(viewport.viewport);
    }
  }

  // Load the source into page
  if (isValidHTML(source)) {
    await this.page.setContent(source, loadOptions);
  } else {
    await this.page.goto(source, loadOptions);
  }

  // Optionally apply styles
  if (_.isArray(styles)) {
    for (let i = 0; i < styles.length; i++) {
      const opts = prepareScriptOptions(styles[i]);
      await this.page.addStyleTag(opts);
    }
  }

  // Optionally apply scripts
  if (_.isArray(scripts)) {
    for (let i = 0; i < scripts.length; i++) {
      const opts = prepareScriptOptions(scripts[i]);
      await this.page.addScriptTag(opts);
    }
  }
};

/**
 * Construct the file output path from the given input
 * which can be a url, a string with name or something else
 * or an object with name property, otherwise create a custom name
 * based on execution counter and current timestamp
 */
WebpageCapture.prototype.getOutPath = function({
  input,
  name,
  viewport,
  type
} = {}) {
  if (name && name !== '') {
    const ext = path.extname(name);
    if (_.isEmpty(ext)) {
      name = `${name}.${type}`;
    }
    return path.resolve(name);
  }

  const parts = [];
  const parsedUrl = URL.parse(input || '');

  // TODO: Add support for custom output template string
  if (!parsedUrl.hostname || parsedUrl.hostname === '') {
    parts.push(String(this.counter).padStart(4, '0'));
  } else {
    parts.push(parsedUrl.hostname);
  }
  parts.push(viewport);
  parts.push(Date.now());

  return path.resolve(
    this.options.outputDir,
    `${parts.filter(p => p).join('-')}.${type}`
  );
};

/**
 * For a given source and capture options
 * render the output for each desired viewport and settings combination
 */
WebpageCapture.prototype.run = async function(source, options) {
  if (options.viewportCategory) {
    options.viewport = prepareViewports(options.viewportCategory);
  }

  if (!options.viewport || options.viewport.length === 0) {
    return this.render(source, options);
  }

  // If viewport is not valid skip this run
  let viewports = getViewport(options.viewport);
  if (!viewports) {
    throw new Error(`Invalid viewport "${options.viewport}"`);
  }

  // Capture the page in each emulated viewport
  viewports = _.isArray(viewports) ? viewports : [viewports];

  const results = [];
  for (const viewport of viewports) {
    const out = await this.render(source, {
      ...options,
      viewport: viewport
    });
    results.push(out);
  }

  return results.length === 1 ? results[0] : results;
};

/**
 * Takes the actual screenshot or get the page HTML content
 */
WebpageCapture.prototype.render = async function(source, options) {
  await this.preparePage(source, options);

  // Optionally wait for a selector or certain amount of time
  if (options.waitUntil || options.waitFor) {
    const waitCondition = options.waitUntil || options.waitFor;
    await this.page.waitFor(waitCondition, {
      timeout: this.options.timeout
    });
  }

  // Get the output file path based on options
  let output = this.getOutPath({
    ...options,
    viewport: options.viewport && options.viewport.name,
    input: source
  });

  // Select a specific element or default to whole page
  const element = options.captureSelector ?
    await this.page.$(options.captureSelector) :
    this.page;

  // Decide how to capture based on options
  switch (options.type) {
    case 'buffer':
      {
        const opts = {
          ...options.options,
          encoding: 'binary'
        };
        output = await element.screenshot(opts);
        break;
      }

    case 'base64':
      {
        const opts = {
          ...options.options,
          type: 'png',
          encoding: 'base64'
        };
        output = await element.screenshot(opts);
        break;
      }

    case 'html':
      {
        const htmlContent = await this.page.content();
        fs.writeFileSync(output, htmlContent, 'utf8');
        break;
      }

    case 'pdf':
      {
        const opts = _.assign({
          format: 'A4'
        }, options.options);
        await this.page.pdf({
          ...opts,
          path: output
        });
        break;
      }

    case 'jpeg':
    case 'png':
      {
        const opts = _.assign({
          type: options.type
        }, options.options);
        await element.screenshot({
          ...opts,
          path: output
        });
        break;
      }

    default:
      throw new Error(`Invalid type option value: ${options.type}`);
  }

  return output;
};

/**
 * Export module
 */
export default WebpageCapture;

/**
 * Export available devices names
 */
export const devices = _.map(_devices, ['name']);
