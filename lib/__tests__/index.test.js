const assert = require('assert');
const webpageCapture = require('../index.js');

describe('webpageCapture', () => {
  it('exports by default a function', () => {
    assert.equal(typeof webpageCapture, 'function', 'it should export a function');
  });

  it('throw an error if the input url is not valid', () => {
    assert.throws(() => webpageCapture(''), Error, 'it shoudl throw an error for invalid urls');
  });
});
