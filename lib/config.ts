import {Viewport} from "puppeteer/DeviceDescriptors";
import {Options} from "./capturer";

const defaultViewport: Viewport = {
  deviceScaleFactor: 2,
  hasTouch: false,
  height: 800,
  isLandscape: false,
  isMobile: false,
  width: 1280,
};

const defaultOptions: Options = {
  debug: false,
  launchArgs: [],
  outputDir: process.cwd(),
  timeout: 30000,
  viewport: defaultViewport,
};

export {
  defaultViewport,
  defaultOptions,
};
