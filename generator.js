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

  app.task('default', { silent: true }, ['babelrc']);
  app.task('babelrc', { silent: true }, function(callback) {
    app.questions.list('babel.stage', 'Which stage do you want to use?', {
      default: 1,
      choices: [
        'stage-0',
        'stage-1',
        'stage-2',
        'stage-3'
      ]
    });
    app.questions.choices('babel.presets', 'Which presets do you want to use?', {
      choices: [
        'es2015',
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
      var tmpldata = {
        babel: {
          presets: [],
          dev: false,
          prod: false,
          test: false
        }
      };
      tmpldata.babel.presets.push(answers.babel.stage);
      if (answers.babel && answers.babel.presets) {
        tmpldata.babel.presets = tmpldata.babel.presets.concat(answers.babel.presets);
      }
      if (answers.babel && answers.babel.env) {
        tmpldata.babel.dev = answers.babel.env.indexOf('development') !== -1;
        tmpldata.babel.prod = answers.babel.env.indexOf('production') !== -1;
        tmpldata.babel.test = answers.babel.env.indexOf('test') !== -1;
      }
      app.data(tmpldata);
      app.src('./templates/babelrc.tmpl', {cwd: __dirname})
        .pipe(app.renderFile('*'))
        .pipe(app.conflicts(app.cwd))
        .pipe(app.dest(app.cwd))
        .on('error', callback)
        .on('end', callback);
    });
  });
};
