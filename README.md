# webpage-capture

[![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url] [![Coverage percentage][coveralls-image]][coveralls-url]

> Fastly capture the web using headless browser with many options

[![NPM](https://nodei.co/npm/webpage-capture.png)](https://nodei.co/npm/webpage-capture/)

This program is an overlay of [puppeteer](https://github.com/GoogleChrome/puppeteer) which is designed to allow the easy extraction of single or multiple pages or sections, in multiple formats and in the fastest way possible.


## Installation as module

If you want to use it inside your scripts, save and install it in your project dependencies.

```
npm install --save webpage-capture
```

Once it has done you can import **webpage-capture** in your scripts and start using it, refer to the [usage](#usage) section.

## Installation as CLI

You can also use it as a cli-tool installing it as a global module:

```
npm install -g webpage-capture
```

Than you can start playing around with the options using the built-in help typing: `-h, --help`

---

## Usage

First you have to import __webpage-capture__ and initializire a new capturer with default or custom options.

```js
import WebCapture from 'webpage-capture'
const capturer = new WebCapture()

(async () => {
  const res = await capturer.capture('https://github.com/b4dnewz/webpage-capture')
  console.log(res);
})().catch(console.log)
    .then(capturer.close())
```

Don't forget to __close__ the capturer once you have done, otherwise the headless browser instance will not disconnect correctly.

The capture method can handle __strings__ and __array of strings__, for example:

```js
await capturer.capture([
  'https://github.com/b4dnewz',
  'https://github.com/b4dnewz/webpage-capture'
])
```

---

## Options

#### outputDir

Type: `String`
Default value: `./output`

Specify a custom directory where place the captured files.

#### timeout

Type: `Number`
Default value: `30000`

Specify the default page timeout to load a page (in ms).

#### viewport

Type: `String`
Default value: `false`

Specify a default viewport to use in all requests.

#### headers

Type: `Object`
Default value: `false`

Specify the default headers to use for every request.

#### debug

Type: `Boolean`
Default value: `false`

Run the script in __headfull__ mode with a delay of 1 second so you can see what is doing.

---

## Examples

If you want to see or execute the full example code please refer to the relative file in the [examples](examples) folder.

#### Basic use

Capture a single page and exit.

```js
await capture.capture('https://github.com/b4dnewz');
```

#### Capture from html text

Render some HTML content, capture to file and exit.

```js
await capture.capture('<h1>Codekraft is good</h1>');
```

#### Capture an element by selector

Capture only the element found by the selector.

```js
await capture.capture('https://github.com/b4dnewz', {
  captureSelector: 'div.h-card'
});
```

#### Capture using a different viewport

Capture a page using different viewports.

```js
await capture.capture('https://github.com/b4dnewz', {
  viewport: 'desktop-firefox'
});

await capture.capture('https://github.com/b4dnewz', {
  viewport: '600x800'
});

// Multiple viewports at once
await capture.capture('https://github.com/b4dnewz', {
  viewport: ['ipad-mini', 'nexus-10']
});
```

---

## License

MIT © [Filippo Conti](LICENSE)

## Contributing

1.  Create an issue and describe your idea
2.  Fork the project (<https://github.com/b4dnewz/webpage-capture/fork>)
3.  Create your feature branch (`git checkout -b my-new-feature`)
4.  Commit your changes (`git commit -am 'Add some feature'`)
5.  Write some tests and run it (`npm run test'`)
6.  Publish the branch (`git push origin my-new-feature`)
7.  Create a new Pull Request


[npm-image]: https://badge.fury.io/js/webpage-capture.svg

[npm-url]: https://npmjs.org/package/webpage-capture

[travis-image]: https://travis-ci.org/b4dnewz/webpage-capture.svg?branch=master

[travis-url]: https://travis-ci.org/b4dnewz/webpage-capture

[daviddm-image]: https://david-dm.org/b4dnewz/webpage-capture.svg?theme=shields.io

[daviddm-url]: https://david-dm.org/b4dnewz/webpage-capture

[coveralls-image]: https://coveralls.io/repos/b4dnewz/webpage-capture/badge.svg

[coveralls-url]: https://coveralls.io/r/b4dnewz/webpage-capture
