import { default as devices, Device } from "puppeteer/DeviceDescriptors";

const puppeteerDevices: Device[] = Object.values(devices)
  .filter((d) => d.name)
  .map((d) => ({
    ...d,
    name: d.name.replace(/\s+/g, "-").toLowerCase(),
  }));

const customDevices: Device[] = [{
  name: "desktop-edge",
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/12.246",
  viewport: {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
    isLandscape: false,
  },
}, {
  name: "desktop-safari",
  userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_2) AppleWebKit/601.3.9 (KHTML, like Gecko) Version/9.0.2 Safari/601.3.9",
  viewport: {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
    isLandscape: false,
  },
}, {
  name: "desktop-firefox",
  userAgent: "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:15.0) Gecko/20100101 Firefox/15.0.1",
  viewport: {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
    isLandscape: false,
  },
}];

const allDevices = [
  ...puppeteerDevices,
  ...customDevices,
];

const deviceNames = allDevices.map((d) => d.name);

export type DeviceNames = typeof deviceNames[number];

export default [
  ...puppeteerDevices,
  ...customDevices,
];
