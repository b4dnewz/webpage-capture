'use strict';

const agents = require('./agents');
const supportedViewports = require('./viewports.json');
const supportedFormats = ['pdf', 'png', 'jpeg', 'bmp', 'ppm'];
const viewportRegex = /([0-9]+)x([0-9]+)/;

module.exports = {
  validateUserAgent: v => {
    if (Object.keys(agents.agents).includes(v) || v === 'random') {
      return v;
    }
    throw new Error(
      `User agent ${v} is not supported, check the documentation to see which values are supported`
    );
  },

  validateQuality: v => {
    if (/^[0-9][0-9]?$|^100$/.test(v)) {
      return Number(v);
    }
    throw new Error(`Quality must be a number between 0 and 100`);
  },

  validateViewport: v => {
    let viewports = Object.keys(supportedViewports);
    if (Array.isArray(v)) {
      let inputs = v.split(',');
      if (inputs.length === 1 && inputs[0] === 'all') {
        return inputs[0];
      }
      inputs.forEach(i => {
        if (!viewports.includes(i)) {
          throw new Error(
            `Viewport ${i} is not supported, check the documentation to see which values are supported`
          );
        }
      });
      return inputs;
    }
    if (viewportRegex.test(v)) {
      return v;
    }
    if (!viewports.includes(v)) {
      throw new Error(
        `Viewport ${v} is not supported, check the documentation to see which values are supported`
      );
    }
    return v;
  },

  validateFormat: v => {
    v = v.toLowerCase();
    if (supportedFormats.includes(v)) {
      return v;
    }
    throw new Error(
      `Format ${v} is not supported, must be one of [${supportedFormats.join(
        ','
      )}]`
    );
  },

  getViewports: input => {
    if (typeof input === 'string') {
      if (input === 'all') {
        return Object.values(supportedViewports);
      }
      if (viewportRegex.test(input)) {
        let matches = input.match(viewportRegex);
        return [
          {
            width: matches[1],
            height: matches[2]
          }
        ];
      }
      return [supportedViewports[input]];
    }

    return input
      .filter(v => {
        if (typeof v === 'string') {
          return supportedViewports[v];
        }
        if (typeof v === 'object') {
          return true;
        }
        return false;
      })
      .map(v => {
        if (typeof v === 'string') {
          return supportedViewports[v];
        }
        return v;
      });
  }
};

module.exports.supportedViewports = supportedViewports;
module.exports.supportedFormats = supportedFormats;
