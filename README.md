# webpage-capture
[![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url] [![Coverage percentage][coveralls-image]][coveralls-url]
> A super simple way to capture webpages screenshots using phantomjs.

[![NPM](https://nodei.co/npm/webpage-capture.png)](https://nodei.co/npm/webpage-capture/)

## Installation

```sh
npm install --save webpage-capture
yarn add webpage-capture
```

---

## Usage
The script will accept either a __string__ or an __array__ of strings or objects:
```js
const webpageCapture = require('webpage-capture');
webpageCapture(input, options, callback);
```
To capture a single page and exit you must pass a string with the url you want to capture:
```js
webpageCapture('codekraft.it', options, function (err, res) {
  if (err) {
    console.log(err);
    return;
  }
  console.log('Screenshot created at:', res);
});
```
To capture multiple pages you can pass an array of urls:
```js
const array = [
  'codekraft.it',
  'github.com/codekraft-studio'
];
webpageCapture(array, options, function (err, res) {
  if (err) {
    console.log(err);
    return;
  }
  console.log('Screenshots created at:', res);
});
```

---

## Options
#### onlySuccess
Type: `Boolean`
Default value: `false`

If set to true only pages with a success status will be captured.

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
