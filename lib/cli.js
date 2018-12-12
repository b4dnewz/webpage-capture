#!/usr/bin/env node

'use strict';

const _ = require('lodash');
const fs = require('fs');
const ora = require('ora');
const {version, author} = require('../package.json');
const program = require('commander');
const common = require('../dist/common');
const devices = require('../dist/devices').default;
const WebpageCapture = require('../dist').default;

// Print program banner
console.log(String.raw`
                _                     _
               | |                   | |
  __      _____| |__   ___ __ _ _ __ | |_ _   _ _ __ ___
  \ \ /\ / / _ \ '_ \ / __/ _  | '_ \| __| | | |  __/ _ \
   \ V  V /  __/ |_) | (_| (_| | |_) | |_| |_| | | |  __/
    \_/\_/ \___|_.__/ \___\__,_| .__/ \__|\__,_|_|  \___|
                               | |
        capture the web easily |_| from the command line

  v${version} by ${author}

  Take screenshots or create pdf of your favourite webpages
  with many options and using the engine you prefer most.
  This program is made by developer for developers, if you
  want to contribute visit the project page on GitHub.
`);

// Configure the program
program
  .name('webcapture')
  .version(version)
  .usage('[options] <targets...>')
  .option('-d, --debug', 'Enable the debug mode to print useful logs')
  .option('-c, --crop', 'Crop the screenshot as the viewport size')
  .option('-o, --output-dir <path>', 'Where to render the output files')
  .option('-t, --timeout <number>', 'Sets the default timeout')
  .option('-s, --selector <name>', 'The capture element selector')
  .option(
    '-f, --format <name>',
    'Use a different output format',
    common.validateFormat,
    'png'
  )
  .option(
    '-v, --viewport <name...>',
    'Comma separated list of viewports',
    common.validateViewport,
    'desktop'
  )
  .option(
    '--viewport-category <name>',
    'Capture all devices included in viewport category'
  )
  .parse(process.argv);

// Prepare the input arguments
program.args = _(program.args).map(i => {
  if (i.endsWith('.html')) {
    return fs.readFileSync(i, 'utf-8');
  }
  if (i.endsWith('.txt')) {
    return fs.readFileSync(i, 'utf-8').trim().split(/\r\n/g);
  }
  return i;
}).flatten().value();

// Get viewport groups by category based on their properties
if (program.viewportCategory) {
  switch (program.viewportCategory) {
    case 'desktop':
      program.viewport = _.filter(devices, ['viewport.isMobile', false]);
      break;
    case 'touch':
      program.viewport = _.filter(devices, ['viewport.hasTouch', true]);
      break;
    case 'mobile':
      program.viewport = _.filter(devices, ['viewport.isMobile', true]);
      break;
    case 'landscape':
      program.viewport = _.filter(devices, ['viewport.isLandscape', true]);
      break;
    default:
      console.log('Invalid viewport category', program.viewportCategory);
      break;
  }
}

// Init the webpage capturer
const capturer = new WebpageCapture({
  debug: program.debug,
  timeout: program.timeout,
  outputDir: program.outputDir
});

const spinner = ora({
  spinner: 'dots',
  text: 'Starting the capture process..'
}).start();

capturer.on('capture:start', data => {
  spinner.color = 'yellow';
  spinner.start(`Capturing ${data.url}`);
});

capturer.on('capture:warn', data => {
  spinner.text = `WARN: ${data}`;
});

capturer.on('capture:end', data => {
  spinner.succeed(`Captured output ${data.path}`);
});

capturer.capture(program.args, {
  type: program.format,
  viewport: program.viewport,
  captureSelector: program.selector
}).catch(console.error).then(() => {
  spinner.stop();
  return capturer.close();
});
