'use strict';

var browserify = require('browserify');
var gulp = require('gulp');
var chmod = require('gulp-chmod');
var chown = require('gulp-chown');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var gutil = require('gulp-util');

gulp.task('javascript', function () {
    // set up the browserify instance on a task basis
    var b = browserify({
        entries:"./js/main.js",
        debug: true
    });

    return b.bundle()
        .pipe(source('./js/pidash.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(uglify())
        .on('error', gutil.log)
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./dist'));
});

var sass = require('gulp-sass');

gulp.task('styles', function(){
    gulp.src('./sass/main.sass')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('./dist'));
});

gulp.task('watch', function(){
    gulp.watch('./sass/**/*.sass', ['styles']);
    gulp.watch('./sass/**/*.scss', ['styles']);
    gulp.watch('./webroot/index.html', ['copy-html']);
    gulp.watch('./js/**', ['javascript']);
    gulp.watch('dist/**', ['deploy-local']);
});

gulp.task('copy-html', function(){
    gulp.src('./webroot/index.html')
        .pipe(gulp.dest('./dist'));
}
);

gulp.task('deploy-local', function(){
    gulp.src('./dist/**')
        .pipe(chmod(509, 509))
        .pipe(chown(33))
        .pipe(gulp.dest('/var/www/pidash/'));
});