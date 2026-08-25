<script lang="ts">
	import DriverStatus from "$lib/misc/DriverStatus.svelte";

    const allStatus: Array<Driver.Status> = [
        'pending_verification',
		'rejected',
		'active',
		'inactive',
		'documents_expiring',
		'documents_expired',
		'suspended',
		'banned',
		'archived',
    ]
</script>

<div class="card">
    <h5 class="card-header">Statusy kierowcy</h5>
    <div class="card-body">
        <div class="row">
            {#each allStatus as status}
                <div class="col-12 col-md-6 col-lg-4 flex-center py-2">
                    <DriverStatus {status} />
                </div>
            {/each}
        </div>
    </div>
</div>