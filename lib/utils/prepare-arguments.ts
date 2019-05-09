import fileUrl from "file-url";
import * as fs from "fs";
import _ from "lodash";
import * as path from "path";
import {
  isValidHTML,
  isValidPath,
  isValidURL,
} from "./validators";

export default function(arr) {
  return _.chain(arr).map((i) => {
    if (isValidURL(i)) {
      return i;
    }

    if (isValidHTML(i)) {
      return i;
    }

    if (isValidPath(i)) {
      if (i.endsWith(".html")) {
        return fileUrl(i);
      }

      if (i.endsWith(".txt")) {
        const filePath = path.resolve(process.cwd(), i);
        return fs.readFileSync(filePath, "utf-8").trim().split(/\r?\n/);
      }
    }

    return i;
  }).flatten().value();
}
