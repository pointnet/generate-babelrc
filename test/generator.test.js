'use strict';

require('mocha');
var fs = require('fs');
var path = require('path');
var assert = require('assert');
var bddStdin = require('bdd-stdin');
var intercept = require('intercept-stdout');
var generate = require('generate');
var npm = require('npm-install-global');
var gm = require('global-modules');
var del = require('delete');
var generator = require('../');
var app;

var actual = path.resolve.bind(path, __dirname, 'actual');

function symlink(dir, cb) {
  var src = path.resolve(dir);
  var name = path.basename(src);
  var dest = path.resolve(gm, name);
  fs.stat(dest, function(err, stat) {
    if (err) {
      fs.symlink(src, dest, cb);
    } else {
      cb();
    }
  });
}

function unlink(dir, cb) {
  var name = path.basename(dir);
  var dest = path.resolve(gm, name);
  fs.unlink(dest, cb);
}

function exists(name, cb) {
  return function(err) {
    if (err) return cb(err);
    var filepath = actual(name);
    fs.stat(filepath, function(err, stat) {
      if (err) return cb(err);
      assert(stat);
      del(actual(), cb);
    });
  };
}

function existscontains(name, contains, cb) {
  return function(err) {
    if (err) return cb(err);
    var filepath = actual(name);
    fs.stat(filepath, function(err, stat) {
      if (err) return cb(err);
      assert(stat);
      var json = JSON.parse(fs.readFileSync(filepath));
      assert(contains(json));
      del(actual(), cb);
    });
  };
}

var intercepted = false;
var unhook_intercept = intercept(function(txt) {
  if (intercepted) {
    if (txt.indexOf('[?25h') === 1) {
      intercepted = false;
    }
    return '';
  } else {
    if (txt.indexOf('Which stage do you want to use?') !== -1
      || txt.indexOf('Which presets do you want to use?') !== -1
      || txt.indexOf('Which environment do you want to use?') !== -1) {
      intercepted = true;
      return '';
    } else {
      return txt;
    }
  }
});

