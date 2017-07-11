"use strict";

var assert = require("assert");
var Vinyl = require("vinyl");
var through = require("through2");
var PassThrough = require("stream").PassThrough;
var filechange = require("../");

describe("gulp-filechange", function () {
	describe("basic_test", function () {
		it("should throw an error if no parameter is provided", function (done) {
			assert.throws(() => {
				filechange();
			}, function(err) {
				if ( (err instanceof Error) && /gulp-filechange/.test(err) && /Need a callback function/.test(err) ) {
					return true;
				} else return false;
			}, "Didn't throw error with '' or 'Need a callback function'.");
			done();
		});

		it("should throw an error if provided parameter is no function", function (done) {
			assert.throws(() => {
				filechange("abc");
			}, function(err) {
				if ( (err instanceof Error) && /gulp-filechange/.test(err) && /Need a callback function./.test(err) ) {
					return true;
				} else return false;
			}, "Didn't throw error with 'gulp-filechange' or 'Need a callback function.'.");
			done();
		});

		it("should accept a function", function () {
			try {
				filechange(() => {});
			} catch ( ex ) {
				assert.ifError(ex);
			}
		});
	});

	describe("file_tests", function () {
		var file = null;
		beforeEach("Create clean file.", function () {
			file = new Vinyl({
				cwd: "/",
				base: "/test/",
				path: "/test/file.js",
				contents: new Buffer("test 123...")
			});
		});

		it("should throw an error for streamed files", function (done) {
			file.contents = new PassThrough();
			var doneCalled = false;

			var stream = filechange((f) => {
				assert.fail("received file callback while it should have errored.");
			});
			stream.on("error", function(err) {
				doneCalled = true;
				if ( (err instanceof Error) && /gulp-filechange/.test(err) && /Streaming not supported./.test(err) ) {
					done();
				} else {
					done(err);
				}
			});
			stream.on("data", () => {
				assert.ok(!doneCalled, "data event received while error should have been thrown.");
			});
			stream.on("end", function () {
				assert.ok(!doneCalled, "end event received while error should have been thrown.");
			});
			stream.on("finish", function () {
				assert.ok(!doneCalled, "finish event received while error should have been thrown.");
			});

			// Pass the fake file to filechange.
			stream.write(file);
			stream.end();
		});

		it("should ignore empty files", function (done) {
			file.contents = null;

			var stream = filechange((f) => {
				assert.fail("Shouldn't receive callback for empty file.");
			});
			stream.on("error", done);
			stream.pipe(through.obj((f) => {
				assert.ok(f.isNull(), "File passed isn't empty.");
				done();
			}));

			stream.end(file);
		});

		it("should pass on unmodified file", function (done) {
			var stream = filechange((f) => {});
			stream.pipe(through.obj((f) => {
				assert.equal(f.cwd, "/", "File 'cwd' doesn't match.");
				assert.equal(f.base, "/test/", "File 'base' doesn't match.");
				assert.equal(f.path, "/test/file.js", "File 'path' doesn't match.");
				assert.equal(f.contents.toString(), "test 123...", "File 'contents' do not match.");
				done();
			}));

			stream.end(file);
		});

		it("should pass on modified file", function (done) {
			var stream = filechange((f) => {
				f.path = "/test/some.js";
				f.contents = new Buffer("321... test");
			});
			stream.pipe(through.obj((f) => {
				assert.equal(f.cwd, "/", "File 'cwd' doesn't match.");
				assert.equal(f.base, "/test/", "File 'base' doesn't match.");
				assert.equal(f.path, "/test/some.js", "File 'path' doesn't match.");
				assert.equal(f.contents.toString(), "321... test", "File 'contents' do not match.");
				done();
			}));

			stream.end(file);
		});

		it("should pass on new file", function (done) {
			var stream = filechange((f) => {
				return new Vinyl({
					cwd: "/root/",
					base: "/of/",
					path: "/of/tree.js",
					contents: new Buffer("321... test")
				});
			});
			stream.pipe(through.obj((f) => {
				assert.equal(f.cwd, "/root/", "File 'cwd' doesn't match.");
				assert.equal(f.base, "/of/", "File 'base' doesn't match.");
				assert.equal(f.path, "/of/tree.js", "File 'path' doesn't match.");
				assert.equal(f.contents.toString(), "321... test", "File 'contents' do not match.");
				done();
			}));

			stream.end(file);
		});
	});
});
