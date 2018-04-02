var path = require("path");
var NodeGit = require("NodeGit");
var RSVP = require("rsvp");
RSVP.on("error", (err)=>console.error("Uncaught error: ", err));
var fs = require("fs");
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
var repo = NodeGit.Repository.open(".");
var substituteLoaderOptions = {};
var buildInfo = RSVP.hash({
	branch: repo.then((repo)=>repo.getCurrentBranch())
				.then((ref)=>ref.name()),
	commit: repo.then((repo)=>repo.getHeadCommit())
				.then((commit)=>commit.id().tostrS().slice(-8)),
	description: readFilePromise("DESCRIPTION.md", "utf8"),
	changelog: readFilePromise("CHANGELOG.md", "utf8")
}).then((o)=>{
	buildInfo=o;
	substituteLoaderOptions.substitute=JSON.stringify(o);
	return o;
});

module.exports = function(grunt) {

	var SRC_DIR = "src"; //Source directory
	var DIST_DIR = "dist"; //Distribution directory

	grunt.initConfig({
		webpack: {
			dist : {
				mode : "development",
				context : path.resolve(__dirname, "./" + SRC_DIR + "/js"),
				entry : "./main.js",
				output : {
					path : path.resolve(__dirname, DIST_DIR + "/js"),
					filename : "main.js",
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
						exclude : /(node_modules|bower_components)/,
						loader: 'babel-loader',
						query: {
							presets: ['es2015'],
							plugins: ['transform-runtime'],
							cacheDirectory : true
						}
					}, {
						test : /three[\\\/]examples[\\\/]js/,
						loader : "imports-loader?THREE=three"
					}, {
						test: /OIMOWorker\.js$/,
						use: {
							loader: 'worker-loader',
							options: { publicPath: '/js/'}
						},
					}]
				},
				devtool: "source-map"
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
	grunt.registerTask('waitForBuildInfo', 'waits', function(){
		if(!(typeof buildInfo.then === "function")) {
			console.log("Got build info", buildInfo);
			return; //Promise already resolved
		}
		//Otherwise, Wait for promise
		console.log("Getting build info");
		let done = this.async();
		buildInfo.then(()=>{
					console.log("Got build info", buildInfo);
					done();
				}).catch((err)=>{
					console.error("Failed to get build info");
					setTimeout(()=>{throw err;}, 0);
				});
	});
	grunt.registerTask('buildJS', ["waitForBuildInfo", "webpack:dist"]);
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
