/* Requires */
const http = require('http').Server
const spawn = require('child_process').spawn
const parseUrl = require('url').parse
const messages = require('./restMessage')

export const defaultEncoder = {
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
    flags(webcam) {
        return `-f video4linux2 -i ${webcam} -f webm -deadline realtime pipe:1`
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

/* Utility functions */
export const fileExists = (file) => {
    const access = require('fs').access

    return new Promise((accept, reject) =>
        access(file, (err) => (err ? reject(false) : accept(true)))
    )
}

export const isValidWebcamDefault = (webcam) => {
    const webcamRegex = /\/dev\/video[0-9]+/

    console.log('isValidWebcamDefault')
    return new Promise((accept, reject) => {
        console.log('webcamRegex.test(webcam)', webcamRegex.test(webcam))
        if (!webcamRegex.test(webcam)) {
            reject(false)
        } else {
            fileExists(webcam).then(accept, reject)
        }
    })
}

/* Returns the isValidWebcam for a given whitelist */
export const isValidWebcamWhitelist = (whitelistArray) => {
    const whitelist = {}
    /* We create the map*/
    whitelistArray.forEach((webcam) => (whitelist[webcam] = 'valid'))

    return (webcam) =>
        new Promise((accept, reject) => {
            console.log('webcam in whitelist', webcam in whitelist)
            console.log('whitelist', whitelist, webcam)
            webcam in whitelist ? accept(true) : reject(false)
        })
}

export const defaultPage = (req, res, req_url) => {
    res.writeHead(404)
    res.end(`
    <!DOCTYPE html>
    <html>
      <head><title>４０４　ｎｏｔ－ｆｏｕｎｄ</title></head>
      <body><p>Ｓｏｒｒｙ，　ｗｅ　ｄｏｎ＇ｔ　ｋｎｏｗ　ｗｈａｔ　ｔｏ　ｄｏ</p></body>
    </html>
  `)
}

export const fillDefaults = (obj, defaults) => {
    for (var key in defaults) {
        if (obj[key] === undefined) obj[key] = defaults[key]
    }
    return obj
}

export const message = (res, code, ...args) => {
    const response = messages[code].apply(message, args)
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(response)
}

/*
 * This is the internal streamWebcam function, the returned promise resolves to
 * the spawned process
 */
export const streamWebcam = (
    webcam,
    {
        command = defaultEncoder.command,
        flags = defaultEncoder.flags,
        isSuccessful = defaultEncoder.isSuccessful,
    } = {}
) => {
    console.log('streamWebcam', webcam)
    const encoderFlags = flags(webcam).split(' ')
    let videoEncoder = undefined
    try {
        console.log(command, encoderFlags.join(' '))
        videoEncoder = spawn(command, encoderFlags)
    } catch (e) {
        console.log(e)
    }

    return new Promise((accept, reject) => {
        /* Called when is determined if the encoder has succeeded */
        function resolveSucess(hasSucceeded) {
            if (hasSucceeded === true) accept(videoEncoder)
            else reject(hasSucceeded)
        }

        isSuccessful(videoEncoder, resolveSucess)
    })
}

export const createHTTPStreamingServer = ({
    permittedWebcams,
    isValidWebcam = isValidWebcamDefault,
    webcamEndpoint = '/webcam',
    additionalEndpoints = {},
    encoder = defaultEncoder,
}: any = {}) => {
    console.log('createHTTPStreamingServer')
    additionalEndpoints[webcamEndpoint] = async (req, res, reqUrl) => {
        const webcam = reqUrl.query.webcam

        console.log('webcam', webcam)
        console.log('isValidWebcam', isValidWebcam)
        try {
            await isValidWebcam(webcam)
            console.log('ready', encoder)
            let encoderProcess: any = await streamWebcam(webcam, encoder)
            console.log('start', encoderProcess, encoderProcess.stdout)
            const video = encoderProcess.stdout

            res.writeHead(200, { 'Content-Type': encoder.mimeType })
            video.pipe(res)

            res.on('close', () => encoderProcess.kill('SIGTERM'))
            // () => message(res, 'webcam_in_use', webcam)
        } catch (e) {
            console.log('invalid_webcam')
            message(res, 'invalid_webcam', webcam)
        }
    }

    additionalEndpoints.default = additionalEndpoints.default || defaultPage
    fillDefaults(encoder, defaultEncoder)

    if (permittedWebcams) {
        console.log('permittedWebcams', permittedWebcams)
        isValidWebcam = isValidWebcamWhitelist(permittedWebcams)
    }

    try {
        console.log('Start Server...')
        const server = http((req, res) => {
            const reqUrl = parseUrl(req.url, true)
            const processRequest =
                additionalEndpoints[reqUrl.pathname] ||
                additionalEndpoints.default

            try {
                processRequest(req, res, reqUrl)
            } catch (e) {
                console.log('A1', e)
            }
        })

        return server
    } catch (e) {
        console.log('A2', e)
        return undefined
    }
}
