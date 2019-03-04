import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import URL from 'url';
import mkdirp from 'mkdirp';
import {performance} from 'perf_hooks';
import {EventEmitter} from 'events';
import puppeteer from 'puppeteer';
import devices from './devices';

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
	outputDir: process.cwd()
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
		this.browser = await puppeteer.launch({
			headless: !this.options.debug,
			slowMo: this.options.debug ? 1000 : 0,
			args: ['--no-sandbox', '--disable-setuid-sandbox']
		});

		// Get the default about:blank page
		this.page = (await this.browser.pages())[0];

		if (this.options.timeout) {
			this.page.setDefaultNavigationTimeout(this.options.timeout);
		}

		if (this.options.viewport) {
			const viewport = this.getViewportObject(this.options.viewport);
			if (!viewport || viewport === null) {
				this.emit('capture:warn', `Invalid viewport option value: ${this.options.viewport}`);
				this.options.viewport = false;
				await this.page.setViewport(defaultViewport);
			} else {
				await this.page.emulate(viewport);
			}
		}

		if (_.isObject(this.options.headers)) {
			await this.page.setExtraHTTPHeaders(this.options.headers);
		}
	}

	/**
   * Prepare the sources and loop through each of them
   * running the capture function with defined options
   * return the results array with capture metadata
   */
	async capture(sources, opts = {}) {
		if (_.isEmpty(sources)) {
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
		sources = _.isArray(sources) ? _.uniq(sources) : [sources];

		// Loop each source, load it and capture it in various formats
		const results = [];
		for (let i = 0; i < sources.length; i++) {
			const current = i + 1;
			const source = sources[i];
			const result = {
				url: source,
				path: null
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
				result.path = outPath;
			} catch (e) {
				this.emit('capture:error', e);
				result.path = null;
				result.error = e;
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
		await this.browser.close();
		this.browser = null;
		this.page = null;
	}
}

/**
 * Prepare the option that will be used when adding
 * script or style tags to the current loaded page instance
 */
WebpageCapture.prototype.prepareScriptLoadOptions = function (source) {
	const opts = {};
	if (_.startsWith(source, 'http')) {
		opts.url = source;
	} else if (_.endsWith(source, '.js')) {
		opts.path = source;
	} else {
		opts.content = source;
	}

	return opts;
};

/**
 * Prepare the page by visiting the url or loading the html content
 * than it optionally load additional script and styles
 */
WebpageCapture.prototype.preparePage = async function (source, options) {
	const {viewport, scripts, styles} = options;
	const loadOptions = {
		waitUntil: this.options.waitUntil || 'load'
	};

	if (viewport) {
		if (viewport.userAgent) {
			await this.page.emulate(viewport);
		} else {
			await this.page.setViewport(viewport.viewport);
		}
	}

	if (URL.parse(source).hostname) {
		await this.page.goto(source, loadOptions);
	} else {
		await this.page.setContent(source, loadOptions);
	}

	if (_.isArray(styles)) {
		for (let i = 0; i < styles.length; i++) {
			const opts = this.prepareScriptLoadOptions(styles[i]);
			await this.page.addStyleTag(opts);
		}
	}

	if (_.isArray(scripts)) {
		for (let i = 0; i < scripts.length; i++) {
			const opts = this.prepareScriptLoadOptions(scripts[i]);
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
WebpageCapture.prototype.getOutPath = function ({url, name, viewport, type}) {
	const parts = [];
	const parsedUrl = URL.parse(url || '');
	if (name && name !== '') {
		parts.push(name);
	} else if (!parsedUrl.hostname || parsedUrl.hostname === '') {
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
 * Parse the given input and tries to extract the viewport object
 * as is digested from puppeteer. This method can accept various
 * input types including strings, objects, arrays and numbers
 */
WebpageCapture.prototype.getViewportObject = function (input) {
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
		this.emit('capture:warn', `Invalid viewport option value: ${input}`);
	}

	return viewport;
};

/**
 * For a given source and capture options
 * render the output for each desired viewport and settings combination
 */
WebpageCapture.prototype.run = async function (source, options) {
	if (!options.viewport) {
		const out = await this.render(source, options);
		return out;
	}

	let viewports = this.getViewportObject(options.viewport);
	if (!viewports) {
		return;
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
WebpageCapture.prototype.render = async function (source, options) {
	await this.preparePage(source, options);

	// Optionally wait for a selector or certain amount of time
	if (options.waitUntil || options.waitFor) {
		const waitCondition = options.waitUntil || options.waitFor;
		await this.page.waitFor(waitCondition, {timeout: this.options.timeout});
	}

	// Get output path and capture to file
	const output = this.getOutPath({
		...options,
		viewport: options.viewport && options.viewport.name,
		url: source
	});
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
			this.emit('capture:warn', `Invalid type option value: ${options.type}`);
			return false;
	}

	return output;
};

export default WebpageCapture;
