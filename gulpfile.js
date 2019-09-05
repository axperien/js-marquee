let gulp = require('gulp');
let gulpLoadPlugins = require('gulp-load-plugins');
let yargs = require('yargs');
let babel = require('gulp-babel');
let rigger = require('gulp-rigger');
let cssbeautify = require('gulp-cssbeautify');
let imageminMozjpeg = require('imagemin-mozjpeg');

let path;
let emittyPug;
let errorHandler;

let argv = yargs.default({
    cache: true,
    ci: false,
    debug: true,
    fix: false,
    minify: false,
    minifyHtml: null,
    minifyCss: null,
    minifyJs: null,
    minifySvg: null,
    notify: true,
    open: true,
    port: 3000,
    spa: false,
    throwErrors: false,
}).argv;

argv.minify = !!argv.minify;
argv.minifyHtml = argv.minifyHtml !== null ? !!argv.minifyHtml : argv.minify;
argv.minifyCss = argv.minifyCss !== null ? !!argv.minifyCss : argv.minify;
argv.minifyJs = argv.minifyJs !== null ? !!argv.minifyJs : argv.minify;
argv.minifySvg = argv.minifySvg !== null ? !!argv.minifySvg : argv.minify;

if (argv.ci) {
    argv.cache = false;
    argv.notify = false;
    argv.open = false;
    argv.throwErrors = true;
}

let $ = gulpLoadPlugins({
    overridePattern: false,
    pattern: [
        'autoprefixer',
        'browser-sync',
        'connect-history-api-fallback',
        'cssnano',
        'emitty',
        'merge-stream',
        'postcss-reporter',
        'postcss-scss',
        'stylelint',
        'vinyl-buffer'
    ],
    scope: [
        'dependencies',
        'devDependencies',
        'optionalDependencies',
        'peerDependencies',
    ],
});

if (argv.throwErrors) {
    errorHandler = false;
} else if (argv.notify) {
    errorHandler = $.notify.onError('<%= error.message %>');
} else {
    errorHandler = null;
}

function svgoConfig(minify = argv.minifySvg) {
    return (file) => {
        if (!path) {
            // eslint-disable-next-line global-require
            path = require('path');
        }

        let filename = path.basename(file.relative, path.extname(file.relative));

        return {
            js2svg: {
                pretty: !minify,
                indent: '\t',
            },
            plugins: [{
                    cleanupIDs: {
                        minify: true,
                        prefix: `${filename}-`,
                    },
                },
                {
                    removeTitle: true,
                },
                {
                    sortAttrs: true,
                },
            ],
        };
    };
}

gulp.task('copy', () => {
    return gulp.src([
            'src/resources/**/*.*',
            'src/resources/**/.*',
            '!src/resources/**/.keep',
        ], {
            base: 'src/resources',
            dot: true,
        })
        .pipe($.if(argv.cache, $.newer('build')))
        .pipe($.if(argv.debug, $.debug()))
        .pipe(gulp.dest('build'));
});

gulp.task('images', () => {
    return gulp.src('src/images/**/*.*')
        .pipe($.plumber({
            errorHandler,
        }))
        .pipe($.if(argv.cache, $.newer('build/images')))
        .pipe($.if(argv.debug, $.debug()))
        .pipe($.imagemin([
            imageminMozjpeg({
                progressive: true,
                quality: 90
            }),
            $.imagemin.gifsicle({
                interlaced: true,
            }),
            $.imagemin.jpegtran({
                progressive: true,
            }),
            $.imagemin.optipng({
                optimizationLevel: 3,
            }),
            $.imagemin.svgo(svgoConfig()),
        ]))
        .pipe(gulp.dest('build/images'));
});

gulp.task('svgOptimize', () => {
    return gulp.src('src/images/**/*.svg', {
            base: 'src/images',
        })
        .pipe($.plumber({
            errorHandler,
        }))
        .pipe($.if(argv.debug, $.debug()))
        .pipe($.svgmin(svgoConfig(false)))
        .pipe(gulp.dest('src/images'));
});

gulp.task('html', () => {
    return gulp.src('src/**/*.html')
        .pipe($.plumber({
            errorHandler,
        }))
        .pipe($.if(argv.debug, $.debug()))
        .pipe(gulp.dest('build'));
});

gulp.task('scss', () => {
    return gulp.src([
            'src/scss/*.scss',
            '!src/scss/_*.scss',
        ])
        .pipe($.plumber({
            errorHandler,
        }))
        .pipe($.if(argv.debug, $.debug()))
        .pipe($.sourcemaps.init())
        .pipe($.sass().on('error', $.sass.logError))
        .pipe(cssbeautify({
            autosemicolon: true
        }))
        .pipe($.postcss([
            argv.minifyCss ?
            $.cssnano({
                autoprefixer: {
                    add: true,
                    browsers: ['> 0%'],
                },
                calc: true,
                discardComments: {
                    removeAll: true,
                },
                zindex: false,
            }) :
            $.autoprefixer({
                add: true,
                browsers: ['> 0%'],
            }),
        ]))
        .pipe($.sourcemaps.write('.'))
        .pipe(gulp.dest('build/css'))
        .pipe($.browserSync.stream());
});

gulp.task('js', () => {
    return gulp.src('src/js/main.js')
        .pipe($.plumber({
            errorHandler,
        }))
        .pipe(babel({
            presets: ['@babel/preset-env', { "sourceType": "script" }],
        }))
        .pipe(rigger())
        .pipe(gulp.dest('build/js'));
});

gulp.task('lintScss', () => {
    return gulp.src([
            'src/scss/**/*.scss',
            '!src/scss/vendor/**/*.scss',
        ])
        .pipe($.plumber({
            errorHandler,
        }))
        .pipe($.postcss([
            $.stylelint(),
            $.postcssReporter({
                clearReportedMessages: true,
                throwError: argv.throwErrors,
            }),
        ], {
            parser: $.postcssScss,
        }));
});

gulp.task('lintJs', () => {
    return gulp.src([
            '*.js',
            'src/js/**/*.js',
            '!src/js/vendor/**/*.js',
        ], {
            base: '.',
        })
        .pipe($.plumber({
            errorHandler,
        }))
        .pipe($.eslint({
            fix: argv.fix,
        }))
        .pipe($.eslint.format())
        .pipe($.if((file) => file.eslint && file.eslint.fixed, gulp.dest('.')));
});

gulp.task('watch', () => {
    gulp.watch([
        'src/resources/**/*.*',
        'src/resources/**/.*',
    ], gulp.series('copy'));

    gulp.watch('src/images/**/*.*', gulp.series('images'));

    gulp.watch([
        'src/**/*.html',
    ], {
        delay: 0,
    }, gulp.series('html'));

    gulp.watch('src/scss/**/*.scss', gulp.series('scss'));

    gulp.watch('src/js/**/*.js', gulp.series('js'));
});

gulp.task('serve', () => {
    let middleware = [];

    if (argv.spa) {
        middleware.push($.connectHistoryApiFallback());
    }

    $.browserSync
        .create()
        .init({
            injectChanges: true,
            notify: false,
            open: argv.open,
            port: argv.port,
            files: [
                './build/**/*',
            ],
            server: {
                baseDir: './build',
                middleware,
            },
        });
});

gulp.task('build', gulp.parallel(
    'copy',
    'images',
    'html',
    'scss',
    'js'
));

gulp.task('lint', gulp.series(
    'lintScss',
    'lintJs'
));

gulp.task('default', gulp.series(
    'build',
    gulp.parallel(
        'watch',
        'serve'
    )
));