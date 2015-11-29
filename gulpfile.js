/*jslint node: true*/
var gulp = require('gulp');
var jshint = require('gulp-jshint');
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
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(jshint.reporter('fail'));
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
      'threshold': 10,
      'identifiers': true,
      'suppress': 0
    }));
});
