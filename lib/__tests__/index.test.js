const fs = require('fs');
const assert = require('assert');
const agents = require('../agents');
const webpageCapture = require('../index.js');

const outputCollector = [];

describe('webpageCapture', () => {
  jest.setTimeout(60000);

  afterAll(() => {
    outputCollector.forEach(f => fs.unlink(f));
  });

  it('exports by default a function', () => {
    expect(typeof webpageCapture).toEqual('function');
  });

  it('throw an error if target input is empty', () => {
    assert.throws(
      () => webpageCapture(),
      Error,
      'it should throw an error is input is empty'
    );
  });

  it('throw an error if invalid format is used', () => {
    assert.throws(
      () =>
        webpageCapture('https://google.com', {
          renderOptions: {
            format: 'xyz'
          }
        }),
      Error,
      'it should throw an error for invalid output format'
    );
  });

  it.skip('has a options to capture only if success', done => {
    webpageCapture(
      'http://google.com',
      {
        onlySuccess: true
      },
      (err, response) => {
        expect(err).toBeNull();
        expect(response).toBeNull();
        outputCollector.push(response[0]);
        done();
      }
    );
  });

  it('ouput a filename with default execution options', done => {
    webpageCapture(
      'http://google.com',
      {
        outputType: 'file',
        onlySuccess: false
      },
      (err, response) => {
        expect(err).toBeNull();
        expect(response[0]).toEqual(
          expect.stringMatching(
            /([0-9]+)-(google.com)-([0-9]{2,4}x[0-9]{2,4})-(desktop)-(full).(png)$/g
          )
        );
        outputCollector.push(response[0]);
        done();
      }
    );
  });

  it('fail with error if the url fails', done => {
    webpageCapture(
      'http://v4ryn0nex1istingURL54643344383.com',
      {
        outputType: 'file',
        onlySuccess: false
      },
      (err, response) => {
        expect(err).toBeDefined();
        expect(response).not.toBeDefined();
        done();
      }
    );
  });

  it('support random as user agent', done => {
    webpageCapture(
      'http://google.com',
      {
        outputType: 'base64',
        userAgent: 'random',
        onlySuccess: false
      },
      (err, response) => {
        expect(err).toBeNull();
        expect(response).toBeDefined();
        done();
      }
    );
  });

  it('support random user agent by key name', done => {
    webpageCapture(
      'http://google.com',
      {
        outputType: 'base64',
        userAgent: 'safari',
        onlySuccess: false
      },
      (err, response) => {
        expect(err).toBeNull();
        expect(response).toBeDefined();
        done();
      }
    );
  });

  it('accept a string as input', done => {
    webpageCapture(
      'http://google.com',
      {
        outputType: 'file',
        onlySuccess: false
      },
      (err, response) => {
        expect(err).toBeNull();
        expect(response).toBeDefined();
        outputCollector.push(response[0]);
        done();
      }
    );
  });

  it('accept a HTML string as input', done => {
    webpageCapture(
      '<h1>Codekraft Studio</h1>',
      {
        outputType: 'html',
        onlySuccess: false
      },
      (err, response) => {
        expect(err).toBeNull();
        expect(response).toBeDefined();
        done();
      }
    );
  });

  it('accept an array of strings as input', done => {
    const urls = [
      'http://google.com',
      'https://github.com/codekraft-studio',
      'https://github.com/b4dnewz/webpage-capture'
    ];
    webpageCapture(
      urls,
      {
        outputType: 'file',
        onlySuccess: false
      },
      (err, response) => {
        expect(err).toBeNull();
        expect(response).toBeDefined();
        expect(Array.isArray(response)).toBeTruthy();
        outputCollector.push(...response);
        done();
      }
    );
  });

  it('accept an array of objects as input', done => {
    const urls = [
      {name: 'google', url: 'http://google.com'},
      {name: 'codekraft-studio', url: 'https://github.com/codekraft-studio'},
      {name: 'github', url: 'https://github.com/b4dnewz/webpage-capture'}
    ];
    webpageCapture(
      urls,
      {
        outputType: 'file',
        onlySuccess: false
      },
      (err, response) => {
        expect(err).toBeNull();
        expect(response).toBeDefined();
        expect(Array.isArray(response)).toBeTruthy();
        response.forEach(r => outputCollector.push(r.output));
        done();
      }
    );
  });

  it('output a base64 encoded string', done => {
    const base64Reg = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
    webpageCapture(
      'https://codekraft.it/',
      {
        outputType: 'base64'
      },
      (err, response) => {
        expect(err).toBeNull();
        expect(response).toBeDefined();
        expect(base64Reg.test(response)).toBeTruthy();
        done();
      }
    );
  });

  it('output a HTML string', done => {
    webpageCapture(
      'https://codekraft.it/',
      {
        outputType: 'html'
      },
      (err, response) => {
        expect(err).toBeNull();
        expect(response).toBeDefined();
        expect(response[0]).toEqual(
          expect.stringMatching(
            /<title>Codekraft Website - Coming Soon<\/title>/
          )
        );
        done();
      }
    );
  });

  it.skip('evaluate page with custom css', done => {
    webpageCapture(
      '<h1>Codekraft Studio</h1>',
      {
        outputType: 'html',
        whiteBackground: true,
        customCSS: 'h1 { color: red; }'
      },
      (err, response) => {
        expect(err).toBeNull();
        expect(response).toBeDefined();
        expect(response[0]).toEqual(
          expect.stringMatching(/background-color: white;/)
        );
        expect(response[0]).toEqual(
          expect.stringMatching(/h1 { color: red; }/)
        );
        done();
      }
    );
  });
});

describe('agents', () => {
  it('has a property with user agents and their strings', () => {
    expect(agents).toHaveProperty('agents');
    expect(agents.agents).toHaveProperty('chrome');
  });

  it('has a method to get the list of browser agent keys', () => {
    const browsers = agents.browsers();
    expect(browsers).toContain('chrome');
    expect(browsers).not.toContain('ie-mobile');
  });

  it('has a method to get a random browser', () => {
    const browser = agents.randomBrowser();
    expect(browser).toBeTruthy();
  });

  it('has a method to get a random user agent', () => {
    const agent = agents.random();
    expect(agent).not.toEqual(agents.random());
  });

  it('has a method to get random user agent by browser name', () => {
    expect(agents.randomByName()).toBeFalsy();
    expect(agents.randomByName('safari')).toBeTruthy();
  });
});
