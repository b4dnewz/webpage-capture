import {
  isValidURL,
  isValidPath
} from './validators';

export default function(v) {
  const opts = {};
  if (isValidPath(v)) {
    opts.path = v;
  } else if (isValidURL(v)) {
    opts.url = v;
  } else {
    opts.content = v;
  }
  return opts;
}
