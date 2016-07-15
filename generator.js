'use strict';

var isValid = require('is-valid-app');

module.exports = function(app) {
  if (!isValid(app, 'generate-babelrc')) return;

  /**
   * Plugins
   */

  app.use(require('generate-defaults'));

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
  app.task('babelrc', { silent: true }, function (callback) {
    app.questions.list('babel.stage', 'Which stage do you want to use?', {
      choices: [
        'stage-0',
        'stage-1',
        'stage-2',
        'stage-3'
      ]
    });
    app.questions.choices('babel.presets', 'Which presets do you want to use?', {
      choices: [
        'es2105',
        'es2016',
        'react'
      ]
    });
    app.questions.choices('babel.env', 'Which environment do you want to use?', {
      choices: [
        'development',
        'production',
        'test'
      ]
    });
    app.ask('babel', { save: false }, function(err, answers) {
      if (err) return callback(err);
      console.log(answers);
      //app.build(answers.licenses, callback);
    });
    // return app.src('templates/assemblefile.js', {cwd: __dirname})
    //   .pipe(app.conflicts(app.cwd))
    //   .pipe(app.dest(app.cwd));
  });
};
