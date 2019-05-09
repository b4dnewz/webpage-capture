import {
  isValidPath,
  isValidURL,
} from "./validators";

export default function(v) {
  const opts: any = {};

  if (isValidURL(v)) {
    opts.url = v;
  } else if (isValidPath(v)) {
    opts.path = v;
  } else {
    opts.content = v;
  }

  return opts;
}
