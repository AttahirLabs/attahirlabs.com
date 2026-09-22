Three.js 0.186.0, MIT license (see THREE-LICENSE.txt).
Source: https://registry.npmjs.org/three/-/three-0.186.0.tgz
three.module.min.js was bundled from build/three.module.js with esbuild 0.28.1:
  esbuild build/three.module.js --bundle --minify --format=esm --outfile=three.module.min.js
RoomEnvironment.js is from examples/jsm/environments/RoomEnvironment.js; its bare `three` import is changed to `./three.module.min.js`.
All runtime files are served by this site. No third-party runtime requests, models or textures are required.
Leading and trailing whitespace is normalized for the repository whitespace check, including the embedded shader strings.
