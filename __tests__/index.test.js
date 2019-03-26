import * as _ from 'lodash';
import * as fs from 'fs';
import * as path from 'path';
import WebpageCapture from '../lib/index';

import {isValidBase64} from '../lib/utils/validators';

const capturer = new WebpageCapture({
	outputDir: path.resolve(__dirname, './output'),
	viewport: 'non-existing',
	headers: {
		Test: 'foo'
	}
});

let outputCollector = [];

describe('webpage-capture', () => {
	jest.setTimeout(10000);

	const prepare = jest.spyOn(capturer, 'prepare');

	afterEach(() => {
		_.flattenDeep(outputCollector).forEach(f => fs.unlinkSync(f));
    outputCollector = [];
	});

  afterAll(async () => {
    await capturer.close();
  });

	it('calls the prepare function', async () => {
		const res = await capturer.capture('about:blank');
		outputCollector.push(res[0].output);
		expect(prepare).toHaveBeenCalled();
	});

	it('fall back to default viewport', () => {
		expect(capturer.options).toMatchObject({
			viewport: false
		});
	});

	it('return error on invalid viewport', async () => {
		const res = await capturer.capture('about:blank', {
			viewport: 'desktop'
		});
    expect(res[0].error).toBeDefined();
    expect(res[0].error).toMatch('Invalid viewport');
		expect(res[0].output).toBeNull();
	});

  describe('getOutPath', () => {
    it('use custom name if provided', () => {
      expect(capturer.getOutPath({
        name: 'about.png'
      })).toMatch('about.png');

      expect(capturer.getOutPath({
        name: 'about',
        type: 'png'
      })).toMatch('about.png');
    });

    it('build a default name', () => {
      expect(capturer.getOutPath({
        type: 'png'
      })).toMatch(/.png$/);
    });

    it('parse given url to extract hostname', () => {
      expect(capturer.getOutPath({
        input: 'http://google.com',
        type: 'png'
      })).toMatch(/(google\.com)-\w+.png$/);
    });

    it('use provided viewport name', () => {
      expect(capturer.getOutPath({
        viewport: '800x400',
        type: 'png'
      })).toMatch('800x400');

      expect(capturer.getOutPath({
        viewport: 'nexus-10',
        type: 'png'
      })).toMatch(/(nexus-10)-\w+.png$/);
    });
  });

	describe('viewports', () => {
		it('supports format 0000x0000 or 0000', async () => {
			const testUrl = 'http://google.com';
			const res = await capturer.capture(testUrl, {
				viewport: '200x200'
			});
			outputCollector.push(res[0].output);
			expect(res[0]).toMatchObject({
				input: testUrl,
				output: expect.any(String)
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
			outputCollector.push(res[0].output);
			expect(res[0]).toMatchObject({
				input: testUrl,
				output: expect.any(String)
			});
		});

		it('supports format as number', async () => {
			const testUrl = 'http://google.com';
			const res = await capturer.capture(testUrl, {
				viewport: 350
			});
			outputCollector.push(res[0].output);
			expect(res[0]).toMatchObject({
				input: testUrl,
				output: expect.any(String)
			});
		});

		it('support viewports by category', async () => {
			const testUrl = 'about:blank';
			const res = await capturer.capture(testUrl, {
				viewportCategory: 'desktop'
			});
			outputCollector = outputCollector.concat(...res[0].output);
			expect(res.length).not.toBe(0);
			expect(res[0].output).not.toBe(0);
		});

		it('support viewports filtering category by name', async () => {
			const testUrl = 'about:blank';
			const res = await capturer.capture(testUrl, {
				viewportCategory: 'blackberry'
			});
			outputCollector = outputCollector.concat(...res[0].output);
			expect(res.length).not.toBe(0);
			expect(res[0].output).not.toBe(0);
		});
	});

  describe('.file', () => {
    it('return the output file path', async () => {
      const outFile = path.resolve(__dirname, 'output/about');
      const res = await capturer.file('about:blank', outFile);
      outputCollector.push(res.output);
      expect(res.input).toEqual('about:blank');
      expect(res.output).toMatch('about.png');
    });

    it('inherit output type from filename', async () => {
      const outFile = path.resolve(__dirname, 'output/about.jpeg');
      const res = await capturer.file('about:blank', outFile);
      outputCollector.push(res.output);
      expect(res.input).toEqual('about:blank');
      expect(res.output).toMatch('about.jpeg');
    });

    it('override options to enforce result', async () => {
      const outFile = path.resolve(__dirname, 'output/about.jpeg');
      const res = await capturer.file('about:blank', outFile, {
        type: 'png',
        options: {
          type: 'png',
          output: './some/path/to/file.png'
        }
      });
      outputCollector.push(res.output);
      expect(res.input).toEqual('about:blank');
      expect(res.output).toMatch('about.jpeg');
    });
  });

  describe('.base64', () => {
    it('return a base64 encoded string', async () => {
      const res = await capturer.base64('about:blank');
      expect(res.input).toEqual('about:blank');
      expect(isValidBase64(res.output)).toBeTruthy();
    });

    it('override options to enforce result', async () => {
      const res = await capturer.base64('about:blank', {
        type: 'png',
        options: {
          type: 'jpeg',
          encoding: 'binary'
        }
      });
      expect(res.input).toEqual('about:blank');
      expect(isValidBase64(res.output)).toBeTruthy();
    });
  });

  describe('.buffer', () => {
    it('return a string buffer', async () => {
      const res = await capturer.buffer('about:blank');
      expect(res.input).toEqual('about:blank');
      expect(Buffer.isBuffer(res.output)).toBeTruthy();
    });

    it('override options to enforce result', async () => {
      const res = await capturer.buffer('about:blank', {
        type: 'png',
        options: {
          type: 'jpeg',
          encoding: 'base64'
        }
      });
      expect(res.input).toEqual('about:blank');
      expect(Buffer.isBuffer(res.output)).toBeTruthy();
    });
  });

	describe('.capture', () => {
		it('returns empty array if no input', async () => {
			await expect(capturer.capture()).resolves.toEqual([]);
			await expect(capturer.capture('')).resolves.toEqual([]);
			await expect(capturer.capture([])).resolves.toEqual([]);
		});

		it('removes duplicate from sources input', async () => {
			const testUrls = ['http://google.com', 'http://example.com', 'http://google.com'];
			const res = await capturer.capture(testUrls);
			outputCollector = outputCollector.concat(...res.map(r => r.output));
			expect(res.length).toBe(2);
			expect(res[0]).toMatchObject({
				input: testUrls[0]
			});
			expect(res[1]).toMatchObject({
				input: testUrls[1]
			});
		});

		it('accept html text', async () => {
			const res = await capturer.capture('<h1>testing</h1>');
			outputCollector.push(res[0].output);
			expect(res).toBeDefined();
		});

    it('accept a local file', async () => {
      const filePath = path.resolve(__dirname, 'fixtures/list.txt');
			const res = await capturer.capture(filePath);
      outputCollector = outputCollector.concat(res.map(r => r.output));
			expect(res[0].error).toBeUndefined();
		});

		it('capture output as pdf', async () => {
			const testUrl = 'http://google.com';
			const res = await capturer.capture(testUrl, {
				type: 'pdf'
			});
			outputCollector.push(res[0].output);
			expect(res[0]).toMatchObject({
				input: testUrl,
				output: expect.stringContaining('.pdf')
			});
		});

		it('capture output as html', async () => {
			const testUrl = 'http://google.com';
			const res = await capturer.capture(testUrl, {
				type: 'html'
			});
			outputCollector.push(res[0].output);
			expect(res[0]).toMatchObject({
				input: testUrl,
				output: expect.stringContaining('.html')
			});
		});

		it('capture multiple viewports at once', async () => {
			const testUrl = 'http://google.com';
			const res = await capturer.capture(testUrl, {
				viewport: ['desktop-firefox', 'desktop-safari']
			});
			outputCollector = outputCollector.concat(...res[0].output);
			expect(res[0]).toMatchObject({
				input: testUrl,
				output: expect.any(Array)
			});
		}, 10000);

		describe('load scripts', () => {

			it('support scripts loading as strings', async () => {
				const testUrl = 'http://example.com';
				const res = await capturer.capture(testUrl, {
					scripts: [
						'window.foo = "bar"'
					]
				});
				outputCollector.push(res[0].output);
				await expect(
					capturer.page.evaluate(() => window.foo)
				).resolves.toEqual('bar');
			});

			it('support scripts loading as files', async () => {
				const testUrl = 'http://example.com';
				const res = await capturer.capture(testUrl, {
					scripts: [
						path.resolve(__dirname, 'fixtures/script.js')
					]
				});
				outputCollector.push(res[0].output);
				await expect(
					capturer.page.evaluate(() => window.document.body.style.backgroundColor)
				).resolves.toEqual('red');
			});

		});

		describe('load styles', () => {

			it('support styles loading as string', async () => {
				const res = await capturer.capture('about:blank', {
					styles: [
						'body { background-color: red; }'
					]
				});
				outputCollector.push(res[0].output);
				await expect(
					capturer.page.evaluate(() => window.document.querySelector('style').textContent)
				).resolves.toMatch('background-color: red;');
			});

			it('support styles loading as file', async () => {
				const res = await capturer.capture('about:blank', {
					styles: [
						path.resolve(__dirname, 'fixtures/style.css')
					]
				});
				outputCollector.push(res[0].output);
				await expect(
					capturer.page.evaluate(() => window.document.querySelector('style').textContent)
				).resolves.toMatch('background-color: red;');
			});

		});
	});
});
