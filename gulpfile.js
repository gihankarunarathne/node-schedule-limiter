'use strict';

let gulp = require('gulp');
let mocha = require('gulp-mocha');

const paths = {
    lib: ['index.js', 'lib/**/*.js'],
    test: ['test/**/*_test.js']
};

gulp.task('clean', (callback) => {
    callback();
});

gulp.task('test', () => {
    return gulp.src('test/**/*_test.js')
        .pipe(mocha())
        .once('error', () => {
            process.exit(1);
        })
        .once('end', () => {
            console.log('Testing successful.');
            process.exit();
        });
});

gulp.task('default', ['clean', 'test']);
