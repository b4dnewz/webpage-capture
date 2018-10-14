import path from 'path';
import WebpageCapture from '../lib/index';

const capture = new WebpageCapture({
  outputDir: path.resolve(__dirname, '../output')
});

(async () => {
  try {
    await capture.capture('https://github.com/b4dnewz', {viewport: 'desktop-firefox'});
    await capture.capture('https://github.com/b4dnewz', {viewport: ['600x800']});
    await capture.capture('https://github.com/b4dnewz', {viewport: ['600x800', '800x600']});
    await capture.capture('https://github.com/b4dnewz', {viewport: ['600']});
    await capture.capture('https://github.com/b4dnewz', {viewport: {
      width: 1200,
      height: 800
    }});
  } catch (e) {
    console.error(e);
  } finally {
    await capture.close();
  }
})();
