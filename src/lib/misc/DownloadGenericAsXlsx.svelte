<script lang="ts">
	import { genericDataToAoa, getGenericHeaders } from '$lib/utils/objToArray';
    import icon from '$lib/assets/format/xlsx.svg'
    import xlsx from 'xlsx-js-style'; 
    import { setColWidth, getStyledCell, cellStyles } from '$lib/docs/xlsxStyles';

    type GetRowArrayFunction = (record: Record<string,ExplicitAnyToExtend>) => ExplicitAnyToExtend[];
    type PrepareDataFunction = () => { headers: string[], widths: number[]}

    interface Props {
        size?: string;
        data: any;
        filename: any;
        getRowArray?: GetRowArrayFunction|null;
        headers?: string[];
        widths?: number[];
        prepare?: PrepareDataFunction|null;
        xlsxHeaders?: Record<string,string>|undefined;
    }

    let {
        size = '3rem',
        data,
        filename,
        getRowArray = $bindable(null),
        headers = $bindable([]),
        widths = $bindable([]),
        prepare = $bindable(null),
        xlsxHeaders = undefined
    }: Props = $props();

    const downloadAsXlsx = async () => {
        const isObject = data[0] && !Array.isArray(data[0]);
        if (!prepare && headers.length === 0 && isObject) {
            prepare = () => {
                const headers = getGenericHeaders(data);
                return { headers, widths: [] };
            }
        }
        if (prepare) ({ headers, widths } = prepare());
        if (headers.length && !widths?.length) widths = Array(headers.length).fill(25);
        const stringHeaders = xlsxHeaders ? headers.map(header => xlsxHeaders[header] ?? header) : headers;
        const rows = [ stringHeaders.map(header => getStyledCell(header, cellStyles.redHeader)) ];
        if (!getRowArray && isObject) {
            getRowArray = (obj) => genericDataToAoa(obj, headers);
        }
        for (const row of data) rows.push(getRowArray ? getRowArray(row) : row);
        
        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.aoa_to_sheet(rows);
        if (widths.length) setColWidth(ws, widths);
        xlsx.utils.book_append_sheet(wb, ws, 'Sheet');
        xlsx.writeFile(wb, `${filename}.xlsx`);
    };
</script>

<button class="btn-clear px-0" onclick={downloadAsXlsx}>
    <img src={icon} alt="Pobierz jako XLSX" style="max-width: {size}; height: {size};">
</button>