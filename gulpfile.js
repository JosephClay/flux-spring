const gulp = require('gulp');
const watchify = require('watchify');
const browserify = require('browserify');
const babelify = require('babelify');
const buffer = require('vinyl-buffer');
const source = require('vinyl-source-stream');

gulp.task('build', function() {
    const bundler = watchify(
        browserify({
            debug: true,
            standalone: 'flux',
            cache: {}
        })
        .add('./src/index.js')
        .transform(babelify)
    );

    const rebundle = function() {
        return bundler.bundle()
            .pipe(source('flux.js'))
            .pipe(buffer())
            .pipe(gulp.dest('test/dist/'));
    };
    bundler.on('update', rebundle);
    return rebundle();
});

gulp.task('default', ['build']);