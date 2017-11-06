const gulp = require('gulp');
const watchify = require('watchify');
const browserify = require('browserify');
const buffer = require('vinyl-buffer');
const source = require('vinyl-source-stream');

gulp.task('build-watch', function() {
    const bundler = watchify(
        browserify({
            debug: true,
            standalone: 'flux',
            cache: {}
        })
        .add('./src/index.js')
    );

    const rebundle = function() {
        return bundler.bundle()
            .pipe(source('flux.js'))
            .pipe(buffer())
            .pipe(gulp.dest('dist/'))
            .pipe(gulp.dest('test/dist/'));
    };
    bundler.on('update', rebundle);
    return rebundle();
});

gulp.task('build', function() {
    return browserify({
            debug: false,
            standalone: 'flux',
            cache: {}
        })
        .add('./src/index.js')
        .bundle()
        .pipe(source('flux.js'))
        .pipe(buffer())
        .pipe(gulp.dest('dist/'))
        .pipe(gulp.dest('test/dist/'));
});

gulp.task('default', ['build']);