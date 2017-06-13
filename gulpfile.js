var gulp = require('gulp'),
	minify = require('gulp-minify'),
	concat = require('gulp-concat')

gulp.task('minify', () => {
	gulp.src('static/js/app/*.js')
		.pipe(concat('app.js'))
		.pipe(minify())
		.pipe(gulp.dest('static/js'))

	gulp.src(['static/js/togeojson.js', 'static/js/wNumb.js'])
		.pipe(minify())
		.pipe(gulp.dest('static/js'))
})

gulp.task('watch', () => {
	gulp.watch('static/js/app/*.js', ['minify'])
})

gulp.task('default', ['minify', 'watch'])
