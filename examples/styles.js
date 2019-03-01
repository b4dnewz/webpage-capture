import path from 'path';
import WebpageCapture from '../lib/index';

const capture = new WebpageCapture({
	outputDir: path.resolve(__dirname, './output')
});

(async () => {
	try {
		await capture.capture('http://example.com', {
			outputName: 'example_styles-original'
		});

		await capture.capture('http://example.com', {
			outputName: 'example_styles-modified',
			styles: [
				'html, body { background-color: #81c784 !important; }'
			]
		});
	} catch (e) {
		console.error(e);
	} finally {
		await capture.close();
	}
})();
