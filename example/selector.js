import path from 'path';
import WebpageCapture from '../lib/index';

const capture = new WebpageCapture({
  outputDir: path.resolve(__dirname, '../output')
});

capture
  .capture('https://github.com/b4dnewz', {
    captureSelector: 'div.h-card'
  })
  .then(res => console.log(res))
  .catch(err => console.log(err))
  .then(() => capture.close());
