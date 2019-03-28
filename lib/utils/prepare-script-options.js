import {
  isValidURL,
  isValidPath
} from './validators';

export default function(v) {
  const opts = {};

  if (isValidURL(v)) {
    opts.url = v;
  } else if (isValidPath(v)) {
    opts.path = v;
  } else {
    opts.content = v;
  }

  return opts;
}
