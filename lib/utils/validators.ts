import isHTML from "is-html";
import isValidPath from "is-valid-path";
import _ from "lodash";

// Output type validation
const notBase64 = /[^A-Z0-9+/=]/i;
const supportedTypes = ["pdf", "png", "jpeg", "html", "base64", "buffer"];

// Viewport validation
const viewportObject = _.conforms({
  height: _.isNumber,
  width: _.isNumber,
});

export { isValidPath };

export function isValidViewportObject(v) {
  return viewportObject(v);
}

export function validateType(v) {
  v = v.toLowerCase();
  if (supportedTypes.includes(v)) {
    return v;
  }

  throw new Error(
    `The output type ${v} is not supported, must be one of [${supportedTypes.join(
      ",",
    )}]`,
  );
}

export function isValidBase64(v) {
  const len = v.length;
  if (!len || len % 4 !== 0 || notBase64.test(v)) {
    return false;
  }
  const firstPaddingChar = v.indexOf("=");
  return firstPaddingChar === -1 ||
    firstPaddingChar === len - 1 ||
    (firstPaddingChar === len - 2 && v[len - 1] === "=");
}

export function isValidURL(v) {
  return /^(https?|file):\/\/|^data:/.test(v);
}

export function isValidHTML(v) {
  return isHTML(v);
}
