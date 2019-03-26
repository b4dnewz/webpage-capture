import * as _ from 'lodash';
import isValidPath from 'is-valid-path';
import isHTML from 'is-html';
import supportedViewports from '../devices';

// Output type validation
const notBase64 = /[^A-Z0-9+/=]/i;
const supportedTypes = ['pdf', 'png', 'jpeg', 'html', 'base64', 'buffer'];

// Viewport validation
const viewportsNames = _.map(supportedViewports, 'name');
const viewportStringPattern = /^(\d{1,4})(?:x)?(\d{1,4})?$/;
const viewportObject = _.conforms({
  width: _.isNumber,
  height: _.isNumber
});

export {isValidPath};

export function isValidViewportObject(v) {
  return viewportObject(v);
}

export function isValidViewport(input) {
  if (_.isString(input)) {
    if (viewportStringPattern.test(input)) {
      return true;
    }
    return viewportsNames.includes(input.replace(/\s+/g, '-').toLowerCase());
  }

  if (_.isArray(input)) {
    return _.every(input, isValidViewport);
  }

  if (_.isNumber(input)) {
    return true;
  }

  return false;
}

export function validateViewport(v) {
  if (_.isString(v) && v.indexOf(',') > -1) {
    v = v.split(',');
  }

  if (!isValidViewport(v)) {
    throw new Error(
      `Viewport ${v} is not supported, check the documentation to see which values are supported`
    );
  }

  return v;
}

export function validateType(v) {
  v = v.toLowerCase();
  if (supportedTypes.includes(v)) {
    return v;
  }

  throw new Error(
    `The output type ${v} is not supported, must be one of [${supportedTypes.join(
			','
		)}]`
  );
}

export function isValidBase64(v) {
  const len = v.length;
  if (!len || len % 4 !== 0 || notBase64.test(v)) {
    return false;
  }
  const firstPaddingChar = v.indexOf('=');
  return firstPaddingChar === -1 ||
    firstPaddingChar === len - 1 ||
    (firstPaddingChar === len - 2 && v[len - 1] === '=');
}

export function isValidURL(v) {
  return /^(https?|file):\/\/|^data:/.test(v);
}

export function isValidHTML(v) {
  return isHTML(v);
}
