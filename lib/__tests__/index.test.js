const assert = require('assert');
const webpageCapture = require('../index.js');

describe('webpageCapture', () => {
  it('exports by default a function', () => {
    assert.equal(typeof webpageCapture, 'function', 'it should export a function');
  });
});
