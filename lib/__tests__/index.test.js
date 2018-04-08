const assert = require('assert');
const webpageCapture = require('../index.js');

describe('webpageCapture', () => {
  it('exports by default a function', () => {
    assert.equal(typeof webpageCapture, 'function', 'it should export a function');
  });

  it('throw an error if invalid format is used', () => {
    assert.throws(() => webpageCapture('https://google.com', {
      renderOptions: {
        format: 'xyz'
      }
    }), Error, 'it should throw an error for invalid output format');
  });

  it('ouput a filename with default execution options', done => {
    webpageCapture('http://google.com', {
      outputType: 'file',
      onlySuccess: false
    }, (err, response) => {
      expect(err).toBeNull();
      expect(response).toBe('./output/google.com-1280x1024-desktop.png');
      done();
    });
  });
});

describe('agents', () => {
  it('has a property with user agents and their strings', () => {
    expect(webpageCapture.agents).toHaveProperty('agents');
    expect(webpageCapture.agents.agents).toHaveProperty('chrome');
  });

  it('has a method to get the list of browser agent keys', () => {
    const browsers = webpageCapture.agents.browsers();
    expect(browsers).toContain('chrome');
    expect(browsers).not.toContain('ie-mobile');
  });

  it('has a method to get a random browser', () => {
    const browser = webpageCapture.agents.randomBrowser();
    expect(browser).toBeTruthy();
  });

  it('has a method to get a random user agent', () => {
    const agent = webpageCapture.agents.random();
    expect(agent).not.toEqual(webpageCapture.agents.random());
  });

  it('has a method to get random user agent by browser name', () => {
    expect(webpageCapture.agents.randomByName()).toBeFalsy();
    expect(webpageCapture.agents.randomByName('safari')).toBeTruthy();
  });
});
