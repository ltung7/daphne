<script lang="ts">
    interface Props {
        color?: string;
        size?: string;
    }

    let { color = 'primary', size = '20vw' }: Props = $props();
</script>

<div class="text-center flex-center">
    <div class="spinner-border text-{color}" role="status" style="width: {size}; height: {size}">
        <span class="visually-hidden">Loading...</span>
    </div>
</div>