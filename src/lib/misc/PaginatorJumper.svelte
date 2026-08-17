<script lang="ts">
    import { PaginationNav } from 'svelte-paginate'
    import * as m from '$lib/paraglide/messages.js';

    interface PaginatorProps {
        totalItems: number;
        pageSize?: number;
        currentPage?: number;
        limit?: number;
        showStepOptions?: boolean;
    }

    interface Props {
        paginator: PaginatorProps,
        currentPage?: number
        onChange?: (page: number) => void;
    }

    let {
        currentPage = $bindable(),
        paginator,
        onChange
    }: Props = $props();

    let page = $state(currentPage);

    const trySetPage = () => {
        if (!page) return;
        if (page > paginator.totalItems) page = paginator.totalItems;
        if (page < 1) page = 1;
        setPage();
    }

    const setPage = (event?: CustomEvent) => {
        if (event) {
            page = parseInt(event.detail?.page);
        }
        if (onChange) onChange(page!)
    }
</script>

{#if paginator && paginator.totalItems > 1}
    <div class="flex-between"> 
        <div class="flex-center">
            <div class="small text-muted">{m.pageNumber()}:</div>
            <input id="paginator-jumber-{Math.random().toString().replace('.', '')}" type="number" min="1" max="{paginator.totalItems}" bind:value={page} class="form-control form-control-sm border p-0 border-dark rounded text-dark mx-2 text-center ps-2" style="width: 75px;" />
            <button class="btn btn-sm py-0 px-2 btn-outline-dark text-normal text-dark mb-0 flex-center border-radius-xl" onclick={trySetPage}>{m.pageJump()}</button>
        </div>
        <PaginationNav {...paginator} {currentPage} showStepOptions on:setPage={setPage} />
    </div>
{/if}