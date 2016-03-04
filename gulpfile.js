var gulp = require('gulp');
var eslint = require('gulp-eslint');
var jsinspect = require('gulp-jsinspect');

gulp.task('lint', function () {
  'use strict';
  return gulp.src(
    [
      './app.js',
      './gulpfile.js',
      './routes/*.js',
      './lib/**/*.js'
    ]
  )
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

gulp.task('inspect', function () {
  'use strict';
  return gulp.src(
    [
      './app.js',
      './gulpfile.js',
      './routes/*.js',
      './lib/**/*.js'
    ]
  )
    .pipe(jsinspect({
      threshold: 10,
      identifiers: true,
      suppress: 0
    }));
});
