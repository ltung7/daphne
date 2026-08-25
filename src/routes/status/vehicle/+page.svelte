<script lang="ts">
	import VehicleStatus from "$lib/misc/VehicleStatus.svelte";

    const allStatus: Array<Vehicle.Status> = [
        'available',
        'assigned',
        'broken',
        'unmovable',
        'under_maintenance',
        'retired',
        'precheck'
    ]
</script>

<div class="card">
    <h5 class="card-header">Statusy kierowcy</h5>
    <div class="card-body">
        <div class="row">
            {#each allStatus as status}
                <div class="col-12 col-md-6 col-lg-4 col-xl-3 flex-center py-2">
                    <VehicleStatus {status} />
                </div>
            {/each}
        </div>
    </div>
</div>