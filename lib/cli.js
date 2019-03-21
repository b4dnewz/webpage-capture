#!/usr/bin/env node

import * as path from 'path';
import banner from './banner';
import prepareArgs from './utils/prepare-arguments';
import * as validators from './utils/validators';

import WebpageCapture from './index';

import ora from 'ora';
import program from 'commander';

// Print program banner
console.log('\x1B[2J\x1B[0f');
console.log(banner);

// Configure the program
program
	.name('webcapture')
	.usage('[options] <targets...>')
	.option('-d, --debug', 'Enable the debug mode to print useful logs')
	.option('-c, --crop', 'Crop the screenshot as the viewport size')
	.option('-o, --output-dir <path>', 'Where to render the output files')
	.option('-t, --timeout <number>', 'Sets the default timeout')
	.option('-s, --selector <name>', 'The capture element selector')
	.option(
		'-f, --format <name>',
		'Use a different output format',
		validators.validateFormat,
		'png'
	)
	.option(
		'-v, --viewport <name...>',
		'Comma separated list of viewports',
		validators.validateViewport,
		'desktop'
	)
	.option(
		'-V, --viewport-category <name>',
		'Capture all devices included in viewport category'
	)
	.parse(process.argv);

// Exit if no targets
if (program.args.length === 0) {
	console.error('  You must specify one or more targets! \n');
	process.exit();
}

// Prepare the input arguments
program.args = prepareArgs(program.args);

// Create the UI spinner
const spinner = ora({
	spinner: 'dots',
	text: 'Starting the capture process..'
});

// Create a new capturer with given options
const capturer = new WebpageCapture({
	debug: program.debug,
	timeout: program.timeout,
	outputDir: program.outputDir
});

// When a entry capture starts
capturer.on('capture:start', data => {
	spinner.color = 'yellow';
	spinner.start(`Capturing ${data.url}`);
});

// When a entry capture produces a warning
capturer.on('capture:warn', data => {
	spinner.text = `WARN: ${data}`;
});

// When a entry capture ends
capturer.on('capture:end', data => {
	const outPath = path.relative(process.cwd(), data.path);
	const duration = parseFloat(data.duration).toFixed(4);
	spinner.succeed(`Captured to ${outPath} in ${duration}ms`);
});

// Start capture
spinner.start();
capturer.capture(program.args, {
	type: program.format,
	viewport: program.viewport,
	viewportCategory: program.viewportCategory,
	captureSelector: program.selector
}).catch(console.error).then(() => {
	spinner.stop();
	console.log();
	return capturer.close();
});
