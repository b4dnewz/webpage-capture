import {Device, Viewport} from "puppeteer/DeviceDescriptors";

export function isDevice(arg: any): arg is Device {
  return arg.name !== undefined;
}
