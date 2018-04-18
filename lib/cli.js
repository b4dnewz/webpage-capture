#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const {name, version, author, description} = require('../package.json');
const program = require('commander');
const webpageCapture = require('./index');
const agents = require('./agents');

const validateUserAgent = v => {
  console.log('value', v);
  if (Object.keys(agents.agents).includes(v) || v === 'random') {
    return v;
  }
  throw new Error(`User agent ${v} is not supported, check the documentation to see which values are supported`);
};

const validateQuality = v => {
  if (/^[0-9][0-9]?$|^100$/.test(v)) {
    return Number(v);
  }
  throw new Error(`Quality must be a number between 0 and 100`);
};

const validateViewport = v => {
  let viewports = Object.keys(webpageCapture.supportedViewports);
  let inputs = v.split(',');
  inputs.forEach(i => {
    if (!viewports.includes(i)) {
      throw new Error(`Viewport ${i} is not supported, check the documentation to see which values are supported`);
    }
  });
  return inputs;
};

const validateFormat = v => {
  if (webpageCapture.supportedFormats.includes(v)) {
    return v;
  }
  throw new Error(`Format ${v} is not supported, must be one of [${webpageCapture.supportedFormats.join(',')}]`);
};

console.log(String.raw`
                _                     _
               | |                   | |
  __      _____| |__   ___ __ _ _ __ | |_ _   _ _ __ ___
  \ \ /\ / / _ \ '_ \ / __/ _  | '_ \| __| | | |  __/ _ \
   \ V  V /  __/ |_) | (_| (_| | |_) | |_| |_| | | |  __/
    \_/\_/ \___|_.__/ \___\__,_| .__/ \__|\__,_|_|  \___|
                               | |
        capture the web easily |_| from the command line

  Version v${version} by ${author}

  Take screenshots or create pdf of your favourite webpages
  with many options and using the engine you prefer most.
  This program is made by developer for developers, if you
  want to contribute visit the project page on GitHub.
`);

// Configure the program
program
  .name(name)
  .version(version)
  .description(description)
  .usage('[options] <targets...>')
  .option('-d, --debug', 'Enable the debug mode to print useful logs')
  .option('-c, --crop', 'Crop the screenshot as the viewport size')
  .option('-o, --output-dir <path>', 'Where to render the output files')
  .option('-u, --user-agent <agent>', 'Specify a custom User-Agent (default: random)', validateUserAgent)
  .option('-v, --viewport <names>', 'Comma separated list of viewports', validateViewport, 'desktop')
  .option('-f, --format <name>', 'Use a different output format', validateFormat, 'png')
  .option('-q, --quality <number>', 'An integer between 0 and 100', validateQuality)
  .parse(process.argv);

// Prepare the input arguments
console.log('Parsing input arguments..');
program.args = program.args.map(i => {
  if (i.endsWith('.html')) {
    return fs.readFileSync(i, 'utf-8');
  }
  return i;
});

// Capture the input
console.log('Starting the capturing process..');
webpageCapture(program.args, {
  debug: program.debug,
  renderOptions: {
    format: program.format,
    quality: program.quality
  },
  outputDir: program.outputDir,
  onlySuccess: false,
  crop: program.crop,
  userAgent: program.userAgent,
  viewport: program.viewport
}, (err, res) => {
  if (err) {
    console.log('An error occurred: \n');
    throw err;
  }

  console.log('The execution has ended and the output has been created.\n');
  res.forEach(r => {
    if (Array.isArray(r)) {
      r.forEach(v => {
        console.log('- name:', path.basename(v));
        console.log('  file:', v, '\n');
      });
    } else {
      console.log('- name:', path.basename(r));
      console.log('  file:', r, '\n');
    }
  });
});
