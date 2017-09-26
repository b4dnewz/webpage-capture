const assert = require('assert');
const webpageCapture = require('../index.js');

describe('webpageCapture', () => {
  it('exports by default a function', () => {
    assert.equal(typeof webpageCapture, 'function', 'it should export a function');
  });

  it('throw an error if the input url is not valid', () => {
    assert.throws(() => webpageCapture(''), Error, 'it should throw an error for invalid input');
  });

  it('throw an error if invalid format is used', () => {
    assert.throws(() => webpageCapture('https://google.com', {
      renderOptions: {
        format: 'xyz'
      }
    }), Error, 'it should throw an error for invalid output format');
  });
});
