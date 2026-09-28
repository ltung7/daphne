import { md5 } from 'hash-wasm';
import { deserialize } from '$app/forms';
import { startLoad, endLoad, wrapLoader } from '$lib/nav/loader';
import { addToast } from '$lib/toast';

export interface DocumentUploadConfig<
	TDocumentType extends string,
	TDocumentResult extends { type: TDocumentType; name: string },
	TId extends string
> {
	getId: () => TId;
	idLabel: string;
	gcsPrefix: 'v' | 'd';
	documentNames: Record<TDocumentType, string>;
	documentCategories: Array<{ name: string; fields: TDocumentType[] }>;
	updatableVariables?: Array<string>;
	variableNames?: Record<string, string>;
	validateResult: (result: TDocumentResult, id: TId) => string | null;
	getOnFinished: () => (doc: any) => any;
	getOnProcessed?: () => ((result: TDocumentResult) => any) | undefined;
}

export interface DocumentUploadState<TDocumentResult> {
	uploaded: File | undefined;
	result: TDocumentResult | undefined;
	processed: boolean;
	fileExists: boolean;
	isUnidentified: boolean;
	selectedType: string | undefined;
	uploadable: boolean;
	showUploader: boolean;
}

export function createDocumentUpload<
	TDocumentType extends string,
	TDocumentResult extends { type: TDocumentType; name: string; [key: string]: any },
	TId extends string
>(config: DocumentUploadConfig<TDocumentType, TDocumentResult, TId>) {
	let uploaded = $state<File | undefined>();
	let result = $state<TDocumentResult | undefined>();
	let processed = $state(false);
	let fileExists = $state(false);
	let isUnidentified = $state(false);
	let selectedType = $state<string | undefined>();
	let showUploader = $state(false);

	const uploadable = $derived((processed && !fileExists) || (isUnidentified && Boolean(selectedType)));

	const handleUploaded = async (e: CustomEvent<File>) => {
		uploaded = e.detail;
		const arr = await uploaded.arrayBuffer();
		const buffer = new Uint8Array(arr);
		const hash = await md5(buffer);
		const ext = uploaded.name.split('.').pop() || 'pdf';
		fileExists = await checkHashUrl(hash, ext);
	};

	const startNewFile = () => {
		startLoad();
		isUnidentified = false;
		fileExists = false;
		processed = false;
		result = undefined;
		uploaded = undefined;
		selectedType = undefined;
	};

	const handleProcessed = (e: CustomEvent<{ result: TDocumentResult }>) => {
		endLoad();
		result = e.detail.result;
		const validationError = config.validateResult(result, config.getId());
		if (validationError) {
			addToast(validationError);
			return;
		}
		const onProcessed = config.getOnProcessed?.();
		if (onProcessed) onProcessed(result);
		processed = true;
	};

	const handleError = (e: CustomEvent<string>) => {
		isUnidentified = e.detail === 'Specyfikacja nie została rozpoznana';
		addToast(e.detail);
		endLoad();
	};

	const openUploader = () => {
		showUploader = true;
	};

	const upload = async () => {
		if (!uploaded) return;
		const formData = new FormData();
		formData.append('file', uploaded);
		if (isUnidentified) {
			const type = selectedType as TDocumentType;
			result = {
				name: config.documentNames[type],
				type,
				[config.idLabel]: config.getId()
			} as TDocumentResult;
		}
		formData.append('data', JSON.stringify(result));
		const response = (await wrapLoader(
			fetch('/upload/documents', {
				method: 'POST',
				body: formData
			})
				.then((res) => res.text())
				.then((raw) => deserialize<{ success: boolean; url: string }, Record<string, unknown>>(raw))
		)) as { type: string; status: number; data: { success: boolean; doc: any } };
		config.getOnFinished()(response.data.doc);
		startNewFile();
	};

	const checkHashUrl = async (hash: string, ext: string) => {
		const url = `https://storage.googleapis.com/feed-cdn-files/${config.gcsPrefix}/${config.getId()}/${hash}.${ext}`;
		try {
			const response = await fetch(url, { method: 'HEAD' });
			return response.ok;
		} catch (_) {
			return false;
		}
	};

	const onSelectTypeChange = (value: string) => {
		selectedType = value;
	};

	const resultValue = (res: TDocumentResult, key: string) => {
		const value = res[key as keyof TDocumentResult];
		if (value) return value;
		return false;
	};

	return {
		get uploaded() { return uploaded; },
		get result() { return result; },
		get processed() { return processed; },
		get fileExists() { return fileExists; },
		get isUnidentified() { return isUnidentified; },
		get selectedType() { return selectedType; },
		get uploadable() { return uploadable; },
		get showUploader() { return showUploader; },
		set showUploader(v: boolean) { showUploader = v; },
		handleUploaded,
		startNewFile,
		handleProcessed,
		handleError,
		openUploader,
		upload,
		onSelectTypeChange,
		resultValue,
		config
	};
}