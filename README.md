# webpage-capture 
[![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url] [![Coverage percentage][coveralls-image]][coveralls-url]
> A super simple way to capture webpages screenshots using phantomjs.

## Installation

```sh
npm install --save webpage-capture
```

## Usage

```js
const webpageCapture = require('webpage-capture');
const options = {};

webpageCapture('codekraft.it', options, function (err, res) {
  if (err) {
    return console.log(err);
  }
  console.log('Screenshot created at:', res);
});
```

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
