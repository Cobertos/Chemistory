const gulp = require("gulp");
const sass = require("gulp-sass");
const cleanCSS = require('gulp-clean-css');
const webpack = require('webpack');
const WebpackMessages = require('webpack-messages');
const gulpWebpack = require('webpack-stream');
const mocha = require('gulp-mocha'); //Requires filepaths, not vinyl objects!
const browserSync = require('browser-sync').create();
const merge = require('webpack-merge');

const SRC_DIR = "src"; //Source directory
const DIST_DIR = "dist"; //Distribution directory
const TEST_DIR = "test"; //Directory the tests live in

const path = require("path");
const git = require('isomorphic-git');
const fs = require("fs");
git.plugins.set('fs', fs);
const RSVP = require("rsvp");
RSVP.on("error", (err)=>console.error("Uncaught error: ", err));
const readFilePromise = (file, encoding)=>{
    return new RSVP.Promise((resolve, reject)=>{
        fs.readFile(file, encoding, (err, data)=>{
            if(err) {
                reject(err);
            }
            else {
                resolve(data);
            }
        })
    });
};

const webpackOpts = (which)=>{
    const base = {
        mode : "development",
        context : path.resolve(__dirname, "./" + SRC_DIR + "/js"),
        entry : {
            main: "./main.js",
            OimoWorker: "./OIMOWorker.js"
        },
        output : {
            //path : //handled by gulp
            filename : "[name].js",
            library : "burstGame",
            libraryTarget : "umd",
            //https://github.com/webpack/webpack/issues/6525
            //Until webpack implements a solution that solves all their
            //corner cases, this will work in NodeJS, Browser, and Webworkers
            //for us!
            globalObject: "typeof self !== 'undefined' ? self : this"
        },
        resolve: {
            alias : {
                "three-examples" : "three/examples/js"
            }
        },
        module : {
            rules : [{
                test: /buildInfo\.json$/,
                use: {
                    loader: path.resolve(__dirname, 'substitute-loader.js'),
                    options: substituteLoaderOptions
                }
            }, {
                test : /\.html$/,
                loader : "html-loader"
            }, {
                test : /\.(js|json)$/,
                exclude : /(node_modules|bower_components|LoaderSupport|OBJLoader2)/,
                use: [{
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            ['env', {
                                "targets": {
                                    "browsers": [
                                        "last 2 versions",
                                        "IE >= 9"
                                    ]
                                }
                            }],
                        ],
                        plugins: [
                            ['transform-runtime', {
                                "regenerator": true,
                            }]
                        ],
                        cacheDirectory : true
                    }
                }, {
                    loader: 'ifdef-loader',
                    options: {
                        //OVERRIDEN IN CHILD
                        BROWSER: false,
                        NODEJS: false
                    }
                }]
            }, {
                test : /(three[\\\/]examples[\\\/]js|(OBJLoader2|LoaderSupport)\.js$)/,
                loader : "imports-loader?THREE=three"
            }]
        },
        devtool: "source-map",
        plugins: [
            new webpack.IgnorePlugin(/worker_threads/),
            //Optimize moment by not loading any extra locales
            new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
            //Show webpack stats messages (TODO: Make our own _cool_ one)
            new WebpackMessages({
              name: which,
              logger: str => console.log(`| ${str}`)
            })
        ]
    };
    const isServer = which === "SERVER";
    const isClient = which === "CLIENT";
    const isTest = which === "TEST";
    if(isServer) {
        base = merge(base, {
            entry: {
                server: base.entry.main
            }
        });
        delete base.entry.main; //Don't generate main
        base.module.rules[2].use[1].options.NODEJS = true;
        return base;
    }
    else if(isClient){
        base.module.rules[2].use[1].options.BROWSER = true;
        return base;
    }
    else if(isTest){
        base.context = path.resolve(__dirname, TEST_DIR);
        base.entry = {
            test: "./main.js"
        };
        base.module.rules[2].use[1].options.NODEJS = true;
        return base;
    }
    throw new Error("Invalid webpack config param " + which);
}

const substituteLoaderOptions = {};
gulp.task(async function buildInfo(){
    const ref = git.resolveRef({dir: ".", ref: 'HEAD', depth: 2});
    const buildInfo = await RSVP.hash({
        branch: git.currentBranch({dir: "."}),
        commit: git.resolveRef({dir: ".", ref: "HEAD"})
                .then((id)=>id.slice(-8)),
        description: readFilePromise("DESCRIPTION.md", "utf8"),
        changelog: readFilePromise("CHANGELOG.md", "utf8"),
        time: Date.now()
    });
    substituteLoaderOptions.substitute=JSON.stringify(buildInfo);
    return buildInfo;
});

gulp.task(function scss(){
    return gulp.src(SRC_DIR + '/scss/main.scss')
        .pipe(sass().on('error', sass.logError))
        //Minify and optimize
        /*.pipe(cleanCSS({debug: true}, (details) => {
          console.log(details.name + ": " + details.stats.originalSize);
          console.log(details.name + ": " + details.stats.minifiedSize);
        }))*/
        .pipe(gulp.dest( DIST_DIR + "/css" ))
        .pipe(browserSync.stream());
});

gulp.task("jsBrowser", gulp.series("buildInfo", ()=>{
    return gulp.src("./")
        .pipe(gulpWebpack( webpackOpts("CLIENT"), webpack ))
        .pipe(gulp.dest( DIST_DIR + "/js" ));
}));

gulp.task("jsServer", gulp.series("buildInfo", ()=>{
    return gulp.src("./")
        .pipe(gulpWebpack( webpackOpts("SERVER"), webpack ))
        .pipe(gulp.dest( DIST_DIR + "/server" ));
}));

gulp.task("jsTest", gulp.series("buildInfo", ()=>{
    return gulp.src("./")
        .pipe(gulpWebpack( webpackOpts("TEST"), webpack ))
        .pipe(gulp.dest( DIST_DIR + "/test" ));
}));
gulp.task("test", gulp.series("jsTest", ()=>{
    return gulp.src( DIST_DIR + "/test" )
        .pipe(mocha());
}));

gulp.task(function assets(){
    return gulp.src([
      SRC_DIR + "/**/*",
      "!" + SRC_DIR + "/js/**/*",
      "!" + SRC_DIR + "/scss/**/*",
    ])
    .pipe(gulp.dest( DIST_DIR ))
});

gulp.task(function serve(){
    browserSync.init({
        server: {
            port: 10101,
            baseDir: DIST_DIR
        }
    });
});

//TODO: Readd prod build
gulp.task("build", gulp.parallel("jsBrowser", "jsServer", "scss", "assets"));
gulp.task(function watch(){
    gulp.watch(SRC_DIR + "/scss/**/*", gulp.task("scss"));
    gulp.watch(SRC_DIR + "/js/**/*", gulp.series(gulp.parallel("jsBrowser", "jsServer"), function reload(done){
        browserSync.reload();
        done();
    }));
    gulp.watch(TEST_DIR + "/**/*", gulp.task("test"));
    //TODO: Readd, this is one cause of it taking so long to Ctrl + C gulp
    /*gulp.watch([
      SRC_DIR + "/** /*",
      "!" + SRC_DIR + "/js/** /*",
      "!" + SRC_DIR + "/scss/** /*",
    ], gulp.task("assets"));*/
});
gulp.task("dev", gulp.series("build", gulp.parallel("watch", "serve")));
gulp.task("default", gulp.task("dev"));
