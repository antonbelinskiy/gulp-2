let project = require("path").basename(__dirname);
let source = "#src";
let fs = require('fs');

let path = {
    build: {
        html: project + "/",
        css: project + "/css/",
        js: project + "/js/",
        img: project + "/img/",
        fonts: project + "/fonts/"
    },
    src: {
        html: [source + "/*.html", "!" + source + "/_*.html"],
        css: source + "/scss/style.scss",
        js: source + "/js/**/*.js",
        img: source + "/img/**/*.{jpg,svg,png,ico,webp,gif}",
        fonts: source + "/fonts/*.ttf"
    },
    watch: {
        html: source + "/**/*.html",
        css: source + "/scss/**/*.scss",
        js: source + "/js/**/*.js",
        img: source + "/img/**/*.{jpg,svg,png,ico,webp,gif}"
    },
    clean: "./" + project + "/"
}

let {
    src,
    dest
} = require('gulp'),
    gulp         = require('gulp'),
    browsersync  = require("browser-sync").create(),
    fileinclude  = require("gulp-file-include"),
    del          = require("del"),
    scss         = require("gulp-sass"),
    concat       = require("gulp-concat"),
    autoprefixer = require("gulp-autoprefixer"),
    group_media  = require("gulp-group-css-media-queries"),
    clean_css    = require("gulp-clean-css"),
    rename       = require("gulp-rename"),
    uglify       = require("gulp-uglify-es").default,
    imagemin     = require('gulp-imagemin'),
    webp         = require('gulp-webp'),
    webphtml     = require('gulp-webp-html'),
    webpcss      = require('gulp-webpcss'),
    svgsprite    = require('gulp-svg-sprite'),
    ttf2woff     = require('gulp-ttf2woff'),
    ttf2woff2    = require('gulp-ttf2woff2'),
    fonter       = require('gulp-fonter');

// babel = require('gulp-babel');


function browserSync(params) {
    browsersync.init({
        server: {
            baseDir: "./" + project + "/"
        },
        port: 3000,
        notify: false
    })
}

function html() {
    return src(path.src.html)
        .pipe(fileinclude())
        .pipe(webphtml())
        .pipe(dest(path.build.html))
        .pipe(browsersync.stream())
}

function libscss() {
    return src([
        'node_modules/animate.css/animate.css',
        // 'node_modules/slick-carousel/slick/slick.css',       
    ])
    .pipe(concat('libs.scss'))
    .pipe(gulp.dest('#src/scss'))
}

function css() {
    return src(path.src.css)
        .pipe(
            scss({
                outputStyle: "expanded"
            })
        )
        .pipe(
            group_media()
        )
        .pipe(
            autoprefixer({
                overrideBrowserlist: ["last 5 versions"],
                cascade: true
            })
        )
        .pipe(webpcss({
            webpClass: '.webp',
            noWebpClass: '.no-webp'
        }))
        .pipe(dest(path.build.css))
        .pipe(clean_css())
        .pipe(
            rename({
                extname: ".min.css"
            })
        )
        .pipe(dest(path.build.css))
        .pipe(browsersync.stream())
}

function libsjs() {
    return src([
        'node_modules/jquery/dist/jquery.js'
    ])
    .pipe(concat('libs.js'))
    .pipe(gulp.dest('#src/js/')) 
    .pipe(browsersync.stream())
}

function js() {
    return src(path.src.js)
        .pipe(fileinclude())
        .pipe(dest(path.build.js))
        .pipe(
            uglify()
        )
        .pipe(
            rename({
                extname: ".min.js"
            })
        )
        .pipe(dest(path.build.js))
        .pipe(browsersync.stream())
}

function images() {
    return src(path.src.img)
        .pipe(
            webp({
                quality: 70
            })
        )
        .pipe(dest(path.build.img))
        .pipe(src(path.src.img))
        .pipe(
            imagemin({
                interlaced: true,
                progressive: true,
                optimizationLevel: 3, //0 to 7
                svgoPlugins: [{
                    removeViewBox: false
                }]
            })
        )
        .pipe(dest(path.build.img))
        .pipe(browsersync.stream())
}

function fonts(params) {
    src(path.src.fonts)
        .pipe(ttf2woff())
        .pipe(dest(path.build.fonts));
    return src(path.src.fonts)
        .pipe(ttf2woff2())
        .pipe(dest(path.build.fonts));
};

gulp.task('otf2ttf2', function () {
    return gulp.src([source + '/fonts/*.otf'])
        .pipe(fonter({
            formats: ['ttf']
        }))
        .pipe(dest(source + '/fonts/'));
})
gulp.task('svgsprite', function () {
    return gulp.src([source + '/iconsprite/*.svg'])
        .pipe(svgsprite({
            mode: {
                stack: {
                    sprite: "../icons/icons.svg",
                }
            },
        }))
        .pipe(dest(path.build.img))
})

function fontsStyle(params) {
    let file_content = fs.readFileSync(source + '/scss/fonts.scss');
    if (file_content == '') {
        fs.writeFile(source + '/scss/fonts.scss', '', cb);
        return fs.readdir(path.build.fonts, function (err, items) {
            if (items) {
                let c_fontname;
                for (var i = 0; i < items.length; i++) {
                    let fontname = items[i].split('.');
                    fontname = fontname[0];
                    if (c_fontname != fontname) {
                        fs.appendFile(source + '/scss/fonts.scss', '@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n', cb);
                    }
                    c_fontname = fontname;
                }
            }
        })
    }
}


function cb() {

}


function watchfiles(params) {
    gulp.watch([path.watch.html], html);
    gulp.watch([path.watch.css], css);
    gulp.watch([path.watch.js], js);
    gulp.watch([path.watch.img], images);
}

function clean(params) {
    return del(path.clean);
}

let build = gulp.series(clean, gulp.parallel(libsjs, js, libscss, css, html, images, fonts), fontsStyle);
let watch = gulp.parallel(build, watchfiles, browserSync);

exports.libsjs = libsjs;
exports.libscss = libscss;
exports.fontsStyle = fontsStyle;
exports.fonts = fonts;
exports.images = images;
exports.js = js;
exports.css = css;
exports.html = html;
exports.build = build;
exports.watch = watch;
exports.default = watch;