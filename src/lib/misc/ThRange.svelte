<script lang="ts">
    import { DataHandler } from '@vincjo/datatables'

    interface Props {
        handler: DataHandler;
        filterBy: string;
        min?: number;
        max?: number;
        top?: any;
        bottom?: any;
    }

    let {
        handler,
        filterBy,
        min = 0,
        max = 999,
        top = $bindable(max),
        bottom = $bindable(min)
    }: Props = $props();
    
    const isBetween = (entry: number, value: [ number, number ]) => {
        const [ min, max ] = value
        return entry >= min && entry <= max
    };

    const handleChange = () => {
        handler.filter([ bottom, top ], filterBy, isBetween)
    };
</script>

<th>
    <div class="d-flex mx-0 justify-content-center">
        <div class="col-5 p-0">
            <input bind:value={bottom} {min} max={top} type="number" step="1" class="form-input-numeric" placeholder='od' oninput={handleChange}>
        </div>
        <div class="col-1 text-center">-</div>
        <div class="col-5 p-0">
            <input bind:value={top} min={bottom} {max} type="number" step="1" class="form-input-numeric" placeholder='do' oninput={handleChange}>
        </div>
    </div>
</th>

<style>
    th {
        border-bottom: 1px solid #e0e0e0;
        min-width: 150px;
    }
    input {
        margin: -1px 0 0 0;
        padding: 0;
        width: 100%;
        height: 24px;
        border: none;
        text-align: center;
        background:inherit;
        outline: none;
        font-size: 14px;
    }
    input::placeholder {
        color: #bdbdbd;
        font-style: italic;
        font-size: 13px;
    }
    input:focus{
        outline: none;
        border: none;
    }
</style>