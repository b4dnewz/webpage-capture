const {version, author} = require('../package.json');

export default String.raw`
                _                     _
               | |                   | |
  __      _____| |__   ___ __ _ _ __ | |_ _   _ _ __ ___
  \ \ /\ / / _ \ '_ \ / __/ _  | '_ \| __| | | |  __/ _ \
   \ V  V /  __/ |_) | (_| (_| | |_) | |_| |_| | | |  __/
    \_/\_/ \___|_.__/ \___\__,_| .__/ \__|\__,_|_|  \___|
                               | |
               capture the web |_| from the command line

  v${version} by ${author}

  Take screenshots or create pdf of your favourite webpages
  with many options and using the engine you prefer most.
  This program is made by developer for developers, if you
  want to contribute visit the project page on GitHub.
`;
