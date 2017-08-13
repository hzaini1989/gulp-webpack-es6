
var gulp = require('gulp'),
    imageMin = require('gulp-imagemin'),
    gutil = require('gulp-util'),
    jsMin = require('gulp-uglify'), // js 压缩
    cssMin = require('gulp-css'), // css 压缩
    eslint = require('gulp-eslint'),
    rename = require('gulp-rename'),// 重命名
    sourcemaps = require('gulp-sourcemaps'),
    clean = require('gulp-clean'),
    babel = require('gulp-babel'),
    cache = require('gulp-cache'),
    ngif = require('gulp-if'),
    changed = require('gulp-changed'),// 仅仅传递更改过的文件
    path = require('path'),
    // ExtractTextPlugin = require('extract-text-webpack-plugin'),
    gulpSequence = require('gulp-sequence'),//
    // webpack = require('webpack'),
    webpack = require('gulp-webpack'),
    webpack_config = require('./webpack.config.js'),
    jsErrorCount = 0,
    scss = require('gulp-sass'),// scss
    jsList = require('./gulp-config-jsList'), //需要检查的js 配置路径
    localhostServer = require('gulp-connect');
    
var paths = {
    scripts: 'public/scripts/*/*.js',
    styles: 'public/scss/*/*.scss',
    html: 'public/html/*/*.html',
    images: 'public/images/*/*.{jpg,png,gif}'
};
var debug_paths = {
    scripts:'dist/debugjs/*/*.js'
};
var dist_paths = {
    scripts:'dist/scripts/*/*.js'
};

gulp.task('localhostServer', function() {
    localhostServer.server({
        root: '../projectsweb',
        livereload: true,
        port: 80,
        //port: 443,
        //https: true,
        host: ''
    });
});
// 检查js
gulp.task('jsEslint', function() {
    // 这里的需要设置要检查的JS 具体路径。。用模糊路径会卡死！！
    return gulp.src(jsList.jsList).pipe(eslint()).pipe(eslint.result(result => {
        // Called for each ESLint result.
        if (result.errorCount > 0) {
            gutil.log('ESLint result: ', gutil.colors.cyan(`${result.filePath}`));
            gutil.log('# Errors:', gutil.colors.magenta(`${result.errorCount}`));
            jsErrorCount = result.errorCount;
        }
    }));
});
//把生成后的HTML文件拷贝到各个站点文件下
gulp.task('distHtmlCopy', function() {
    return gulp.src(paths.html)
        .pipe(localhostServer.reload())
        .pipe(gulp.dest('dist/html'));        
});
//压缩图片
gulp.task('imageMin', function() {
    return gulp.src(paths.images)
        .pipe(cache(imageMin({
            optimizationLevel: 4, //类型：Number  默认：3  取值范围：0-7（优化等级）
            progressive: true, //类型：Boolean 默认：false 无损压缩jpg图片
            interlaced: true, //类型：Boolean 默认：false 隔行扫描gif进行渲染
            multipass: false //类型：Boolean 默认：false 多次优化svg直到完全优化
        })))
        .pipe(gulp.dest('dist/images'))
        .pipe(localhostServer.reload());
});
gulp.task('cssMin', function() {
    return gulp.src([paths.styles,'!public/scss/common/*.scss'])// common下的scss不用压缩
        .pipe(scss())
        .pipe(cssMin())
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest('dist/css'))
        .pipe(localhostServer.reload());
});

var entry_js = {
    // 要输入的文件入口
    'search/search':'./public/scripts/search/search.js',
    'login/login':'./public/scripts/login/login.js',
    // 'login/xx':'./public/scripts/login/login.js'
};

// 脚本webpack－打包到debugjs
gulp.task('webpack-scripts', function() {
    console.log(1);
    return gulp.src('src/entry.js')
        .pipe(webpack({
            entry: entry_js,
            output: {
                path: '/dist',
                filename: '[name].js',
                chunkFilename: '[name].js'
            },  
            module: {  
                loaders: [{  
                    test: /\.js$/,  
                    exclude: /node_modules/,  
                    loader: 'babel-loader'  
                }]  
            }
        })).pipe(gulp.dest('./dist/debugjs'));
        // .pipe(sourcemaps.init())
        // .pipe(jsMin())
        // .pipe(sourcemaps.write())
        // .pipe(rename({suffix: '.min'}))
        // .pipe(gulp.dest('dist/scripts'))
        // .pipe(localhostServer.reload());
});
// js进行压缩
gulp.task('jsMin', ['webpack-scripts'],function() {
    return gulp.src('./dist/debugjs/*/*.js')
        .pipe(sourcemaps.init())
        .pipe(jsMin())
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('dist/scripts'))
        .pipe(localhostServer.reload());
});

// 实时删除debugjs目录
gulp.task('clean-debugjs',['jsMin'],function(){
    return gulp.src('./dist/debugjs')
        .pipe(clean());
});

// 执行gulp的时候先clean下
gulp.task('clean', function(){
    return gulp.src('./dist')
        .pipe(clean());
});
//初始化压缩js和css和img
gulp.task('init',['clean'],function(){
    gulp.start(['webpack-scripts','cssMin','imageMin','jsMin','clean-debugjs']);
});

//gulp.task('gulp-sequence', gulpSequence('sequence-1', 'sequence-2', 'sequence-3'));
gulp.task('watch',['localhostServer'],function(){
    gulp.watch(paths.html, ['distHtmlCopy']);
    gulp.watch(paths.scripts, ['jsEslint','jsMin','webpack-scripts','clean-debugjs']);
    gulp.watch(paths.styles, ['cssMin']);
    gulp.watch(paths.images, ['imageMin']);
});
gulp.task('default',['clean','init','watch'],function(){
    console.log('\n'+'------------------监听中-------------');
    console.log('\n' + '－－－－－－－请不要关闭CMD窗口－－－－－－－' + '\n');
});

