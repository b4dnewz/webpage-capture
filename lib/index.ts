import {EventEmitter} from "events";
import fs from "fs";
import _ from "lodash";
import mkdirp from "mkdirp";
import path from "path";
import {performance} from "perf_hooks";
import URL from "url";

import puppeteer from "puppeteer";
import {Device, Viewport} from "puppeteer/DeviceDescriptors";

import {defaultOptions, defaultViewport} from "./config";
import {DeviceNames} from "./devices";

import {getViewport, ViewportInput} from "./utils/get-viewport";
import prepareArguments from "./utils/prepare-arguments";
import prepareScriptOptions from "./utils/prepare-script-options";
import prepareViewports from "./utils/prepare-viewports";
import {isDevice} from "./utils/type-guards";
import {isValidHTML, validateType} from "./utils/validators";

type DeviceOrViewport = Device | Viewport;
type OutputOptions = puppeteer.Base64ScreenShotOptions | puppeteer.PDFOptions;

export namespace WebpageCapture {

  export interface Options {

    /**
     * Enable the debug headfull mode
     */
    debug?: boolean;

    /**
     * Path to a custom output directory
     */
    outputDir?: string;

    /**
     * Additional arguments to pass to the browser instance.
     * The list of Chromium flags can be found here.
     */
    launchArgs?: string[];

    /**
     * Default timeout value for requests
     */
    timeout?: number;

    /**
     * The default viewport to use in case not specified
     */
    viewport?: DeviceNames | puppeteer.Viewport;

  }

  export interface InstanceOptions extends RequestOptions, Pick<Options, Exclude<keyof Options, "viewport">> {
    viewport: DeviceOrViewport;
  }

  export interface RequestOptions {

    /**
     * Headers to be added on request
     */
    headers?: {
      [key: string]: string,
    };

    /**
     * The request timeout
     */
    timeout?: number;

    scripts?: any[];

    styles?: any[];

    waitUntil?: puppeteer.LoadEvent;

  }

  export interface CaptureOptions extends RequestOptions {

    /**
     * The output format type
     */
    type?: CaptureType;

    /**
     * Headers to be added on request
     */
    headers?: {
      [key: string]: string,
    };

    /**
     * Viewport to capture
     */
    viewport?: ViewportInput|ViewportInput[];

    /**
     * A category of viewports to capture
     */
    viewportCategory?: string;

    /**
     * The request timeout
     */
    timeout?: number;

    /**
     * A string selector to capture on page
     */
    selector?: string;

    /**
     * Set the wait until event
     */
    waitUntil?: puppeteer.LoadEvent;

    /**
     * Waits for a defined time or selector
     */
    waitFor?: number | string;

    scripts?: any[];

    styles?: any[];

    /**
     * Additional capture options passed to puppeteer
     */
    options?: OutputOptions;

  }

  export type CaptureType = "buffer" | "base64" | "html" | "pdf" | "jpeg" | "png";

  export interface RunOptions extends Pick<CaptureOptions, Exclude<keyof CaptureOptions, "viewport"|"type">> {
    type: CaptureType;
    viewport?: ViewportInput|ViewportInput[];
  }

  export interface ExecutionOptions extends Pick<CaptureOptions, Exclude<keyof CaptureOptions, "viewport"|"type">> {
    type: CaptureType;
    viewport?: DeviceOrViewport|DeviceOrViewport[];
  }

  export interface Result {
    input: string;
    output: any;
    duration: number;
    error?: string;
  }

}

export class WebpageCapture extends EventEmitter {

  private browser: puppeteer.Browser;
  private page: puppeteer.Page;

  private options: WebpageCapture.InstanceOptions;
  private counter: number = 0;

  private styles: any[] = [];
  private scripts: any[] = [];

  constructor(opts: WebpageCapture.Options = {}) {
    super();

    // Set internal options
    this.options = {
      ...defaultOptions,
      ...opts,
      viewport: defaultViewport,
    };

    if (opts.viewport) {
      const viewport = getViewport(opts.viewport);
      if (!viewport) {
        throw new Error(
          `Viewport "${opts.viewport}" is not supported.`,
        );
      }
      this.options.viewport = viewport;
    }

    // Ensure the output folder exists or fail
    mkdirp.sync(this.options.outputDir);
  }

