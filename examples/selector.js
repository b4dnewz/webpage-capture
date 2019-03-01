import path from 'path';
import WebpageCapture from '../lib/index';

const capture = new WebpageCapture({
	outputDir: path.resolve(__dirname, './output')
});

(async () => {
	try {
		await capture.capture('https://github.com/b4dnewz', {captureSelector: 'div.h-card'});
		await capture.capture('https://github.com/codekraft-studio', {captureSelector: 'div.h-card'});
		await capture.capture('https://github.com/erikyo', {captureSelector: 'div.h-card'});
	} catch (e) {
		console.error(e);
	} finally {
		await capture.close();
	}
})();
