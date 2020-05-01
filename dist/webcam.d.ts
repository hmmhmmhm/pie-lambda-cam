export declare const defaultEncoder: {
    command: string;
    flags(webcam: any): string;
    mimeType: string;
    isSuccessful(encoderProcess: any, cb: any): void;
};
export declare const fileExists: (file: any) => Promise<unknown>;
export declare const isValidWebcamDefault: (webcam: any) => Promise<unknown>;
export declare const isValidWebcamWhitelist: (whitelistArray: any) => (webcam: any) => Promise<unknown>;
export declare const defaultPage: (req: any, res: any, req_url: any) => void;
export declare const fillDefaults: (obj: any, defaults: any) => any;
export declare const message: (res: any, code: any, ...args: any[]) => void;
export declare const streamWebcam: (webcam: any, { command, flags, isSuccessful, }?: {
    command?: string | undefined;
    flags?: ((webcam: any) => string) | undefined;
    isSuccessful?: ((encoderProcess: any, cb: any) => void) | undefined;
}) => Promise<unknown>;
export declare const createHTTPStreamingServer: ({ permittedWebcams, isValidWebcam, webcamEndpoint, additionalEndpoints, encoder, }?: any) => any;
