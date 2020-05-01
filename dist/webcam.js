"use strict";
exports.__esModule = true;
/* Requires */
var http = require('http').Server;
var spawn = require('child_process').spawn;
var parseUrl = require('url').parse;
var messages = require('./restMessage');
exports.defaultEncoder = {
    /*
     * encoder command or location
     */
    command: 'avconv',
    /*
     * Function that returns the required flags, the video is expected to be
     * written to stdout
     *
     * Note: for video size you have to use a string like
     *   `-f video4linux2 -video_size 1280x960 -i ${webcam} -f webm -deadline realtime pipe:1`
     * The other option is to scan the available resolutions and choose one based
     * on certain policy, the avlib/ffmpeg command for this is
     *   `-f video4linux2 -list_formats all -i ${webcam}`
     */
    flags: function (webcam) {
        return "-f video4linux2 -i " + webcam + " -f webm -deadline realtime pipe:1";
    },
    /*
     * MIME type of the output stream
     */
    mimeType: 'video/webm',
    /*
     * Function that detects the success of the encoder process,
     * does cb(true) in case of succes, any other value for failure
     *
     * Calling cb more than one time has no effect
     *
     * encoderProcess is of type ChildProcess
     *
     *  This default isn't perfect but covers most of the cases
     */
    isSuccessful: function (encoderProcess, cb) {
        var started = false;
        encoderProcess.stderr.setEncoding('utf8');
        encoderProcess.stderr.on('data', function (data) {
            /* I trust that the output is line-buffered */
            var startedText = /Press ctrl-c to stop encoding/;
            if (startedText.test(data)) {
                cb(true);
                started = true;
            }
        });
        /* If the process start was not detected and it exited it's surely a failure */
        encoderProcess.on('exit', function () {
            if (!started)
                cb(false);
        });
    }
};
/* Utility functions */
exports.fileExists = function (file) {
    var access = require('fs').access;
    return new Promise(function (accept, reject) {
        return access(file, function (err) { return (err ? reject(false) : accept(true)); });
    });
};
exports.isValidWebcamDefault = function (webcam) {
    var webcamRegex = /\/dev\/video[0-9]+/;
    return new Promise(function (accept, reject) {
        if (!webcamRegex.test(webcam)) {
            reject(false);
        }
        else {
            exports.fileExists(webcam).then(accept, reject);
        }
    });
};
/* Returns the isValidWebcam for a given whitelist */
exports.isValidWebcamWhitelist = function (whitelistArray) {
    var whitelist = {};
    /* We create the map*/
    whitelistArray.forEach(function (webcam) { return (whitelist[webcam] = 'valid'); });
    return function (webcam) {
        return new Promise(function (accept, reject) {
            return webcam in whitelist ? accept(true) : reject(false);
        });
    };
};
exports.defaultPage = function (req, res, req_url) {
    res.writeHead(404);
    res.end("\n    <!DOCTYPE html>\n    <html>\n      <head><title>\uFF14\uFF10\uFF14\u3000\uFF4E\uFF4F\uFF54\uFF0D\uFF46\uFF4F\uFF55\uFF4E\uFF44</title></head>\n      <body><p>\uFF33\uFF4F\uFF52\uFF52\uFF59\uFF0C\u3000\uFF57\uFF45\u3000\uFF44\uFF4F\uFF4E\uFF07\uFF54\u3000\uFF4B\uFF4E\uFF4F\uFF57\u3000\uFF57\uFF48\uFF41\uFF54\u3000\uFF54\uFF4F\u3000\uFF44\uFF4F</p></body>\n    </html>\n  ");
};
exports.fillDefaults = function (obj, defaults) {
    for (var key in defaults) {
        if (obj[key] === undefined)
            obj[key] = defaults[key];
    }
    return obj;
};
exports.message = function (res, code) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    var response = messages[code].apply(exports.message, args);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(response);
};
/*
 * This is the internal streamWebcam function, the returned promise resolves to
 * the spawned process
 */
exports.streamWebcam = function (webcam, _a) {
    var _b = _a === void 0 ? {} : _a, _c = _b.command, command = _c === void 0 ? exports.defaultEncoder.command : _c, _d = _b.flags, flags = _d === void 0 ? exports.defaultEncoder.flags : _d, _e = _b.isSuccessful, isSuccessful = _e === void 0 ? exports.defaultEncoder.isSuccessful : _e;
    var encoderFlags = flags(webcam).split(' ');
    var videoEncoder = spawn(command, encoderFlags);
    return new Promise(function (accept, reject) {
        /* Called when is determined if the encoder has succeeded */
        function resolveSucess(hasSucceeded) {
            if (hasSucceeded === true)
                accept(videoEncoder);
            else
                reject(hasSucceeded);
        }
        isSuccessful(videoEncoder, resolveSucess);
    });
};
exports.createHTTPStreamingServer = (exports.createHTTPStreamingServer = function (_a) {
    var _b = _a === void 0 ? {} : _a, permittedWebcams = _b.permittedWebcams, _c = _b.isValidWebcam, isValidWebcam = _c === void 0 ? exports.isValidWebcamDefault : _c, _d = _b.webcamEndpoint, webcamEndpoint = _d === void 0 ? '/webcam' : _d, _e = _b.additionalEndpoints, additionalEndpoints = _e === void 0 ? {} : _e, _f = _b.encoder, encoder = _f === void 0 ? exports.defaultEncoder : _f;
    additionalEndpoints[webcamEndpoint] = function (req, res, reqUrl) {
        var webcam = reqUrl.query.webcam;
        isValidWebcam(webcam).then(function () {
            return exports.streamWebcam(webcam, encoder).then(function (encoderProcess) {
                var video = encoderProcess.stdout;
                res.writeHead(200, { 'Content-Type': encoder.mimeType });
                video.pipe(res);
                res.on('close', function () { return encoderProcess.kill('SIGTERM'); });
            }, function () { return exports.message(res, 'webcam_in_use', webcam); });
        }, function () { return exports.message(res, 'invalid_webcam', webcam); });
    };
    additionalEndpoints["default"] = additionalEndpoints["default"] || exports.defaultPage;
    exports.fillDefaults(encoder, exports.defaultEncoder);
    if (permittedWebcams) {
        isValidWebcam = exports.isValidWebcamWhitelist(permittedWebcams);
    }
    var server = http(function (req, res) {
        var reqUrl = parseUrl(req.url, true);
        var processRequest = additionalEndpoints[reqUrl.pathname] || additionalEndpoints["default"];
        processRequest(req, res, reqUrl);
    });
    return server;
});
