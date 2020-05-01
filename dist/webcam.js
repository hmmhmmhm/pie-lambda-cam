"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
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
    console.log('isValidWebcamDefault');
    return new Promise(function (accept, reject) {
        console.log('webcamRegex.test(webcam)', webcamRegex.test(webcam));
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
            console.log('webcam in whitelist', webcam in whitelist);
            console.log('whitelist', whitelist, webcam);
            webcam in whitelist ? accept(true) : reject(false);
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
    console.log('streamWebcam', webcam);
    var encoderFlags = flags(webcam).split(' ');
    var videoEncoder = undefined;
    try {
        videoEncoder = spawn(command, encoderFlags);
    }
    catch (e) {
        console.log(e);
    }
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
exports.createHTTPStreamingServer = function (_a) {
    var _b = _a === void 0 ? {} : _a, permittedWebcams = _b.permittedWebcams, _c = _b.isValidWebcam, isValidWebcam = _c === void 0 ? exports.isValidWebcamDefault : _c, _d = _b.webcamEndpoint, webcamEndpoint = _d === void 0 ? '/webcam' : _d, _e = _b.additionalEndpoints, additionalEndpoints = _e === void 0 ? {} : _e, _f = _b.encoder, encoder = _f === void 0 ? exports.defaultEncoder : _f;
    console.log('createHTTPStreamingServer');
    additionalEndpoints[webcamEndpoint] = function (req, res, reqUrl) { return __awaiter(void 0, void 0, void 0, function () {
        var webcam, encoderProcess_1, video, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    webcam = reqUrl.query.webcam;
                    console.log('webcam', webcam);
                    console.log('isValidWebcam', isValidWebcam);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, isValidWebcam(webcam)];
                case 2:
                    _a.sent();
                    console.log('ready', encoder);
                    return [4 /*yield*/, exports.streamWebcam(webcam, encoder)];
                case 3:
                    encoderProcess_1 = _a.sent();
                    console.log('start', encoderProcess_1, encoderProcess_1.stdout);
                    video = encoderProcess_1.stdout;
                    res.writeHead(200, { 'Content-Type': encoder.mimeType });
                    video.pipe(res);
                    res.on('close', function () { return encoderProcess_1.kill('SIGTERM'); });
                    return [3 /*break*/, 5];
                case 4:
                    e_1 = _a.sent();
                    console.log('invalid_webcam');
                    exports.message(res, 'invalid_webcam', webcam);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    additionalEndpoints["default"] = additionalEndpoints["default"] || exports.defaultPage;
    exports.fillDefaults(encoder, exports.defaultEncoder);
    if (permittedWebcams) {
        console.log('permittedWebcams', permittedWebcams);
        isValidWebcam = exports.isValidWebcamWhitelist(permittedWebcams);
    }
    try {
        console.log('Start Server...');
        var server = http(function (req, res) {
            var reqUrl = parseUrl(req.url, true);
            var processRequest = additionalEndpoints[reqUrl.pathname] ||
                additionalEndpoints["default"];
            try {
                processRequest(req, res, reqUrl);
            }
            catch (e) {
                console.log('A1', e);
            }
        });
        return server;
    }
    catch (e) {
        console.log('A2', e);
        return undefined;
    }
};
