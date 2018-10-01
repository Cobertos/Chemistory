var webpack = require("webpack");
var path = require("path");
var git = require('isomorphic-git');
var fs = require("fs");
git.plugins.set('fs', fs);
var RSVP = require("rsvp");
RSVP.on("error", (err)=>console.error("Uncaught error: ", err));
var readFilePromise = (file, encoding)=>{
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

//Global build info, fetched asynchronously (there's a task that waits for it)
var substituteLoaderOptions = {};
var getLatestBuildInfo = ()=>{
	var ref = git.resolveRef({dir: ".", ref: 'HEAD', depth: 2});
	var buildInfoPromise = RSVP.hash({
		branch: git.currentBranch({dir: "."}),
		commit: git.resolveRef({dir: ".", ref: "HEAD"})
				.then((id)=>id.slice(-8)),
		description: readFilePromise("DESCRIPTION.md", "utf8"),
		changelog: readFilePromise("CHANGELOG.md", "utf8"),
		time: Date.now()
	}).then((o)=>{
		substituteLoaderOptions.substitute=JSON.stringify(o);
		return o;
	});
	return buildInfoPromise;
};

const SRC_DIR = "src"; //Source directory
const DIST_DIR = "dist"; //Distribution directory
const baseWebpack = {
	mode : "development",
	context : path.resolve(__dirname, "./" + SRC_DIR + "/js"),
	entry : {
		main: "./main.js",
		OimoWorker: "./OIMOWorker.js"
	},
	output : {
		path : path.resolve(__dirname, DIST_DIR + "/js"),
		filename : "[name].js",
		library : "burstGame",
		libraryTarget : "umd"
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
			loader: 'babel-loader',
			query: {
				presets: ['es2015'],
				plugins: ['transform-runtime'],
				cacheDirectory : true
			}
		}, {
			test : /(three[\\\/]examples[\\\/]js|(OBJLoader2|LoaderSupport)\.js$)/,
			loader : "imports-loader?THREE=three"
		}]
	},
	devtool: "source-map",
	plugins: [
		new webpack.IgnorePlugin(/worker_threads/)
	]
}

module.exports = function(grunt) {

	grunt.initConfig({
		webpack: {
			dist : {
				...baseWebpack
			},
			distServer : {
				...baseWebpack,
				entry: {
					...baseWebpack.entry,
					server: baseWebpack.entry.main
				},
				output : {
					...baseWebpack.output,
					path: path.resolve(__dirname, DIST_DIR, "server"),
					libraryTarget: "var",
				},
				module : {
					...baseWebpack.module,
					rules : [ ...baseWebpack.module.rules, {
						test : /three\.module\.js$/,
						use : {
							loader: path.resolve(__dirname, 'require-loader.js'),
							options: {
								requires : {
									"XMLHttpRequest":  ["xhr2"]
								}
							}
						}
					}]
				}
			}
		},
		uglify: {
			dist: {
				files : [{
					src : DIST_DIR + "/js/main.js",
					dest : DIST_DIR + "/js/main.js"
				}]
			}
		},

		sass: {
			dist : {
				files: [{
					src : SRC_DIR + "/scss/main.scss",
					dest : DIST_DIR + "/css/main.css"
				}]
			}

		},
		cssmin: {
			dist : {
				files : [{
					src : DIST_DIR + "/css/main.css",
					dest : DIST_DIR + "/css/main.css",
				}]
			}
		},

		sync: {
			dist : {
				files : [{
					expand: true,
					cwd: SRC_DIR,
					src: ["**/*", "!js/**/*", "!scss/**/*", "!js", "!scss"],
					dest: DIST_DIR
				}],
				verbose: true,
				failOnError: true,
				updateAndDelete: true,
				ignoreInDest: ["js/**/*", "css/**/*", "js", "css"],
				compareUsing: "md5"
			},
			js : {
				files : [{
					expand: true,
					cwd: SRC_DIR + "/js",
					src: ["ammo.js", "physi_worker.js"],
					dest: DIST_DIR + "/js"
				}],
				verbose: true,
				failOnError: true,
				updateAndDelete: true,
				ignoreInDest: ["**/*", "!ammo.js", "!physi_worker.js"],
				compareUsing: "md5"
			}
		},

		watch: {
			scss : {
				files : [SRC_DIR + "/scss/**/*"],
				tasks : ["buildCSS"],
				options : {
					interrupt : true
				}
			},
			js : {
				files : [SRC_DIR + "/js/**/*"],
				tasks : ["buildJS"],
				options : {
					interrupt : true
				}
			},
			other : {
				files : [SRC_DIR + "/**/*",
				"!" + SRC_DIR + "/js/**/*",
				"!" + SRC_DIR + "/scss/**/*",
				"!" + SRC_DIR + "/js",
				"!" + SRC_DIR + "/scss"],
				tasks : ["buildOther"],
				options : {
					interrupt : true
				}
			}
		},

		concurrent : {
			watch : {
				tasks : ["watch:scss", "watch:js", "watch:other"],
				options : {
					logConcurrentOutput : true
				}
			}
		},

		connect : {
			server: {
				options: {
					port: 10101,
					base: "dist",
					hostname: '*',
				}
			}
		}
	});

	require('jit-grunt')(grunt);
	require('time-grunt')(grunt);

	//Parts
	grunt.registerTask('updateBuildInfo', 'Updates the build info object', function(){
		let done = this.async();
		console.log("Getting build info");
		getLatestBuildInfo().then((info)=>{
				console.log("Got build info", info);
				done();
			}).catch((err)=>{
				console.error("Failed to get build info");
				setTimeout(()=>{throw err;}, 0);
			});
	});
	grunt.registerTask('buildJS', ["updateBuildInfo", "webpack:dist"]);
	grunt.registerTask('buildJSServer', ["updateBuildInfo", "webpack:distServer"]);
	grunt.registerTask('buildCSS', ["sass:dist"]);
	grunt.registerTask('buildOther', ["sync:dist", "sync:js"]);

	grunt.registerTask('buildJSProd', ["buildJS", "uglify:dist"]);
	grunt.registerTask('buildCSSProd', ["buildCSS", "cssmin:dist"]);

	//Production builds
	grunt.registerTask('buildProd', ["buildOther", "buildJSProd", "buildCSSProd"]);

	//Dev builds & watching
	grunt.registerTask('buildDev', ["buildOther", "buildJS", "buildCSS"]);
	grunt.registerTask('dev', ["buildDev", "connect", "concurrent:watch"]);
	grunt.registerTask('default', ["dev"]);
};
