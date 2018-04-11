const assert = require('assert');
const webpageCapture = require('../index.js');

describe('webpageCapture', () => {
  jest.setTimeout(60000);

  it('exports by default a function', () => {
    assert.equal(typeof webpageCapture, 'function', 'it should export a function');
  });

  it('throw an error if target input is empty', () => {
    assert.throws(() => webpageCapture(), Error, 'it should throw an error is input is empty');
  });

  it('throw an error if invalid format is used', () => {
    assert.throws(() => webpageCapture('https://google.com', {
      renderOptions: {
        format: 'xyz'
      }
    }), Error, 'it should throw an error for invalid output format');
  });

  it.skip('has a options to capture only if success', done => {
    webpageCapture('http://google.com', {
      onlySuccess: true
    }, (err, response) => {
      expect(err).toBeNull();
      expect(response).toBeNull();
      done();
    });
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

  it('fail with error if the url fails', done => {
    webpageCapture('http://v4ryn0nex1istingURL54643344383.com', {
      outputType: 'file',
      onlySuccess: false
    }, (err, response) => {
      expect(err).toBeDefined();
      expect(response).not.toBeDefined();
      done();
    });
  });

  it('support random as user agent', done => {
    webpageCapture('http://google.com', {
      outputType: 'base64',
      userAgent: 'random',
      onlySuccess: false
    }, (err, response) => {
      expect(err).toBeNull();
      expect(response).toBeDefined();
      done();
    });
  });

  it('support random user agent by key name', done => {
    webpageCapture('http://google.com', {
      outputType: 'base64',
      userAgent: 'safari',
      onlySuccess: false
    }, (err, response) => {
      expect(err).toBeNull();
      expect(response).toBeDefined();
      done();
    });
  });

  it('accept a string as input', done => {
    webpageCapture('http://google.com', {
      outputType: 'file',
      onlySuccess: false
    }, (err, response) => {
      expect(err).toBeNull();
      expect(response).toBeDefined();
      done();
    });
  });

  it('accept a HTML string as input', done => {
    webpageCapture('<h1>Codekraft Studio</h1>', {
      outputType: 'file',
      onlySuccess: false
    }, (err, response) => {
      expect(err).toBeNull();
      expect(response).toBeDefined();
      done();
    });
  });

  it('accept an array of strings as input', done => {
    const urls = [
      'http://google.com',
      'https://github.com/codekraft-studio',
      'https://github.com/b4dnewz/webpage-capture'
    ];
    webpageCapture(urls, {
      outputType: 'file',
      onlySuccess: false
    }, (err, response) => {
      expect(err).toBeNull();
      expect(response).toBeDefined();
      expect(Array.isArray(response)).toBeTruthy();
      done();
    });
  });

  it('accept an array of objects as input', done => {
    const urls = [
      {name: 'google', url: 'http://google.com'},
      {name: 'codekraft-studio', url: 'https://github.com/codekraft-studio'},
      {name: 'github', url: 'https://github.com/b4dnewz/webpage-capture'}
    ];
    webpageCapture(urls, {
      outputType: 'file',
      onlySuccess: false
    }, (err, response) => {
      expect(err).toBeNull();
      expect(response).toBeDefined();
      expect(Array.isArray(response)).toBeTruthy();
      done();
    });
  });

  it('output a base64 encoded string', done => {
    const base64Reg = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
    webpageCapture('https://codekraft.it/', {
      outputType: 'base64'
    }, (err, response) => {
      expect(err).toBeNull();
      expect(response).toBeDefined();
      expect(base64Reg.test(response)).toBeTruthy();
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
