var gulp       = require('gulp');
var watchify   = require('watchify');
var browserify = require('browserify');
var babelify   = require('babelify');
var buffer     = require('vinyl-buffer');
var source     = require('vinyl-source-stream');

gulp.task('build', function() {
    var bundler = watchify(
        browserify({
            debug: true,
            standalone: 'flux',
            cache: {}
        })
        .add('./src/index.js')
        .transform(
            babelify.configure({
                plugins: ['object-assign']
            })
        )
    );

    var rebundle = function() {
        return bundler.bundle()
            .pipe(source('flux.js'))
            .pipe(buffer())
            .pipe(gulp.dest('test/dist/'));
    };
    bundler.on('update', rebundle);
    return rebundle();
});

gulp.task('default', ['build']);