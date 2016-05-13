/*
多个文件合并，减少HTTP请求数。
gulp-sass调用sass命令，编译生成的css。是调用node-sass,有node.js环境就够了，编译过程不需要临时目录和文件，直接通过buffer内容转换。
plumber是水管工的意思，plumber通过替换pipe方法并移除onerror处理函数，这样即使有管道出问题了不会影响其它管道以及影响其它后续数据流的再处理.通俗讲：正确的错误处理应该是能遇到错误时输出错误，并且能够保证整个gulp进程不挂，而且功能还能正常用。
 */
/**
 * 把执行结果返回，以便此任务可以跟后续的任务配合依次执行。将多个小的操作进行组合，连接在一起就是流，数据依次从源头穿过一个个的管道，依次执行，最终在底部得到结果，可以很好的进行数据的转换
 */

// Load plugins
var gulp = require('gulp'), // 基础库
    // 压缩
    imagemin = require('gulp-imagemin'), // 图片压缩
    minifycss = require('gulp-minify-css'), // css压缩
    htmlmin = require('gulp-htmlmin'), // html压缩
    uglify = require('gulp-uglify'), // js压缩
    concat = require('gulp-concat'), // 合并文件
    spritesmith = require('gulp.spritesmith'), // 雪碧图
    // 编译
    autoprefixer = require('gulp-autoprefixer'), // 设置浏览器版本自动处理浏览器前缀
    sass = require('gulp-sass'), // sass/scss编译
    rename = require('gulp-rename'), // 重命名
    // 优化检验
    sourcemaps = require('gulp-sourcemaps'), // 一个信息文件，里面储存着位置信息
    cssnano = require('gulp-cssnano'), // cssnano执行各种优化，删除空白和注释，并且压缩代码
    jshint = require('gulp-jshint'), // js检查
    gulpIf = require('gulp-if'), // 有条件的运行gulp任务
    // 系统
    del = require('del'), // 清空文件
    filter = require('gulp-filter'), // 通过使用通配符过滤
    notify = require('gulp-notify'), // 通知插件
    util = require('gulp-util'), // gulp工具
    browserSync = require('browser-sync'), // 浏览器同步测试工具
    reload = browserSync.reload,
    size = require('gulp-size'), // 显示项目文件大小
    plumber = require('gulp-plumber'), // 专门为gulp而生的错误处理库
    babel = require('gulp-babel'), // 支持ECMAScript
    mainBowerFiles = require('main-bower-files'), // bower文件
    contentIncluder = require('gulp-content-includer'),
    changed = require('gulp-changed'),
    cache = require('gulp-cache');

var debug = true;
var paths = {
    styles: {
        src: 'src/scss/**/*.*',
        dist: 'dist/css',
        tmp: '.tmp/css'
    },
    scripts: {
        src: 'src/js/**/*.js',
        dist: 'dist/js',
        tmp: '.tmp/js'
    },
    images: {
        src: 'src/images/**/*',
        dist: 'dist/images'
    },
    fonts: {
        src: 'src/fonts/*',
        dist: 'dist/fonts',
        tmp: '.tmp/fonts'
    },
    html: {
        src: 'src/**/*.html',
        dist: 'dist'
    },
    global: {
        src: 'src/global/*.*',
        dist: 'dist/global',
        tmp: '.tmp/global'
    },
    devs: {
        src: 'src/dev/**/*',
        dist: 'dist/dev'
    },
    sprite: {
        src: 'src/icons/*',
        dist: 'src/global'
    }
};


