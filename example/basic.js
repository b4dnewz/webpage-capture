const webpageCapture = require('../lib/index');
const options = {};

webpageCapture('codekraft.it', options, function (err, res) {
  if (err) {
    return console.log(err);
  }
  console.log('Screenshot created at:', res);
});
