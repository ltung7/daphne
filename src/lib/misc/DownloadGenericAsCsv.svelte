<script lang="ts">
    import icon from '$lib/assets/format/csv.svg'
	import DownloadGenericAsSheet from './DownloadGenericAsSheet.svelte';

    type GetRowArrayFunction = (record: Record<string,ExplicitAnyToExtend>) => ExplicitAnyToExtend[];
    type PrepareDataFunction = () => { headers: string[], widths?: number[]}

    interface Props {
        size?: string;
        data: any;
        filename: any;
        getRowArray?: GetRowArrayFunction;
        headers?: string[];
        prepare?: PrepareDataFunction;
    }

    let {
        size = '3rem',
        data,
        filename,
        getRowArray,
        headers = [],
        prepare
    }: Props = $props();
</script>

<DownloadGenericAsSheet {filename} {headers} {size} {getRowArray} data={data} {icon} {prepare} ext='csv' />