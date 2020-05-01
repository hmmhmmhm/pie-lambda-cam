export const json = (object) => {
    const stringified = JSON.stringify(object)
    const rval = {
        toString() {
            // @ts-ignore
            return this.string
        },
    }

    Object.setPrototypeOf(rval, object)
    return rval
}

export const webcam_in_use = (webcam) => {
    json({
        http_code: 500,
        code: 'webcam_in_use',
        error: 'The webcam is already in use by another process',
        webcam: webcam,
    })
}

export const invalid_webcam = (webcam) => {
    json({
        http_code: 500,
        code: 'invalid_webcam',
        error: "That webcam doesn't exist",
        webcam: webcam,
    })
}
