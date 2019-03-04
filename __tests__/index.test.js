import * as _ from 'lodash'
import * as fs from 'fs';
import * as path from 'path';
import WebpageCapture from '../lib/index';

const capturer = new WebpageCapture({
  outputDir: path.resolve(__dirname, './output'),
  viewport: 'non-existing',
  headers: {
    Test: 'foo'
  }
});

const outputCollector = [];

describe('WebpageCapture', () => {
  jest.setTimeout(10000);

  const prepare = jest.spyOn(capturer, 'prepare')

  afterAll(async () => {
    await capturer.close();
    _.flatten(outputCollector)
      .forEach(f => fs.unlinkSync(f));
  });

  it('calls the prepare function', async () => {
    const res = await capturer.capture('about:blank')
    outputCollector.push(res[0].path);
    expect(prepare).toHaveBeenCalled()
  })

  it('fall back to default viewport', () => {
    expect(capturer.options).toMatchObject({
      viewport: false
    });
  });

  describe('viewports', () => {
    it('supports format 0000x0000 or 0000', async () => {
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

    it('supports format as object', async () => {
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

    it('supports format as number', async () => {
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
    it('returns if no input', async () => {
      await expect(capturer.capture()).resolves.toBeUndefined();
      await expect(capturer.capture('')).resolves.toBeUndefined();
      await expect(capturer.capture([])).resolves.toBeUndefined();
    });

    it('accept multiple sources', async () => {
      const testUrls = ['http://google.com', 'http://example.com', 'http://google.com'];
      const res = await capturer.capture(testUrls);
      outputCollector.push(res.map(r => r.path));
      expect(res.length).toBe(2);
      expect(res[0]).toMatchObject({
        url: testUrls[0]
      });
      expect(res[1]).toMatchObject({
        url: testUrls[1]
      });
    });

    it('accept html text', async () => {
      const res = await capturer.capture('<h1>testing</h1>');
      outputCollector.push(res[0].path);
      expect(res).toBeDefined();
    });

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
      outputCollector.push(res.map(r => r.path));
      expect(res[0]).toMatchObject({
        url: testUrl,
        path: expect.any(Array)
      });
    }, 10000);

    it('support scripts loading', async () => {
      const testUrl = 'http://example.com';
      const res = await capturer.capture(testUrl, {
        scripts: [
          'window.foo = "bar"'
        ]
      });
      outputCollector.push(res[0].path);
      await expect(
        capturer.page.evaluate(() => window.foo)
      ).resolves.toEqual('bar');
    });

    it('support styles loading', async () => {
      const res = await capturer.capture('about:blank', {
        styles: [
          'body { background-color: red; }'
        ]
      });
      outputCollector.push(res[0].path);
      await expect(
        capturer.page.evaluate(() => window.document.querySelector('style').textContent)
      ).resolves.toMatch('background-color: red;');
    });
  });
});
