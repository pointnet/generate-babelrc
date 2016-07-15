'use strict';

var isValid = require('is-valid-app');

module.exports = function(app) {
  if (!isValid(app, 'generate-babelrc')) return;

  /**
   * Generate an `.babelrc` file to the current working directory.
   *
   * ```sh
   * $ gen babelrc
   * $ gen babelrc --dest ./docs
   * ```
   * @name babelrc
   * @api public
   */

  app.task('default', ['babelrc']);
  app.task('babelrc', function(cb) {
    // return app.src('templates/assemblefile.js', {cwd: __dirname})
    //   .pipe(app.conflicts(app.cwd))
    //   .pipe(app.dest(app.cwd));
  });
};
