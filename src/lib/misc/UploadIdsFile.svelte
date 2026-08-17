<script lang="ts">
	import UIcon from "$lib/misc/UIcon.svelte";
	import { startLoad, endLoad } from "$lib/nav/loader";
	import { addToast } from "$lib/toast";
	import { tick } from "svelte";
    import Dropzone from "svelte-file-dropzone";
    import { read } from 'xlsx'; 
    import * as m from '$lib/paraglide/messages.js';

    interface Props {
		onUploaded?: (products: string[]) => void;
	}

	let {
		onUploaded
	}: Props = $props();

    async function processFile(file: File) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const wb = read(e.target!.result); 
                    const sheet = wb.Sheets[wb.SheetNames[0]];
                    let max = 99999;
                    if (sheet['!ref']) {
                        const ref = sheet['!ref']
                        const colon = ref.indexOf(':');
                        if (colon > 0) max = parseInt(ref.substring(colon + 1).replace(/[A-Z]/g, ''));
                        else max = parseInt(ref.replace(/[A-Z]/g, ''));
                        max = Math.min(max, 99999);
                    }
                    max += 1;
                    const products = [];
                    let i = 0;
                    let value;
                    
                    while (!value?.t) {
                        value = sheet['A' + i++];
                        if (i > max) break;
                    }

                    if (!sheet['B' + (i - 1)]) {
                        --i;
                    }
                    do {
                        value = sheet['A' + i++];
                        if (value?.w || value?.v) {
                            products.push(value.w ? value.w.trim() : value.v.toString().trim());
                        }
                        else break;
                    } while(i < max);

                    if (products.length) {
                        onUploaded?.(products)
                    } else {
                        addToast(m.uploadNoProducts());
                    }
                    await tick();

                    endLoad();
                    resolve(undefined);
                } catch (err) {
                    endLoad();
                    addToast(m.uploadInvalidFormat())
                    reject(err);
                }
            };
            reader.readAsArrayBuffer(file);
        })
    };


    async function handleFilesSelect(e: CustomEvent) {
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


<Dropzone on:drop={handleFilesSelect} disableDefaultStyles >
    <div class="border border-dashed bg-light border-white border-radius-xl w-100 p-4 flex-center flex-column border-2 position-relative overflow-hidden">
        <div class="py-3">
            <UIcon name="cloud-upload" size={1} color="secondary" />
        </div>
        <div class="text-center fs-6"><strong>{m.uploadProductIds()}</strong></div>
        <div class="text-center small">{m.uploadProductIdsWarning()}</div>
    </div>
</Dropzone>