// 样式处理
gulp.task('styles', () => {
    return gulp.src(paths.styles.src)
        .pipe(plumber({
            errorHandler: notify.onError(`Message:\n\t<%= error.message%>\n\tlineNumber: <%= error.lineNumber %>`)
        }))
        .pipe(changed(paths.styles.tmp, {
            extension: '.css'
        }))
        .pipe(gulpIf(debug, sourcemaps.init()))
        .pipe(sass.sync({
            outputStyle: 'compact',
            // precision: 10,
            includePaths: ['.'],
            noCache: true
        }).on('error', sass.logError))
        .pipe(autoprefixer({
            browsers: ['last 2 versions', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'],
            cascade: false
        }))
        .pipe(gulp.dest(paths.styles.tmp))
        .pipe(gulpIf(debug, sourcemaps.write()))
        .pipe(notify({
            message: 'Styles task complete'
        }))
        .pipe(reload({
            stream: true
        }));
});

// 检查，合并，压缩js文件
gulp.task('scripts', function() {
    return gulp.src(paths.scripts.src)
        .pipe(plumber({
            errorHandler: notify.onError(`Message:\n\t<%= error.message%>\nDetails:\n\tlineNumber: <%= error.lineNumber %>`)
        }))
        .pipe(changed(paths.styles.tmp))
        .pipe(gulpIf(debug, sourcemaps.init()))
        .pipe(babel())
        .pipe(jshint('.jshintrc'))
        .pipe(jshint.reporter('default'))
        .pipe(gulp.dest(paths.scripts.tmp))
        .pipe(gulpIf(debug, sourcemaps.write()))
        .pipe(notify({
            message: 'Scripts task complete'
        })).pipe(reload({
            stream: true
        }));
});

// 字体任务
gulp.task('fonts', () => {
    return gulp.src(mainBowerFiles('**/*.{eot,svg,ttf,woff,woff2}', function(err) {})
            .concat(paths.fonts.src))
        .pipe(gulp.dest(paths.fonts.tmp));
});

//将bower库中的文件压缩并复制到global中
gulp.task('vendor', function() {
    // util.log(mainBowerFiles({
    //     debugging: true
    // }));
    var jsFilter = filter('**/*.js', {
            restore: true
        }),
        cssFilter = filter('**/*.scss', {
            restore: true
        });
    gulp.src(mainBowerFiles().concat('src/global/**/*.js'))
        .pipe(jsFilter)
        .pipe(gulp.dest(paths.global.tmp))
        .pipe(uglify())
        .pipe(concat('global.js'))
        .pipe(gulp.dest(paths.global.tmp));

    gulp.src(paths.global.src)
        .pipe(cssFilter)
        .pipe(plumber({
            errorHandler: notify.onError(`Message:\n\t<%= error.message%>\n\tlineNumber: <%= error.lineNumber %>`)
        }))
        .pipe(gulpIf(debug, sourcemaps.init()))
        .pipe(sass.sync({
            outputStyle: 'compact',
            precision: 10,
            includePaths: ['.'],
            noCache: true
        }).on('error', sass.logError))
        .pipe(autoprefixer({
            browsers: ['last 2 versions', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'],
            cascade: false
        }))
        .pipe(concat('global.css'))
        .pipe(gulp.dest(paths.global.tmp))
        .pipe(gulpIf(debug, sourcemaps.write()));

    gulp.src('./src/global/global.png')
        .pipe(gulp.dest(paths.global.dist));
});

gulp.task('sprite', function() {
    return gulp.src(paths.sprite.src) //需要合并的图片地址
        .pipe(spritesmith({
            imgName: 'global.png', //保存合并后图片的地址
            cssName: '_icons.scss', //保存合并后对于css样式的地址
            padding: 5, //合并时两个图片的间距
            algorithm: 'binary-tree', //注释1
            cssTemplate: './handlebarsStr.css' //注释2
        }))
        .pipe(gulp.dest(paths.sprite.dist));
});

gulp.task('html:build', function() {
    return gulp.src("./src/view/pagers/*")
        .pipe(changed("./src/view"))
        .pipe(contentIncluder({
            includerReg: /<!\-\-include\s+"([^"]+)"\-\->/g
        }))
        .pipe(gulp.dest('src/view'))
        .pipe(notify({
            message: 'html:build task complete'
        })).pipe(reload({
            stream: true
        }));
});
// 启动开发环境的服务
gulp.task('serve', ['styles', 'scripts', 'fonts', 'vendor', 'html:build'], () => {
    browserSync({
        notify: false,
        open: "external",
        // open: "local",
        port: 9000,
        startPath: "/view/index.html",
        // 在chrome、firefix下打开该站点
        browser: ["google chrome", "firefox", "iexplore"],
        server: {
            baseDir: ['.tmp', 'src']
        }
    });
    gulp.watch([
        'src/**/*.html',
        '.tmp/js/**/*.js',
        'src/images/**/*',
        '.tmp/fonts/**/*',
        '.tmp/global/*',
        '.tmp/css/**/*.css'
    ]).on('change', reload);
    gulp.watch(paths.styles.src, ['styles']);
    gulp.watch(paths.scripts.src, ['scripts']);
    gulp.watch(paths.fonts.src, ['fonts']);
    gulp.watch(['src/view/pagers/*', 'src/view/modules/*'], ['html:build']);
    // gulp.watch(paths.global.src,['vendor']);
});


// ==========================================================以下生产任务===========================================================


// // HTML处理
// gulp.task('html', ['styles', 'scripts'], () => {
//     return gulp.src(paths.html.src)
//         // .pipe($.useref({searchPath: ['.tmp', 'src', '.']}))
//         .pipe(gulpIf('*.js', uglify()))
//         .pipe(gulpIf('*.css', cssnano()))
//         .pipe(gulpIf('*.html', htmlmin({
//             collapseWhitespace: true, // 去掉空白
//             removeComments: true // 移除注释
//         }))).pipe(gulp.dest(paths.html.dist));
// });

