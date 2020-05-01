export declare const fileExists: (file: any) => Promise<unknown>;
export declare const encoder: {
    command: string;
    flags(_webcam: any): string;
    mimeType: string;
    isSuccessful(encoderProcess: any, cb: any): void;
};
export declare const startServer: () => {
    server: any;
    videoStream: Promise<unknown>;
};
