<script lang="ts" generics="T extends DataFilesDescriptor">
	import type { DataFilePreprocessResult, DataFilesDescriptor, DataFilesType } from "$lib/descriptors/datafiles";
	import { DatafileProcessingError } from "$lib/descriptors/datafiles";
    import Dropzone from "svelte-file-dropzone";
	import UIcon from "$lib/misc/UIcon.svelte";
    import { endLoad, startLoad } from '$lib/nav/loader';
    import { read, utils } from 'xlsx/xlsx.mjs';
	import { addToast } from "$lib/toast";
    import * as m from '$lib/paraglide/messages.js';

    type ProcessResult = Awaited<ReturnType<T['process']>>;
    interface Props {
        datafiles: DataFilesType<T>;
        account: string|undefined;
        uploadCopy?: boolean|((_s:string)=>boolean)|string[];
        enablePdf?: boolean;
        caption?: string;
        onUpload?: (file: File) => void;
        onProcessed: (results: DataFilePreprocessResult<ProcessResult, DataFilesDescriptor>) => void;
    }

    let { 
        caption = m.uploadPlaceholder(),
        datafiles, 
        account, 
        uploadCopy = false, 
        enablePdf = true, 
        onUpload, 
        onProcessed 
    }: Props = $props();
    const accept = (() => { return ".xlsx,.csv,.xls,.xlsm" + (enablePdf ? ",.pdf" : "") })();

    type PreprocessFunction = (_file: File) => Promise<false | DataFilePreprocessResult>;

    async function getPdfText(buffer: ArrayBuffer) {
        const data = new Uint8Array(buffer);
        const pdfjsLib = (window as any).pdfjsLib;
        let doc = await pdfjsLib.getDocument({ data }).promise;
        const contents = [];
        for (let i = 1; i <= doc.numPages; i++) {
            const page = await doc.getPage(i);
            const text = await page.getTextContent();
            for (const content of text.items as { str: string }[]) {
                contents.push(content.str);
            }
        }
        return contents;
    }

    const readDatasheet = async (file: File): Promise<ArrayBuffer> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    if (!e.target) throw new Error(m.uploadInvalidType())
                    resolve(e.target.result as ArrayBuffer);
                } catch (err) {
                    reject(err);
                }
            };
            reader.readAsArrayBuffer(file);
        })
    }

    const validateAndProcess = async (typedata: DataFilesDescriptor, headers: string[], contents: ExplicitAnyToExtend[], filename: string): Promise<any|undefined> => {
        let validated = true;
        for (const column of typedata.headers) {
            if (!headers.includes(column)) validated = false;
        }
        if (validated) {
            return await typedata.process(contents, filename, account);
        }
    }

    const preprocessPdf = async (file: File) => {
        const contentRaw = await readDatasheet(file);
        const contents = await getPdfText(contentRaw as ArrayBuffer)
        for (const [ type, typedata ] of Object.entries(datafiles.pdf)) {
            const headers = contents.slice(0, typedata.headerLength ?? 20);
            const result = await validateAndProcess(typedata, headers, contents, file.name);
            if (result) {
                result.descriptor = type;
                return { result, type, typedata }
            }
        }
        return false;
    }

    const preprocessDatasheet = async (file: File) => {
        const content = await readDatasheet(file);
        const wb = read(content, { raw: true, cellText: true });
        const data = utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: false });
        const headers = data.shift() as string[]

        for (const [ type, typedata ] of Object.entries(datafiles.datasheets)) {
            const result = await validateAndProcess(typedata, headers, data, file.name);
            if (result) {
                result.descriptor = type;
                return { result, type, typedata }
            }
        }
        return false;
    }

    const PREPROCESSORS: Record<string,PreprocessFunction> = {
        xlsx: preprocessDatasheet,
        csv: preprocessDatasheet,
        xls: preprocessDatasheet,
        xlsm: preprocessDatasheet,
        pdf: preprocessPdf
    }

    const endProcessMessage = (message: string) => {
        addToast(message);
        endLoad();
    }

    const uploadCopyIncludesName = (strings: string[], filename: string): boolean => {
        for (const string of strings) {
            if (filename.includes(string)) return true;
        }
        return false;
    }

    const uploadCopyAction = (file: File) => {
        switch (typeof uploadCopy) {
            case 'boolean':
                if (uploadCopy) break;
                return;
            case 'function':
                if (uploadCopy(file.name)) break;
                return;
            case 'object':
                if (!Array.isArray(uploadCopy)) return;
                if (uploadCopyIncludesName(uploadCopy, file.name)) break;
                return;
            default: return;
        }
        const formData = new FormData();
        formData.append('file', file);
        fetch(window.location.pathname, {
            method: 'POST',
            body: formData
        }).catch(err => {
            console.error(err);
        });
    }

    const processFile = async (file: File) => {
        let ext = file.name.split('.').pop() as string;
        ext = ext.toLowerCase();
        if (!ext || !PREPROCESSORS[ext]) return endProcessMessage(m.uploadInvalidExt())
        if (uploadCopy) uploadCopyAction(file);
        if (onUpload) onUpload(file)
        const preprocess = PREPROCESSORS[ext];
        try {
            const result = await preprocess(file);
            if (result) {
                if (onProcessed) onProcessed(result);
                endLoad();
            }
            else endProcessMessage(m.uploadSpecNotRecognized());
        } catch (err) {
            if (err instanceof DatafileProcessingError) {
                endProcessMessage(err.message);
            } else {
                console.error(err)
                endProcessMessage(m.uploadSpecError());
            }
        }
    };
    
    function handleFilesSelect(e: CustomEvent) {
        if (e.detail.acceptedFiles.length) {
            startLoad();
            processFile(e.detail.acceptedFiles[0]);            
        } else {
            const message = e.detail.fileRejections.length && e.detail.fileRejections[0].errors.length && e.detail.fileRejections[0].errors[0].message;
            if (message) addToast(m.uploadRejected() + ': ' + message);
            else addToast(m.uploadRejected());
        }
    }
</script>

<svelte:head>
    {#if enablePdf}
        <script type="module">
            import pdfjsLib from 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/+esm';
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
        </script>
    {/if}
</svelte:head>

<Dropzone on:drop={handleFilesSelect} disableDefaultStyles {accept}>
    <div class="border border-dashed bg-light border-white border-radius-xl w-100 p-4 flex-center flex-column border-2 position-relative overflow-hidden">
        <div class="py-3">
            <UIcon name="cloud-upload" size={1} color="secondary" />
        </div>
        <div class="text-center fs-6"><strong>{caption}</strong></div>
    </div>
</Dropzone>