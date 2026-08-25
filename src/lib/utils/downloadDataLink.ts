type FileContents = string | Blob | ArrayBuffer;

const isBase64String = (contents: FileContents): contents is string =>
    typeof contents === 'string';

const isArrayBuffer = (contents: FileContents): contents is ArrayBuffer =>
    contents instanceof ArrayBuffer;

const isBlob = (contents: FileContents): contents is Blob =>
    contents instanceof Blob;

const base64ToUint8Array = (base64: string): Uint8Array<ArrayBuffer> => {
    const binary = atob(base64);
    const len = binary.length;
    const bytes: Uint8Array<ArrayBuffer> = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
};

const toBlob = (contents: FileContents, mimeType: string): Blob => {
    if (isBlob(contents)) {
        return contents.type === mimeType
            ? contents
            : new Blob([ contents ], { type: mimeType });
    }

    if (isArrayBuffer(contents)) {
        return new Blob([ contents ], { type: mimeType });
    }

    if (isBase64String(contents)) {
        const bytes = base64ToUint8Array(contents);
        return new Blob([ bytes ], { type: mimeType });
    }

    const _exhaustive: never = contents;
    throw new Error(`Unsupported file contents type: ${typeof _exhaustive}`);
};

export const downloadFileBlob = (
    contents: FileContents,
    filename: string,
    mimeType: string
): void => {
    const blob = toBlob(contents, mimeType);

    const downloadLink = document.createElement('a');
    downloadLink.href = window.URL.createObjectURL(blob);
    downloadLink.download = filename;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    window.URL.revokeObjectURL(downloadLink.href);
};

/** @deprecated */
export const _downloadPdfBlob = (contents: ExplicitAnyToExtend, filename: string) => {
    const binary = atob(contents);
    const len = binary.length;
    const buffer = new ArrayBuffer(len);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < len; i++) {
        view[i] = binary.charCodeAt(i);
    }

    const pdfBlob = new Blob([ view ], { type: 'application/pdf' });
    const downloadLink = document.createElement('a');
    downloadLink.href = window.URL.createObjectURL(pdfBlob);
    downloadLink.download = filename + '.pdf';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}