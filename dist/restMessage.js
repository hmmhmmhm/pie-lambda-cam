"use strict";
exports.__esModule = true;
exports.json = function (object) {
    var stringified = JSON.stringify(object);
    var rval = {
        toString: function () {
            // @ts-ignore
            return this.string;
        }
    };
    Object.setPrototypeOf(rval, object);
    return rval;
};
exports.webcam_in_use = function (webcam) {
    exports.json({
        http_code: 500,
        code: 'webcam_in_use',
        error: 'The webcam is already in use by another process',
        webcam: webcam
    });
};
exports.invalid_webcam = function (webcam) {
    exports.json({
        http_code: 500,
        code: 'invalid_webcam',
        error: "That webcam doesn't exist",
        webcam: webcam
    });
};
