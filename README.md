# webpage-capture

> Capture the web in many ways using headless chrome

[![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url] [![Coverage percentage][coveralls-image]][coveralls-url]

This program is an overlay of [puppeteer](https://github.com/GoogleChrome/puppeteer) which is designed to allow the easy extraction of single or multiple pages or sections, in multiple formats and in the fastest way possible.


## Installation as module

If you want to use it inside your scripts, save and install it in your project dependencies.

```
npm install --save webpage-capture
```

Once it has done you can import **webpage-capture** in your scripts and start using it, refer to the [usage](#usage) section.

## Installation as CLI

You can also use it from the command line using the [cli module](), installing it globally:

```
npm install -g webpage-capture-cli
```

Than you can start playing around with the options using the built-in help typing: `-h, --help`

---

## Usage

First you have to import __webpage-capture__ and initializire a new capturer with default or custom options.

```js
import WebCapture from 'webpage-capture'
const capturer = new WebCapture()

(async () => {

  // Single input
  await capturer.capture('https://google.it')

  // Multiple inputs
  const res = await capturer.capture([
    'https://github.com/b4dnewz',
    'https://github.com/b4dnewz/webpage-capture'
  ])
  console.log(res);

})().catch(console.log)
    .then(capturer.close())
```

Don't forget to __close__ the capturer once you have done, otherwise the headless browser instance will not disconnect correctly.

### Instance Options

The constructor can also take options to set default values for all the subsequent captures:

```js
const capturer = new WebCapture({
  // default options
})
```

#### outputDir

Type: `String`  
Default value: `process.cwd()`

Specify a custom directory where place the captured files.

#### timeout

Type: `Number`  
Default value: `30000`

Specify the default page timeout to load a page (in ms).

#### headers

Type: `Object`  

Set the headers to be used during all the requests.

#### viewport

Type: `String, Object`  

Set the default viewport that is used when not specified.

#### debug

Type: `Boolean`  
Default value: `false`

Run the script in __headfull__ mode with a delay of 1 second so you can see what is doing.

#### launchArgs

Type: `Array`  
Default value: `[]`

Custom launch arguments to be passed to Chromium instance, if you are a linux user
and you are experiencing some issues, you may want to [disable sandbox](https://github.com/GoogleChrome/puppeteer/blob/master/docs/troubleshooting.md#setting-up-chrome-linux-sandbox) or setup differently.


The capture method can handle __strings__ and __array of strings__, for example:

```js
await capturer.capture([
  'https://github.com/b4dnewz',
  'https://github.com/b4dnewz/webpage-capture'
])
```

---

## Methods

### file(input, outputFilePath, [options])

Capture a screnshot of the given `input` and save it to the given `outputFilePath`.

Returns a `Promise<void>` that resolves when the screenshot is written.

### buffer(input, [options])

Capture a screnshot of the given `input`.

Returns a `Promise<Buffer>` with the screenshot as binary.

### base64(input, [options])

Capture a screnshot of the given `input`.

Returns a `Promise<string>` with the screenshot as [Base64](https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding).

### capture(inputs, [options])

Capture one or multiple `input` using the given options.
For a complete list of options see below.

Returns a `Promise<void>` that resolves when the screenshot is written.

---

## Capture Options

#### type

Type: `String`  
Default value: `png`  
Possible values: `png, jpeg, pdf, html, buffer, base64`  

Select the capture output type.

#### timeout

Type: `Number`  

The timeout to use when capturing input.

#### headers

Type: `Object`  

An object of headers to use when capturing input.

```js
await capturer.capture('https://github.com/b4dnewz/webpage-capture', {
  headers: {
    'x-powered-by': 'webpage-capture'
  }
})
```

#### waitFor

Type: `Number`  

Wait for the specified time before capturing the page. (in milliseconds)

#### waitUntil

Type: `String`  

Wait until the selector is visible into page.

#### fullPage

Type: `Boolean`  

Capture the full scrollable page, not just the visible viewport.

#### scripts

Type: `String[]`  

Inject scripts into the page.

```js
await capturer.capture('https://github.com/b4dnewz/webpage-capture', {
  scripts: [
    'http://example.com/some/remote/file.js',
    './local-file.js',
    'document.body.style.backgroundColor = "hotpink";'
  ]
})
```

#### styles

Type: `String[]`  

Inject styles into the page.

```js
await capturer.capture('https://github.com/b4dnewz/webpage-capture', {
  styles: [
    'http://example.com/some/remote/file.css',
    './local-file.css',
    'body { background-color: "hotpink"; }'
  ]
})
```

#### viewport

Type: `String, String[]`  

One or more viewport to capture.

```js
// capture single viewport
await capturer.capture('https://github.com/b4dnewz/webpage-capture', {
  viewport: 'nexus-5'
})

// capture multiple viewports
await capturer.capture('https://github.com/b4dnewz/webpage-capture', {
  viewport: ['nexus-5', 'nexus-10']
})
```

#### viewportCategory

Type: `String`  
Default value: `false`

Capture all viewports that match the category name.

```js
// capture all mobile viewports
await capturer.capture('https://github.com/b4dnewz/webpage-capture', {
  viewportCategory: 'mobile'
})
```

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

#### Capture all viewport by category

Capture a page in multiple viewports filtered by category.

```js
// By hard-coded category filter
await capture.capture('https://github.com/b4dnewz', {
  viewportCategory: 'mobile'
});

// By custom name string match
await capture.capture('https://github.com/b4dnewz', {
  viewportCategory: 'nexus'
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