describe('generate-babelrc', function() {
  if (!process.env.CI && !process.env.TRAVIS) {
    before(function(cb) {
      npm.maybeInstall('generate', cb);
    });
  }

  after(function() {
    unhook_intercept();
  });

  beforeEach(function() {
    app = generate({ silent: true });
    app.cwd = actual();
    app.option('dest', actual());
    app.option('askWhen', 'not-answered');
    // provide template data to avoid prompts
    app.data(require('../package'));
    app.data({
      author: {
        name: 'Aurelien Verla',
        username: 'pointnet',
        url: 'https://github.com/pointnet'
      }
    });
  });

  describe('plugin', function() {
    it('should only register the plugin once', function(cb) {
      var count = 0;
      app.on('plugin', function(name) {
        if (name === 'generate-babelrc') {
          count++;
        }
      });
      app.use(generator);
      app.use(generator);
      app.use(generator);
      assert.equal(count, 1);
      cb();
    });

    it('should extend tasks onto the instance', function() {
      app.use(generator);
      assert(app.tasks.hasOwnProperty('default'));
      assert(app.tasks.hasOwnProperty('babelrc'));
    });
  });

  describe('tasks', function() {
    beforeEach(function() {
      app.use(generator);
      bddStdin('\n', '\n', '\n');
    });

    it('should run the `default` task with .build', function(cb) {
      app.build('default', exists('.babelrc', cb));
    });

    it('should run the `default` task with .generate', function(cb) {
      app.generate('default', exists('.babelrc', cb));
    });

    it('should run the `babelrc` task with .build', function(cb) {
      app.build('babelrc', exists('.babelrc', cb));
    });

    it('should run the `babelrc` task with .generate', function(cb) {
      app.generate('babelrc', exists('.babelrc', cb));
    });
  });

  if (!process.env.CI && !process.env.TRAVIS) {
    describe('generator (CLI)', function() {
      before(function(cb) {
        symlink(__dirname, cb);
      });

      after(function(cb) {
        unlink(__dirname, cb);
      });

      beforeEach(function() {
        app.use(generator);
        bddStdin('\n', '\n', '\n');
      });

      it('should run the default task using the `generate-babelrc` name', function(cb) {
        app.generate('generate-babelrc', exists('.babelrc', cb));
      });

      it('should run the default task using the `babelrc` generator alias', function(cb) {
        app.generate('babelrc', exists('.babelrc', cb));
      });
    });
  }

  describe('generator (API)', function() {
    beforeEach(function() {
      app.register('babelrc', generator);
    });

    it('should run the default task on the generator', function(cb) {
      bddStdin('\n', '\n', '\n');
      app.generate('babelrc', exists('.babelrc', cb));
    });

    it('should run the `babelrc` task', function(cb) {
      bddStdin('\n', '\n', '\n');
      app.generate('babelrc:babelrc', exists('.babelrc', cb));
    });

    it('should run the `default` task when defined explicitly', function(cb) {
      bddStdin('\n', '\n', '\n');
      app.generate('babelrc:default', exists('.babelrc', cb));
    });

    it('should generate `presets` when defined explicitly', function(cb) {
      bddStdin('\n', ' ', '\n', '\n');
      app.generate(
        'babelrc',
        existscontains(
          '.babelrc',
          function(json) {
            return json.presets.indexOf('es2015') !== -1
              && json.presets.indexOf('es2016') !== -1
              && json.presets.indexOf('react') !== -1;
          },
          cb
        )
      );
    });

    it('should generate `development` env when defined explicitly', function(cb) {
      bddStdin('\n', '\n', bddStdin.keys.down, ' ', '\n', '\n');
      app.generate(
        'babelrc',
        existscontains(
          '.babelrc',
          function(json) {
            return json.hasOwnProperty('env')
              && json.env.hasOwnProperty('development');
          },
          cb
        )
      );
    });

    it('should generate `production` env when defined explicitly', function(cb) {
      bddStdin('\n', '\n', bddStdin.keys.down, bddStdin.keys.down, ' ', '\n', '\n');
      app.generate(
        'babelrc',
        existscontains(
          '.babelrc',
          function(json) {
            return json.hasOwnProperty('env')
              && json.env.hasOwnProperty('production');
          },
          cb
        )
      );
    });

    it('should generate `test` env when defined explicitly', function(cb) {
      bddStdin('\n', '\n', bddStdin.keys.down, bddStdin.keys.down, bddStdin.keys.down, ' ', '\n', '\n');
      app.generate(
        'babelrc',
        existscontains(
          '.babelrc',
          function(json) {
            return json.hasOwnProperty('env')
              && json.env.hasOwnProperty('test');
          },
          cb
        )
      );
    });
  });

  describe('sub-generator', function() {
    beforeEach(function() {
      app.register('foo', function(foo) {
        foo.register('babelrc', generator);
      });
      bddStdin('\n', '\n', '\n');
    });

    it('should work as a sub-generator', function(cb) {
      app.generate('foo.babelrc', exists('.babelrc', cb));
    });

    it('should run the `default` task by default', function(cb) {
      app.generate('foo.babelrc', exists('.babelrc', cb));
    });

    it('should run the `babelrc:default` task when defined explicitly', function(cb) {
      app.generate('foo.babelrc:default', exists('.babelrc', cb));
    });

    it('should run the `babelrc:babelrc` task', function(cb) {
      app.generate('foo.babelrc:babelrc', exists('.babelrc', cb));
    });
  });

  describe('nested sub-generator', function() {
    it('should work with nested sub-generators', function(cb) {
      app
        .register('foo', generator)
        .register('bar', generator)
        .register('baz', generator);
      bddStdin('\n', '\n', '\n');
      app.generate('foo.bar.baz', exists('.babelrc', cb));
    });
  });

});
