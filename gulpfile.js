const gulp = require('gulp')

gulp.task('bootstrap', () => {
    return gulp
        .src([
            'node_modules/bootstrap/dist/css/bootstrap.min.css',
            'node_modules/bootstrap/dist/js/bootstrap.bundle.min.js',
        ])
        .pipe(gulp.dest('src/dist/bootstrap'))
})

gulp.task('clipboard', () => {
    return gulp
        .src('node_modules/clipboard/dist/clipboard.min.js')
        .pipe(gulp.dest('src/dist/clipboard'))
})

gulp.task('datatables', () => {
    return gulp
        .src([
            'node_modules/datatables.net/js/dataTables.min.js',
            'node_modules/datatables.net-bs5/js/dataTables.bootstrap5.min.js',
            'node_modules/datatables.net-bs5/css/dataTables.bootstrap5.min.css',
            'node_modules/datatables.net-buttons/js/dataTables.buttons.min.js',
            'node_modules/datatables.net-buttons/js/buttons.colVis.min.js',
            'node_modules/datatables.net-buttons/js/buttons.html5.min.js',
            'node_modules/datatables.net-buttons-bs5/js/buttons.bootstrap5.min.js',
            'node_modules/datatables.net-buttons-bs5/css/buttons.bootstrap5.min.css',
        ])
        .pipe(gulp.dest('src/dist/datatables'))
})

gulp.task('fontawesome', () => {
    return gulp
        .src(
            [
                'node_modules/@fortawesome/fontawesome-free/css/all.min.css',
                'node_modules/@fortawesome/fontawesome-free/webfonts/fa-regular-*',
                'node_modules/@fortawesome/fontawesome-free/webfonts/fa-solid-*',
            ],
            { base: 'node_modules/@fortawesome/fontawesome-free' }
        )
        .pipe(gulp.dest('src/dist/fontawesome'))
})

gulp.task('jquery', () => {
    return gulp
        .src('node_modules/jquery/dist/jquery.min.js')
        .pipe(gulp.dest('src/dist/jquery'))
})

gulp.task(
    'default',
    gulp.parallel(
        'bootstrap',
        'clipboard',
        'datatables',
        'fontawesome',
        'jquery'
    )
)
