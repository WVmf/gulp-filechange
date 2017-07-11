"use strict"
var gutil = require("gulp-util");
var through = require("through2");

/**	@summary The provided callback function will be called for each file that passes through.
 *	@param {function} fn - A callback function that will be provided with one parameter, the (Vinyl) file object that is being processed. The properties from this
 *	file object can be modified in the callback function, or a completely new (Vinyl) file can be returned. (In the former case nothing needs to be returned.)
 */
module.exports = function (fn) {
	if ( !fn || typeof fn !== "function" ) {
		throw new gutil.PluginError("gulp-filechange", "Need a callback function.");
	}

	// Callback signature: callback(err, chunk)
	return through.obj(function (file, encoding, callback) {
		if ( file.isNull() ) {
			return callback(null, file);
		}
		if ( file.isStream() ) {
			return callback(new gutil.PluginError("gulp-filechange", "Streaming not supported."));
		}

		var newfile = fn(file);
		// Update the file if a new one was returned; otherwise just use the original file object (whose properties nonetheless might have been updated by the callback function).
		// Note: Older version of Gulp (< v4.x) use an old version of Vinyl that doesn't yet support Vinyl.isVinyl(), so we manually check if it has all of the Vinyl properties.
		if ( newfile && (newfile._isVinyl || (newfile.history && newfile.cwd && newfile.base && newfile.stat !== undefined && newfile.contents !== undefined)) ) {
			file = newfile;
		}

		// Send the file back to the stream.
		callback(null, file);
	});
}
