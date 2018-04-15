# webpage-capture
[![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url] [![Coverage percentage][coveralls-image]][coveralls-url]
> A super simple way to capture webpages screenshots using phantomjs.

[![NPM](https://nodei.co/npm/webpage-capture.png)](https://nodei.co/npm/webpage-capture/)

## Installation
If you want to use it inside your scripts, save and install it in your project dependencies.
```sh
npm install --save webpage-capture
yarn add webpage-capture
```
Once it has done you can require __webpage-capture__ in your script and start using it.

## Global module
You can also use it as a cli-tool installing it as a global module:
```sh
npm install -g webpage-capture
yarn global add webpage-capture
```
Than you can start playing around with the options using the built-in help typing: `-h, --help`

---

## Usage
The most basic use is with a single input and default settings:
```js
const webCapture = require('webpage-capture');
webCapture('https://github.com/b4dnewz', {}, (err, res) => {
  // handle err
  console.log('Output saved to:', res);
});
````
You can also capture multiple source urls:
```js
const webCapture = require('webpage-capture');
webCapture([
  'https://github.com/b4dnewz',
  'https://github.com/b4dnewz/webpage-capture'
], {}, (err, res) => {
  // handle err
  console.log('Output saved to:', res);
});
````
Or render HTML text and capture it:
```js
const webCapture = require('webpage-capture');
webCapture('<h1>this is c00l</h1>', {}, (err, res) => {
  // handle err
  console.log('Output saved to:', res);
});
````
It can also render the same source in multiple viewports resolutions:
```js
const webCapture = require('webpage-capture');
webCapture('https://github.com/b4dnewz', {
  viewport: ['desktop', 'laptop-mdpi', 'nexus-7']
}, (err, res) => {
  // handle err
  console.log('Output saved to:', res);
});
````

It can accept many options to customize the capturing behavior:
```js
const webCapture = require('webpage-capture');
const options = {
  debug: false,
  outputDir: './output',
  outputType: 'file',
  onlySuccess: false,
  whiteBackground: true,
  renderOptions: {
    format: 'png',
    quality: 80
  },
  crop: false,
  clipRect: {
    top: 0,
    left: 0
  },
  viewport: 'desktop',
  userAgent: 'random'
};

webCapture('https://github.com/b4dnewz', options, (err, res) => {
  // handle err
  console.log('Output saved to:', res);
});
```

---

## Options

#### onlySuccess
Type: `Boolean`
Default value: `false`

If set to true only pages with a success status will be captured.

#### outputDir
Type: `String`
Default value: `./output`

Where to save the files in case of *'file'* outputType.

#### outputType
Type: `String`
Default value: `file`

The capture output type that can be: __file__, __base64__ or __html__.

#### renderOptions
Type: `Object`
Default value: `{
  format: 'png',
  quality: 80
}`

The options to pass to phantomjs page renderer.

#### crop
Type: `Object`
Default value: `false`

If true the screenshot will be cropped as __viewportSize__.

#### userAgent
Type: `string`
Default value: `random`

Let select the user agent to use, by default is a random browser user agent.

#### debug
Type: `Boolean`
Default value: `false`

If enabled show extra execution logs useful when debugging.

#### whiteBackground
Type: `Boolean`
Default value: `true`

Force the pages to have a white background color.

#### viewportSize
Type: `Object`
Default value: `{
  width: 1280,
  height: 800
}`

The default page viewportSize for phantomjs.

---

## License

MIT © [Filippo Conti]()

## Contributing

1. Create an issue and describe your idea
2. Fork the project (https://github.com/b4dnewz/webpage-capture/fork)
3. Create your feature branch (`git checkout -b my-new-feature`)
4. Commit your changes (`git commit -am 'Add some feature'`)
5. Write some tests and run it (`npm run test'`)
6. Publish the branch (`git push origin my-new-feature`)
7. Create a new Pull Request

[npm-image]: https://badge.fury.io/js/webpage-capture.svg
[npm-url]: https://npmjs.org/package/webpage-capture
[travis-image]: https://travis-ci.org/b4dnewz/webpage-capture.svg?branch=master
[travis-url]: https://travis-ci.org/b4dnewz/webpage-capture
[daviddm-image]: https://david-dm.org/b4dnewz/webpage-capture.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/b4dnewz/webpage-capture
[coveralls-image]: https://coveralls.io/repos/b4dnewz/webpage-capture/badge.svg
[coveralls-url]: https://coveralls.io/r/b4dnewz/webpage-capture
