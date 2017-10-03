'use strict';

// modules
// ----
const assemble = require('fabricator-assemble');
const browserSync = require('browser-sync');
const reload = browserSync.reload;
const cleanCSS = require('gulp-clean-css');
const csso = require('gulp-csso');
const del = require('del');
const gulp = require('gulp');
const gutil = require('gulp-util');
const gulpif = require('gulp-if');
const imagemin = require('gulp-imagemin');
const prefix = require('gulp-autoprefixer');
const rename = require('gulp-rename');
const runSequence = require('run-sequence');
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const webpack = require('webpack');


// configuration
// ----
let config = {
	dev: gutil.env.dev,
	src: {
		scripts: {
			fabricator: './src/assets/fabricator/scripts/fabricator.js',
			toolkit: './src/assets/toolkit/scripts/toolkit.js'
		},
		styles: {
			fabricator: 'src/assets/fabricator/styles/fabricator.scss',
			toolkit: 'src/assets/toolkit/styles/toolkit.scss'
		},
		images: 'src/assets/toolkit/images/**/*',
		views: 'src/toolkit/views/*.html'
	},
	dest: 'dist'
};


// webpack
// ----
const webpackConfig = require('./webpack.config')(config);
const webpackCompiler = webpack(webpackConfig);


// clean
// ----
gulp.task('clean', (cb) => {
	del([config.dest], cb);
});


// styles
// ----
gulp.task('styles:fabricator', function () {
	gulp.src(config.src.styles.fabricator)
		.pipe(sourcemaps.init())
		.pipe(sass().on('error', sass.logError))
		.pipe(prefix('last 1 version'))
		.pipe(gulpif(!config.dev, csso()))
		.pipe(rename('f.css'))
		.pipe(sourcemaps.write())
		.pipe(gulp.dest(config.dest + '/assets/fabricator/styles'))
		.pipe(gulpif(config.dev, reload({stream:true})));
});

gulp.task('styles:toolkit', function () {
	gulp.src(config.src.styles.toolkit)
		.pipe(sourcemaps.init())
		.pipe(sass().on('error', sass.logError))
		.pipe(cleanCSS({compatibility: 'ie8'}))
		.pipe(prefix('last 1 version'))
		.pipe(gulpif(!config.dev, csso()))
		.pipe(sourcemaps.write())
		.pipe(gulp.dest(config.dest + '/assets/toolkit/styles'))
		.pipe(gulpif(config.dev, reload({stream:true})));
});

gulp.task('styles', ['styles:fabricator', 'styles:toolkit']);


// scripts
// ----
gulp.task('scripts', done => {
	webpackCompiler.run((error, result) => {
		if (error) {
			gutil.log(gutil.colors.red(error));
		}
		result = result.toJson();
		if (result.errors.length) {
			result.errors.forEach((error) => {
				gutil.log(gutil.colors.red(error));
			});
		}
		done();
	});
});


// images
// ----
gulp.task('images', ['favicon'], () => {
	return gulp.src(config.src.images)
		.pipe(imagemin())
		.pipe(gulp.dest(config.dest + '/assets/toolkit/images'));
});

gulp.task('favicon', () => {
	return gulp.src('./src/favicon.ico')
		.pipe(gulp.dest(config.dest));
});


// copy vendor files from /node-modules
// ----
gulp.task('vendor', () => {
	gulp.src([
		'node_modules/bootstrap/dist/**/*',
		'!**/npm.js',
		'!**/bootstrap-theme.*',
		'!**/*.map'
	])
		.pipe(gulp.dest(config.dest + '/vendor/bootstrap'));

	gulp.src([
		'node_modules/bootstrap-datepicker/dist/**',
		'!node_modules/bootstrap-datepicker/dist/locales'
	])
		.pipe(gulp.dest(config.dest + '/vendor/bootstrap-datepicker'));

	gulp.src([
		'node_modules/font-awesome/**',
		'!node_modules/font-awesome/**/*.map',
		'!node_modules/font-awesome/.npmignore',
		'!node_modules/font-awesome/*.txt',
		'!node_modules/font-awesome/*.md',
		'!node_modules/font-awesome/*.json'
	])
		.pipe(gulp.dest(config.dest + '/vendor/font-awesome'));

	gulp.src(['node_modules/jquery/dist/jquery.min.js'])
		.pipe(gulp.dest(config.dest + '/vendor/jquery'));
});


// assemble
// ----
gulp.task('assemble', done => {
	assemble({
		logErrors: config.dev
	});
	done();
});


// server
// ----
gulp.task('serve', () => {
	browserSync({
		server: {
			baseDir: config.dest
		},
		notify: false,
		logPrefix: 'FABRICATOR'
	});

	/*
	 * Because webpackCompiler.watch() isn't being used
	 * manually remove the changed file path from the cache
	 */
	const webpackCache = e => {
		let keys = Object.keys(webpackConfig.cache);
		let key, matchedKey;
		for (let keyIndex = 0; keyIndex < keys.length; keyIndex++) {
			key = keys[keyIndex];
			if (key.indexOf(e.path) !== -1) {
				matchedKey = key;
				break;
			}
		}
		if (matchedKey) {
			delete webpackConfig.cache[matchedKey];
		}
	}

	gulp.task('assemble:watch', ['assemble'], reload);
	gulp.watch('src/**/*.{html,md,json,yml}', ['assemble:watch']);

	gulp.task('styles:fabricator:watch', ['styles:fabricator']);
	gulp.watch('src/assets/fabricator/styles/**/*.scss', ['styles:fabricator:watch']);

	gulp.task('styles:toolkit:watch', ['styles:toolkit']);
	gulp.watch('src/assets/toolkit/styles/**/*.scss', ['styles:toolkit:watch']);

	gulp.task('scripts:watch', ['scripts'], reload);
	gulp.watch('src/assets/{fabricator,toolkit}/scripts/**/*.js', ['scripts:watch']).on('change', webpackCache);

	gulp.task('images:watch', ['images'], reload);
	gulp.watch(config.src.images, ['images:watch']);
});


// default build task
// ----
gulp.task('default', ['clean'], () => {
	let tasks = [
		'styles',
		'scripts',
		'images',
		'vendor',
		'assemble'
	];

	runSequence(tasks, () => {
		if (config.dev) {
			gulp.start('serve');
		}
	});
});
