var gulp = require('gulp'),
	minify = require('gulp-minify'),
	concat = require('gulp-concat'),
	sass = require('gulp-sass'),
    exec = require('child_process').exec

gulp.task('minify', () => {
	gulp.src('static/js/app/*.js')
		.pipe(concat('app.js'))
		.pipe(minify())
        .on('error', (x) => {
        console.log(x)
        })
		.pipe(gulp.dest('static/js'))

	gulp.src(['static/js/togeojson.js', 'static/js/wNumb.js'])
		.pipe(minify())
		.pipe(gulp.dest('static/js'))
})

gulp.task('sass', function () {
  return gulp.src('./bower_components/materialize/sass/materialize.scss')
    .pipe(sass({ style: 'compressed' })
    	.on('error', () => {
            console.log
        }))
    .pipe(gulp.dest('./static/css'));
})

gulp.task('watch', () => {
	gulp.watch('static/js/app/*.js', ['minify'])
	gulp.watch('bower_components/materialize/sass/**/*.scss', ['sass'])
})
 

gulp.task('default', ['minify', 'sass', 'watch'])
