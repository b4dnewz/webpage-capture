'use strict';

import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import url from 'url';
import {performance} from 'perf_hooks';
import {EventEmitter} from 'events';
import puppeteer from 'puppeteer';
import devices from './devices';
import agents from './agents';

const isViewportConform = _.conforms({
  width: _.isNumber,
  height: _.isNumber
});

const viewportStringPattern = /^(\d{1,4})(?:x)?(\d{1,4})?$/;

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
  onlySuccess: false,
  outputDir: process.cwd()
};

class WebpageCapture extends EventEmitter {
  constructor(opts = {}) {
    super();

    this.page = null;

    this.options = _.merge({}, defaultOptions, opts);
    this.counter = 0;

    this.styles = [];
    this.scripts = [];

    // The user agents utility module
    this.agents = agents;

    // Check if the given output folder exists
    try {
      fs.accessSync(this.options.outputDir, fs.constants.W_OK);
    } catch (e) {
      console.error('The output directory', this.options.outputDir, 'does not exist.');
      process.exit(1);
    }
  }

  /**
   * Construct the file output path from the given input
   * which can be a url, a string with name or something else
   * or an object with name property, otherwise create a custom name
   * based on execution counter and current timestamp
   */
  getOutputPath(input, type) {
    const parts = [];
    switch (typeof input) {
      case 'string': {
        const parsedUrl = url.parse(input);
        if (!parsedUrl.hostname || parsedUrl.hostname === '') {
          parts.push(String(this.counter).padStart(4, '0'));
        } else {
          parts.push(parsedUrl.hostname);
        }
        break;
      }
      case 'object':
        parts.push(input.name || String(this.counter).padStart(4, '0'));
        break;
      default:
        break;
    }
    parts.push(Date.now());
    return path.resolve(this.options.outputDir, `${parts.join('-')}.${type}`);
  }

  /**
   * Parse the given input and tries to extract the viewport object
   * as is digested from puppeteer. This method can accept various
   * input types including strings, objects, arrays and numbers
   */
  getViewportObject(input) {
    let viewport = null;

    if (_.isString(input)) {
      // Test if the string match "0000x0000" or "0000" and construct
      // the viewport object using the result of the match
      if (viewportStringPattern.test(input)) {
        const [, width, height] = viewportStringPattern.exec(input);
        viewport = {
          viewport: {
            width: parseInt(width, 10),
            height: parseInt(height || width, 10),
            deviceScaleFactor: 1
          }
        };
      } else {
        input = input.replace(/\s+/g, '-').toLowerCase();
        viewport = _.find(devices, {name: input});
        if (typeof viewport === 'undefined') {
          console.warn(`The viewport "${input}" does not exist, using default config.`);
          viewport = {viewport: defaultViewport};
        }
      }
    } else if (_.isArray(input)) {
      viewport = input.map(v => this.getViewportObject(v));
    } else if (_.isObject(input) && isViewportConform(input)) {
      viewport = {viewport: input};
    } else if (_.isNumber(input)) {
      viewport = {
        viewport: {
          width: input,
          height: input,
          deviceScaleFactor: 1
        }
      };
    } else {
      console.warn('Invalid viewport option value:', input);
    }

    return viewport;
  }

  /**
   * Prepare the browser instance, spawn a new page
   * and set the default viewport and configurations
   */
  async prepare() {
    this.browser = await puppeteer.launch({
      headless: !this.options.debug,
      slowMo: 1000,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    // Prepare the default page
    this.page = await this.browser.newPage();

    if (this.options.timeout) {
      this.page.setDefaultNavigationTimeout(this.options.timeout);
    }

    if (this.options.viewport) {
      const viewport = this.getViewportObject(this.options.viewport);
      await this.page.emulate(viewport);
    } else {
      await this.page.setViewport(defaultViewport);
    }

    if (_.isObject(this.options.headers)) {
      await this.page.setExtraHTTPHeaders(this.options.headers);
    }
  }

  /**
   * Reset all the variables and closes the browser instance
   */
  async close() {
    this.counter = 0;
    await this.browser.close();
    this.browser = null;
    this.page = null;
  }

  async capture(sources, opts = {}) {
    if (_.isUndefined(sources)) {
      console.warn('Invalid capture sources.');
      return;
    }

    if (sources.length === 0) {
      return;
    }

    if (!this.browser) {
      await this.prepare();
    }

    // Ensure default options
    opts = _.merge({
      type: 'png',
      options: {}
    }, opts);

    // Get the sources to capture
    sources = _.isArray(sources) ? sources : [sources];

    // Override the default agent
    if (opts.userAgent) {
      if (opts.userAgent === 'random') {
        opts.userAgent = this.agents.random();
      }
      await this.page.setUserAgent(opts.userAgent);
    }

    // Loop each source, load it and capture it in various formats
    const results = [];
    for (let i = 0; i < sources.length; i++) {
      const current = i + 1;
      const source = sources[i];
      const outPath = this.getOutputPath(source, opts.type);
      const result = {
        url: source,
        path: outPath,
        capturedAt: Date.now()
      };

      // Emit the capture start event with current array element
      this.emit('capture:start', {
        ...result,
        total: sources.length,
        current: current,
        remaining: sources.length - current
      });

      const startTime = performance.now();

      try {
        await this.execute(source, opts);
      } catch (e) {
        console.warn('Page capture error', e);
      }

      result.duration = performance.now() - startTime;

      // Increase the global captures counter
      this.counter++;

      // Emit the capture end event with the current element
      this.emit('capture:end', {
        ...result,
        total: sources.length,
        current: current,
        remaining: sources.length - current
      });

      // Add the element to the results array
      results.push(result);
    }

    return results;
  }

  async execute(source, options) {
    let viewports = null;
    if (!options.viewport) {
      await this.renderOutput(source, options);
      return;
    }

    viewports = this.getViewportObject(options.viewport);
    if (!viewports && this.page.viewport() !== defaultViewport) {
      console.log('Invalid viewport, skipping page capture.');
      return;
    }

    // Capture the page in each emulated viewport
    viewports = _.isArray(viewports) ? viewports : [viewports];
    for (const viewport of viewports) {
      if (viewport) {
        if (viewport.userAgent) {
          await this.page.emulate(viewport);
        } else {
          await this.page.setViewport(viewport.viewport);
        }
      }
      await this.renderOutput(source, options);
    }
  }

  async renderOutput(source, options) {
    await this.page.goto(source, {waitUntil: this.options.waitUntil || 'load'});

    // Optionally wait for a selector or certain amount of time
    if (options.waitUntil || options.waitFor) {
      const waitCondition = options.waitUntil || options.waitFor;
      await this.page.waitFor(waitCondition, {timeout: this.options.timeout});
    }

    // Get output path and capture to file
    const output = this.getOutputPath(source, options.type);
    const element = options.captureSelector ? await this.page.$(options.captureSelector) : this.page;
    switch (options.type) {
      case 'html': {
        const htmlContent = await this.page.content();
        fs.writeFileSync(output, htmlContent, 'utf8');
        break;
      }
      case 'pdf': {
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
      case 'png': {
        const opts = _.assign({
          // Space for any default option
        }, options.options);
        await element.screenshot({
          ...opts,
          path: output
        });
        break;
      }
      default:
        console.warn('Invalid type option value:', options.type);
        break;
    }
  }
}

export default WebpageCapture;
