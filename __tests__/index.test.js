import fs from 'fs';
import WebpageCapture from '../lib/index';

const capture = new WebpageCapture({
  outputDir: '../output'
});
const outputCollector = [];

describe('WebpageCapture', () => {
  jest.setTimeout(60000);

  beforeAll(async () => {
    await capture.prepare();
  });

  afterAll(async () => {
    await capture.close();
    outputCollector.forEach(f => fs.unlink(f));
  });

  it('throw if output folder does not exist', async () => {
    const instance = new WebpageCapture({outputDir: './nonexisting'});
    expect(() => {
      instance.capture('http://localhost');
    }).toThrow();
  });

  it('accept a string as input', async () => {
    await expect(capture.capture('http://google.com')).resolves.not.toEqual([]);
  });
});
