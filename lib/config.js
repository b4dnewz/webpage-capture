const defaultViewport = {
  width: 1280,
	height: 800,
	deviceScaleFactor: 2,
};

const defaultOptions = {
  debug: false,
  timeout: 30000,
  outputDir: process.cwd(),
  viewport: defaultViewport,
  launchArgs: []
};

export {
  defaultViewport,
  defaultOptions
};
