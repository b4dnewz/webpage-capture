'use strict';

import _ from 'lodash';
import supportedViewports from './devices';
const supportedFormats = ['pdf', 'png', 'jpeg', 'bmp', 'ppm'];
const viewportRegex = /^(\d{1,4})(?:x)?(\d{1,4})?$/;

module.exports = {
  validateViewport: v => {
    let vpName = v.replace(/\s+/g, '-').toLowerCase();
    let viewports = _.map(supportedViewports, 'name');

    if (Array.isArray(v)) {
      let inputs = v.split(',');
      if (inputs.length === 1 && inputs[0] === 'all') {
        return inputs[0];
      }
      inputs.forEach(i => {
        let j = i.replace(/\s+/g, '-').toLowerCase();
        if (!viewports.includes(j)) {
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

    if (!viewports.includes(vpName)) {
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
  }
};
