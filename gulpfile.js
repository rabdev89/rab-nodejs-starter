const gulp = require('gulp'),
    tsc = require('gulp-typescript'),
    sourceMaps = require('gulp-sourcemaps'),
    mocha = require('gulp-mocha'),
    cleanCompiledTypeScript = require('gulp-clean-compiled-typescript'),
    del = require('del'),
    tsLint = require('gulp-tslint'),
    runSequence = require('gulp4-run-sequence'),
    git = require('gulp-git'),
    fs = require('fs'),
    file = require('gulp-file');


gulp.task('clean-compiled-typescript', () => {
    return gulp.src(['src/**/*.ts'], {read: false})
        .pipe(cleanCompiledTypeScript());
});

gulp.task('clean', gulp.series('clean-compiled-typescript', () => {
    return del(['./out']);
}));

gulp.task('compile', () => {
    let errors = false;
    const tsProject = tsc.createProject('tsconfig.json');
    return gulp.src(['src/**/*.ts'])
        .pipe(sourceMaps.init())
        .pipe(tsProject())
        .on('error', function () {
            errors = true;
        })
        .on('end', function () {
            if (errors) process.exit(1);
        })
        .pipe(sourceMaps.write())
        .pipe(gulp.dest('out'));
});

gulp.task('tsLint', () => {
    return gulp.src(['src/**/*.ts'])
        .pipe(tsLint({formatter: "verbose"}))
        .pipe(tsLint.report());
});


gulp.task('version', () => {
    return git.revParse({args: '--short HEAD'}, function (err, hash) {
        let version = JSON.parse(fs.readFileSync('./package.json')).version,
            str = JSON.stringify(
                {
                    "api-version": version,
                    "revision": hash,
                    "dateTime": (new Date()).toString(),
                    "dateTimeISO8601": (new Date()).toISOString()
                }
            );
        file('version.json', str, {src: true}).pipe(gulp.dest('src/skywind/'));
        return file('version.json', str, {src: true}).pipe(gulp.dest('out/skywind/'));
    });

});



gulp.task('default', () => {
    runSequence('clean', 'tsLint', 'unit-test');
});

// Rerun the task when a file changes
gulp.task('watch', () => {
    // gulp.watch('./docs-api/api/**/*.json', ['swagger']);
});
