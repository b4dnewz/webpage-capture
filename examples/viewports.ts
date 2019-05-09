/* tslint:disable:no-console */

import * as path from "path";
import { WebpageCapture } from "../lib";

console.log(WebpageCapture);

const capture = new WebpageCapture({
  outputDir: path.resolve(__dirname, "./output"),
});

(async () => {
  try {

    // Single viewport as string
    await capture.capture("https://github.com/b4dnewz", {
      viewport: "desktop-firefox",
    });

    // Single viewport as number
    await capture.capture("https://github.com/b4dnewz", {
      viewport: 600,
    });

    // Single viewport as array
    await capture.capture("https://github.com/b4dnewz", {
      viewport: ["600x800"],
    });

    // Single viewport using object
    await capture.capture("https://github.com/b4dnewz", {
      viewport: {
        width: 1200,
        height: 800,
      },
    });

    // Multiple viewports as array
    await capture.capture("https://github.com/b4dnewz", {
      viewport: ["600x800", "800x600"],
    });

  } catch (e) {
    console.error(e);
  } finally {
    await capture.close();
  }
})();
