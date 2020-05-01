import webcam from 'webcam-http-streaming'
import * as fs from 'fs'

console.log('webcam', webcam)
export const fileExists = (file) => {
    const access = fs.access

    return new Promise((accept, reject) =>
        access(file, (err) => (err ? reject(false) : accept(true)))
    )
}

export const encoder = {
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
    flags(webcam) {
        return `-f video4linux2 -i ${webcam} -f webm -deadline realtime pipe:1`
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
    isSuccessful(encoderProcess, cb) {
        let started = false
        encoderProcess.stderr.setEncoding('utf8')
        encoderProcess.stderr.on('data', (data) => {
            /* I trust that the output is line-buffered */
            const startedText = /Press ctrl-c to stop encoding/
            if (startedText.test(data)) {
                cb(true)
                started = true
            }
        })
        /* If the process start was not detected and it exited it's surely a failure */
        encoderProcess.on('exit', () => {
            if (!started) cb(false)
        })
    },
}

export const startServer = () => {
    /* Suppose i want to use the default REST API */
    const server = webcam
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
            isValidWebcam(webcam) {
                const webcamRegex = /\/dev\/video[0-9]+/

                return new Promise((accept, reject) => {
                    /* If doesn't seem like a video device block we will fail */
                    if (!webcamRegex.test(webcam)) {
                        reject(false)
                    } else {
                        /* ... and if the file doesn't exists */
                        fileExists(webcam).then(accept, reject)
                    }
                })
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
                '/list_webcams': (req, res, reqUrl) => {
                    res.end('<html>...</html>')
                },
            },
            encoder: encoder,
        })
        .listen(8080)

    /* Returns a promise that resolves to the video stream (stream.Readable) */
    const videoStream = webcam.streamWebcam('/dev/video0', encoder)

    return { server, videoStream }
}
