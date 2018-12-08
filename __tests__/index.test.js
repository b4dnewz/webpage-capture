import fs from 'fs';
import path from 'path';
import WebpageCapture from '../lib/index';

const capturer = new WebpageCapture({
  outputDir: path.resolve(__dirname, './output'),
  viewport: 'nexus-5'
});

const outputCollector = [];

describe('WebpageCapture', () => {
  jest.setTimeout(60000);

  beforeAll(async () => {
    await capturer.prepare();
  });

  afterAll(async () => {
    await capturer.close();
    outputCollector.forEach(f => fs.unlinkSync(f));
  });

  it('throw if output folder does not exist', async () => {
    expect(() => {
      const instance = new WebpageCapture({outputDir: './nonexisting'});
    }).toThrow();
  });

  it('return if no input', async () => {
    await expect(capturer.capture()).resolves.toBeUndefined();
    await expect(capturer.capture('')).resolves.toBeUndefined();
    await expect(capturer.capture([])).resolves.toBeUndefined();
  });

  describe('viewports', () => {
    it('fall back to default viewport', async () => {
      const testUrl = 'http://google.com';
      const res = await capturer.capture(testUrl, {
        viewport: ['non-existing']
      });
      outputCollector.push(res[0].path);
      expect(res[0]).toMatchObject({
        url: testUrl,
        path: expect.any(String)
      });
    });

    it('suppor viewport format 0000x0000 or 0000', async () => {
      const testUrl = 'http://google.com';
      const res = await capturer.capture(testUrl, {
        viewport: '200x200'
      });
      outputCollector.push(res[0].path);
      expect(res[0]).toMatchObject({
        url: testUrl,
        path: expect.any(String)
      });
    });

    it('suppor viewport format as object', async () => {
      const testUrl = 'http://google.com';
      const res = await capturer.capture(testUrl, {
        viewport: {
          width: 600,
          height: 400
        }
      });
      outputCollector.push(res[0].path);
      expect(res[0]).toMatchObject({
        url: testUrl,
        path: expect.any(String)
      });
    });

    it('suppor viewport format as number', async () => {
      const testUrl = 'http://google.com';
      const res = await capturer.capture(testUrl, {
        viewport: 350
      });
      outputCollector.push(res[0].path);
      expect(res[0]).toMatchObject({
        url: testUrl,
        path: expect.any(String)
      });
    });
  });

  describe('capture', () => {
    it('capture output as pdf', async () => {
      const testUrl = 'http://google.com';
      const res = await capturer.capture(testUrl, {
        type: 'pdf'
      });
      outputCollector.push(res[0].path);
      expect(res[0]).toMatchObject({
        url: testUrl,
        path: expect.stringContaining('.pdf')
      });
    });

    it('capture output as html', async () => {
      const testUrl = 'http://google.com';
      const res = await capturer.capture(testUrl, {
        type: 'html'
      });
      outputCollector.push(res[0].path);
      expect(res[0]).toMatchObject({
        url: testUrl,
        path: expect.stringContaining('.html')
      });
    });

    it('capture multiple viewports at once', async () => {
      const testUrl = 'http://google.com';
      const res = await capturer.capture(testUrl, {
        viewport: ['desktop-firefox', 'desktop-safari']
      });
      outputCollector.push(res[0].path);
      expect(res[0]).toMatchObject({
        url: testUrl,
        path: expect.any(String)
      });
    }, 60000);
  });
});
