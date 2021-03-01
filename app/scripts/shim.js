if (process.env.NODE_ENV !== 'production') {
  const Immutable = require('immutable');
  const installDevTools = require('immutable-devtools');

  installDevTools(Immutable);
}
