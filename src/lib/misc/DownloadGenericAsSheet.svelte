<script lang="ts">
	import { genericDataToAoa, getGenericHeaders } from '$lib/utils/objToArray';
    import xlsx from 'xlsx-js-style'; 

    type GetRowArrayFunction = (record: Record<string,ExplicitAnyToExtend>) => ExplicitAnyToExtend[];
    type PrepareDataFunction = () => { headers: string[], widths?: number[]}

    interface Props {
        size?: string;
        data: any;
        filename: any;
        getRowArray?: GetRowArrayFunction|null;
        headers?: string[];
        prepare?: PrepareDataFunction|null;
        icon: any;
        ext?: string;
    }

    let {
        size = '3rem',
        data,
        filename,
        getRowArray = $bindable(null),
        headers = $bindable([]),
        prepare = $bindable(null),
        icon,
        ext = 'CSV'
    }: Props = $props();

    const downloadAsSheet = async () => {
        const isObject = data[0] && !Array.isArray(data[0]);
        if (!prepare && headers.length === 0 && isObject) {
            prepare = () => {
                const headers = getGenericHeaders(data);
                return { headers, widths: [] };
            }
        }
        if (prepare) ({ headers } = prepare());
        const rows = [ headers ];
        if (!getRowArray && isObject) {
            getRowArray = (obj) => genericDataToAoa(obj, headers);
        }
        for (const row of data) rows.push(getRowArray ? getRowArray(row) : row);
        
        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.aoa_to_sheet(rows);
        xlsx.utils.book_append_sheet(wb, ws, 'Sheet');
        xlsx.writeFile(wb, `${filename}.${ext}`);
    };
</script>

<button class="btn-clear px-0" onclick={downloadAsSheet}>
    <img src={icon} alt="Pobierz jako {ext.toUpperCase()}" style="max-width: {size}; height: {size};">
</button>