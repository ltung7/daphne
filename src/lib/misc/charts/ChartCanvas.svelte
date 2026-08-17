<script lang="ts">
    import Chart from "chart.js/auto";
    import type { ChartConfiguration } from "chart.js"
    interface Props {
        config: ChartConfiguration;
    }
    let { config }: Props = $props();
    let ctx: CanvasRenderingContext2D|null = null;
    let chartCanvas: HTMLCanvasElement;

    $effect(() => {
        ctx = chartCanvas?.getContext('2d');
        if (ctx) new Chart(ctx, config);
    });
</script>

<canvas bind:this={chartCanvas}></canvas>