  /**
   * Prepare the browser instance, spawn a new page
   * and set the default viewport and configurations
   */
  public async prepare() {
    const {debug, launchArgs} = this.options;
    const launchOpts = {
      headless: !debug,
      slowMo: debug ? 1000 : 0,
      args: launchArgs,
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

    // Set the page viewport
    if (isDevice(this.options.viewport)) {
      await this.page.emulate(this.options.viewport);
    } else {
      await this.page.setViewport(this.options.viewport);
    }
  }

  /**
   * Return a base64 encoded string for a given source
   * it calls capture method internally defaulting some options
   * and it return a single element instead of an array of results
   */
  public async base64(source: string, opts: Partial<WebpageCapture.CaptureOptions> = {}) {
    const [res] = await this.capture(source, _.merge(opts, {
      type: "base64",
    }));
    return res;
  }

  /**
   * Return a binary string buffer for a given source
   * it calls capture method internally defaulting some options
   * and it return a single element instead of an array of results
   */
  public async buffer(source: string, opts: Partial<WebpageCapture.CaptureOptions> = {}) {
    const [res] = await this.capture(source, _.merge(opts, {
      type: "buffer",
    }));
    return res;
  }

  /**
   * Capture the source to file and return the output path
   * it calls capture method internally defaulting some options
   * and it return a single element instead of an array of results
   */
  public async file(source: string, output: string, opts: Partial<WebpageCapture.CaptureOptions> = {}) {
    const ext = path.extname(output).substr(1);
    const [res] = await this.capture(source, _.merge(opts, {
      type: ext || "png",
      name: output,
    }));
    return res;
  }

  /**
   * Prepare the sources and loop through each of them
   * running the capture function with defined options
   * return the results array with capture metadata
   */
  public async capture(sources: string|string[], opts: WebpageCapture.CaptureOptions = {}): Promise<WebpageCapture.Result[]> {
    // Ensure default options
    const options: WebpageCapture.RunOptions = _.merge({
      type: "png",
      options: {},
    }, opts);

    // TODO: Validate execution options
    validateType(options.type);

    if (!this.browser) {
      await this.prepare();
    }

    if (_.isEmpty(sources)) {
      return [];
    }

    // Get the sources to capture
    sources = _.isArray(sources) ? _.uniq(sources) : [sources];
    sources = prepareArguments(sources);

    const results = [];

    // Loop each source, load it and capture it in various formats
    for (let i = 0; i < sources.length; i++) {
      const current = i + 1;
      const source = sources[i];

      // TODO: Check if source is url or html content
      const result: Partial<WebpageCapture.Result> = {
        input: source,
        output: null,
      };

      // Emit the capture start event with current array element
      const startTime = performance.now();
      this.emit("capture:start", {
        ...result,
        total: sources.length,
        current,
        remaining: sources.length - current,
      });

      try {
        const outPath = await this.run(source, options);
        result.output = outPath;
      } catch (e) {
        result.error = e.toString();
        this.emit("capture:error", e);
      }

      // Add the capture duration to the result properties
      result.duration = performance.now() - startTime;

      // Emit the capture end event with the current element
      this.emit("capture:end", {
        ...result,
        total: sources.length,
        current,
        remaining: sources.length - current,
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
  public async close() {
    if (!this.browser) {
      return this;
    }

    await this.browser.close();
    this.browser = null;
    this.page = null;
    return this;
  }

  /**
   * Prepare the page by visiting the url or loading the html content
   * than it optionally load additional script and styles
   */
  private async preparePage(source: string, options: WebpageCapture.ExecutionOptions) {
    const {
      viewport,
      scripts,
      styles,
    } = options;
    const loadOptions = {
      waitUntil: options.waitUntil || this.options.waitUntil || "load",
    };

    // If viewport exists emulate it
    if (viewport && !_.isArray(viewport)) {
      if (isDevice(viewport)) {
        await this.page.emulate(viewport);
      } else {
        await this.page.setViewport(viewport);
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
      for (const style of styles) {
        const opts = prepareScriptOptions(style);
        await this.page.addStyleTag(opts);
      }
    }

    // Optionally apply scripts
    if (_.isArray(scripts)) {
      for (const script of scripts) {
        const opts = prepareScriptOptions(script);
        await this.page.addScriptTag(opts);
      }
    }
  }

  /**
   * Takes the actual screenshot or get the page HTML content
   */
  private async render(source: string, options: WebpageCapture.ExecutionOptions) {
    await this.preparePage(source, options);

    // Optionally wait for a selector or certain amount of time
    if (options.waitUntil || options.waitFor) {
      const waitCondition = options.waitUntil || options.waitFor;
      if (typeof waitCondition  === "number") {
        await this.page.waitFor(waitCondition);
      } else {
        await this.page.waitFor(waitCondition, {
          timeout: this.options.timeout,
        });
      }
    }

    // Get the output file path based on options
    const viewportName = options.viewport && isDevice(options.viewport) && options.viewport.name;
    let output: any = this.getOutPath({
      ...options,
      viewport: viewportName,
      input: source,
    });

    // Select a specific element or default to whole page
    const element = options.selector ?
      await this.page.$(options.selector) :
      this.page;

    // Decide how to capture based on options
    switch (options.type) {
      case "buffer": {
          output = await element.screenshot({
            ...options.options,
            encoding: "binary",
          });
          break;
        }

      case "base64": {
          output = await element.screenshot({
            ...options.options,
            type: "png",
            encoding: "base64",
          });
          break;
        }

      case "html": {
          const htmlContent = await this.page.content();
          fs.writeFileSync(output, htmlContent, "utf8");
          break;
        }

      case "pdf": {
          const opts: puppeteer.PDFOptions = _.assign({
            format: "A4",
          }, options.options);
          await this.page.pdf({
            ...opts,
            path: output,
          });
          break;
        }

      case "jpeg":
      case "png": {
          const opts = _.assign({
            type: options.type,
          }, options.options);
          await element.screenshot({
            ...opts,
            path: output,
          });
          break;
        }

      default:
        throw new Error(`Invalid type option value: ${options.type}`);
    }

    return output;
  }

  /**
   * For a given source and capture options
   * render the output for each desired viewport and settings combination
   */
  private async run(source: string, options: WebpageCapture.RunOptions) {
    let viewports: DeviceOrViewport[];

    if (options.viewportCategory) {
      viewports = prepareViewports(options.viewportCategory);
    } else {
      if (_.isArray(options.viewport)) {
        viewports = options.viewport.map((v) => getViewport(v));
      } else {
        viewports = [getViewport(options.viewport)];
      }
    }

    if (_.isEmpty(viewports)) {
      return this.render(source, {
        ...options,
        viewport: null,
      });
    }

    const results = [];
    for (const viewport of viewports) {
      const out = await this.render(source, {
        ...options,
        viewport,
      });
      results.push(out);
    }
    return results.length === 1 ? results[0] : results;
  }

  /**
   * Construct the file output path from the given input
   * which can be a url, a string with name or something else
   * or an object with name property, otherwise create a custom name
   * based on execution counter and current timestamp
   */
  private getOutPath({
    input,
    name,
    viewport,
    type,
  }: {
    input: any
    name?: string
    viewport?: string
    type: string,
  }) {
    if (name && name !== "") {
      const ext = path.extname(name);
      if (_.isEmpty(ext)) {
        name = `${name}.${type}`;
      }
      return path.resolve(name);
    }

    const parts = [];
    const parsedUrl = URL.parse(input || "");

    // TODO: Add support for custom output template string
    if (!parsedUrl.hostname || parsedUrl.hostname === "") {
      parts.push(String(this.counter).padStart(4, "0"));
    } else {
      parts.push(parsedUrl.hostname);
    }

    parts.push(viewport);
    parts.push(Date.now());

    return path.resolve(
      this.options.outputDir,
      `${parts.filter((p) => p).join("-")}.${type}`,
    );
  }

}
