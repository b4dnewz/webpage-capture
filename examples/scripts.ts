/* tslint:disable:no-console */

import * as path from "path";
import { WebpageCapture } from "../lib";

const capture = new WebpageCapture({
  outputDir: path.resolve(__dirname, "./output"),
});

(async () => {
  try {
    await capture.capture("http://example.com", {
      outputName: "example_scripts-original",
    });

    await capture.capture("http://example.com", {
      outputName: "example_scripts-modified",
      scripts: [
        'document.body.style.backgroundColor = "#81c784"',
      ],
    });
  } catch (e) {
    console.error(e);
  } finally {
    await capture.close();
  }
})();
