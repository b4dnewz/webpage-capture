/* tslint:disable:no-console */

import * as path from "path";
import { WebpageCapture } from "../lib";

const capture = new WebpageCapture({
  outputDir: path.resolve(__dirname, "./output"),
});

(async () => {
  try {
    const res = await capture.capture("<h1>Codekraft is good</h1>");
    console.log(res);
  } catch (e) {
    console.error(e);
  } finally {
    await capture.close();
  }
})();
