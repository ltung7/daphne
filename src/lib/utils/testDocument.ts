import fs from "fs";

export interface TestDocumentOptions<TRecord> {
    getFunction: (id: string) => Promise<TRecord | null>;
    generateFunction: (record: TRecord) => Promise<Buffer>;
    description: string;
    key: keyof TRecord;
}

export interface TestDocumentResult {
    filePath: string;
    filename: string;
}

export const testDocument = async <TRecord>(
    document: TRecord | string,
    options: TestDocumentOptions<TRecord>
): Promise<TestDocumentResult> => {
    let record: TRecord;
    if (typeof document === 'string') {
        const fetched = await options.getFunction(document);
        if (!fetched) {
            throw new Error(`${options.description} document with id ${document} not found`);
        }
        record = fetched;
    } else {
        record = document;
    }

    const buffer = await options.generateFunction(record);
    const timestamp = Date.now().toString(36);
    const registrationNumber = record[options.key] as string;
    const filename = `${options.description.replaceAll(' ', '').toLowerCase()}.${registrationNumber}.${timestamp}.pdf`;
    const filePath = `/tmp/${filename}`;
    fs.writeFileSync(filePath, buffer);
    return { filePath, filename };
};