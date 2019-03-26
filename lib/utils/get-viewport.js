import * as _ from 'lodash';
import devices from '../devices';
import {isValidViewportObject} from './validators';

const viewportStringPattern = /^(\d{1,4})(?:x)?(\d{1,4})?$/;

const getViewportObject = function (input) {
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
      viewport = _.find(devices, {
        name: input
      });
    }
  } else if (_.isArray(input)) {
    viewport = input.map(v => getViewportObject(v));
  } else if (_.isObject(input)) {
    if (isValidViewportObject(input)) {
      viewport = {
        viewport: input
      };
    } else {
      viewport = input;
    }
  } else if (_.isNumber(input)) {
    viewport = {
      viewport: {
        width: input,
        height: input,
        deviceScaleFactor: 1
      }
    };
  }

  return viewport;
};

export default getViewportObject;