// gulp.task('styles', () => {
//     return gulp.src(paths.styles.src)
//         .pipe(plumber())
//         .pipe(sass.sync({
//             outputStyle: 'compressed',
//             precision: 10,
//             includePaths: ['.'],
//             noCache: true
//         }).on('error', sass.logError))
//         .pipe(autoprefixer({
//             browsers: ['last 2 versions', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'],
//             cascade: false
//         }))
//         .pipe(rename({
//             suffix: '.min'
//         }))
//         .pipe(minifycss({
//             compatibility: 'ie8'
//         }))
//         .pipe(gulp.dest(paths.styles.dist));
// });

// gulp.task('scripts', function() {
//     return gulp.src(paths.scripts.src)
//         .pipe(plumber())
//         .pipe(babel())
//         .pipe(jshint('.jshintrc'))
//         .pipe(jshint.reporter('default'))
//         .pipe(rename({
//             suffix: '.min'
//         }))
//         .pipe(uglify())
//         .pipe(gulp.dest(paths.scripts.dist));
// });

// // 图片压缩
// gulp.task('images', () => {
//     return gulp.src(paths.images.src)
//         .pipe(gulpIf(gulpIf.isFile, cache(imagemin({
//                 progressive: true,
//                 interlaced: true,
//                 // don't remove IDs from SVGs, they are often used
//                 // as hooks for embedding and styling
//                 svgoPlugins: [{
//                     cleanupIDs: false
//                 }]
//             }))
//             .on('error', function(err) {
//                 console.log(err);
//                 this.end();
//             })))
//         .pipe(gulp.dest(paths.images.dist))
//         .pipe(notify({
//             message: 'Images task complete'
//         })).pipe(reload({
//             stream: true
//         }));
// });

// gulp.task('fonts', () => {
//     return gulp.src(require('main-bower-files')('**/*.{eot,svg,ttf,woff,woff2}', function(err) {})
//             .concat(paths.fonts.src))
//         .pipe(gulp.dest(paths.fonts.dist));
// });

// // 其他依赖文件
// gulp.task('otherfile', () => {
//     return gulp.src(paths.devs.src)
//         .pipe(gulp.dest(paths.devs.dist));
// });

// //将bower库中的文件压缩并复制到global中
// gulp.task('vendor', function() {
//     var jsFilter = filter('**/*.js', {
//             restore: true
//         }),
//         cssFilter = filter('**/*.scss', {
//             restore: true
//         });
//     gulp.src(mainBowerFiles().concat('src/global/**/*.js'))
//         .pipe(jsFilter)
//         .pipe(uglify())
//         .pipe(concat('main.js'))
//         .pipe(rename({
//             suffix: ".min"
//         }))
//         .pipe(gulp.dest(paths.global.dist));

//     gulp.src(paths.global.src)
//         .pipe(cssFilter)
//         .pipe(plumber())
//         .pipe(sass.sync({
//             outputStyle: 'expanded',
//             precision: 10,
//             includePaths: ['.'],
//             noCache: true
//         }).on('error', sass.logError))
//         .pipe(autoprefixer({
//             browsers: ['last 2 versions', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'],
//             cascade: false
//         }))
//         .pipe(rename({
//             suffix: '.min'
//         }))
//         .pipe(minifycss({
//             compatibility: 'ie8'
//         }))
//         .pipe(gulp.dest(paths.global.dist));

//     gulp.src('./src/global/global.png')
//         .pipe(gulp.dest(paths.global.dist));
// });

// gulp.task('sprite', function() {
//     return gulp.src(paths.sprite.src) //需要合并的图片地址
//         .pipe(spritesmith({
//             imgName: 'global.png', //保存合并后图片的地址
//             cssName: '_icons.scss', //保存合并后对于css样式的地址
//             padding: 5, //合并时两个图片的间距
//             algorithm: 'binary-tree', //注释1
//             cssTemplate: './handlebarsStr.css' //注释2
//         }))
//         .pipe(gulp.dest(paths.sprite.dist));
// });







// =======================================以下为运行任务===============================================================

//删除.tmp和dist下的所有文件 等同于 gulp.task('clean',function(){require('del')(['.tmp','dist'])});
gulp.task('clean', del.bind(null, ['.tmp', 'dist']));

gulp.task('serve:dist', () => {
    browserSync({
        notify: false,
        port: 9000,
        server: {
            baseDir: ['dist']
        }
    });
});

gulp.task('build', ['html', 'images', 'fonts', 'vendor', 'otherfile'], () => {
    return gulp.src('dist/**/*').pipe(size({
        title: 'build',
        gzip: true
    }));
});
gulp.task('default', ['clean'], () => {
    gulp.start('build');
});
