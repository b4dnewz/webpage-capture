import _ from "lodash";
import { Device, Viewport } from "puppeteer/DeviceDescriptors";
import devices from "../devices";

export type DeviceOrViewport = Device | Viewport;

export interface ViewportObject extends Partial<Viewport> {
  width: number;
  height: number;
}

export type ViewportInput = number | string | ViewportObject;

const viewportStringPattern = /^(\d{1,4})(?:x)?(\d{1,4})?$/;

const partialViewport = {
  deviceScaleFactor: 1,
  hasTouch: false,
  isMobile: false,
  isLandscape: false,
};

export function getViewport(input: ViewportInput): DeviceOrViewport {
  if (_.isNumber(input)) {
    return {
      ...partialViewport,
      width: input,
      height: input,
    };
  }

  if (_.isString(input)) {
    // Test if the string match "0000x0000" or "0000" and construct
    // the viewport object using the result of the match
    if (viewportStringPattern.test(input)) {
      const [, width, height] = viewportStringPattern.exec(input);
      return {
        ...partialViewport,
        width: parseInt(width, 10),
        height: parseInt(height || width, 10),
      };
    } else {
      input = input.replace(/\s+/g, "-").toLowerCase();
      return _.find(devices, {
        name: input,
      });
    }
  }

  if (_.isObject(input)) {
    return _.merge({}, partialViewport, input);
  }
}

export function getViewports(input: ViewportInput[]): DeviceOrViewport[] {
  return input.map((v) => getViewport(v));
}
