"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
exports.__esModule = true;
// import webcam from 'webcam-http-streaming'
var webcam = __importStar(require("./webcam"));
var fs = __importStar(require("fs"));
exports.fileExists = function (file) {
    var access = fs.access;
    return new Promise(function (accept, reject) {
        return access(file, function (err) { return (err ? reject(false) : accept(true)); });
    });
};
exports.encoder = {
    /*
     * encoder command or location
     *   Default: avconv
     */
    command: 'ffmpeg',
    /*
     * Function that returns the required flags, the video is expected to be
     * written to stdout
     *   Default: shown below
     */
    flags: function (_webcam) {
        return "-f video4linux2 -i " + _webcam + " -f webm -deadline realtime pipe:1";
    },
    /*
     * MIME type of the output stream
     *   Default: 'video/webm'
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
     *  Default: shown below, it isn't perfect but covers most of the cases
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
exports.startServer = function () {
    /* Suppose i want to use the default REST API */
    var server = webcam
        .createHTTPStreamingServer({
        /*
         * Optional: A list of the permitted webcams, if it's specified overrides
         * isValidWebcam
         */
        permittedWebcams: ['/dev/video0', '/dev/video1'],
        /*
         * Validates if a given path is a valid webcam for use, the default is shown
         * below
         */
        isValidWebcam: function (webcam) {
            var webcamRegex = /\/dev\/video[0-9]+/;
            return new Promise(function (accept, reject) {
                /* If doesn't seem like a video device block we will fail */
                if (!webcamRegex.test(webcam)) {
                    reject(false);
                }
                else {
                    /* ... and if the file doesn't exists */
                    exports.fileExists(webcam).then(accept, reject);
                }
            });
        },
        /*
         * The endpoint for requesting streams of the REST api
         *   Defaults to '/webcam'
         */
        webcamEndpoint: '/webcam',
        /*
         * Custom endpoints to extend the REST API
         *   req: [IncomingMessage](https://nodejs.org/api/http.html#http_class_http_incomingmessage)
         *   res: [ServerResponse](https://nodejs.org/api/http.html#http_class_http_serverresponse)
         *   reqUrl: [URL Object](https://nodejs.org/api/url.html#url_url_strings_and_url_objects)
         *            with [QueryString](https://nodejs.org/api/querystring.html#querystring_querystring_parse_str_sep_eq_options)
         *
         * Note: the endpoint 'default' is used for any non-matching request
         */
        additionalEndpoints: {
            '/list_webcams': function (req, res, reqUrl) {
                res.end('<html>...</html>');
            }
        },
        encoder: exports.encoder
    })
        .listen(8080);
    /* Returns a promise that resolves to the video stream (stream.Readable) */
    var videoStream = undefined;
    try {
        videoStream = webcam.streamWebcam('/dev/video0', exports.encoder);
    }
    catch (e) {
        console.log(e);
    }
    return { server: server, videoStream: videoStream };
};
