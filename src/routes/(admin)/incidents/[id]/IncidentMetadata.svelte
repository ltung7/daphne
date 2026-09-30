<script lang="ts">
	import ExpirationDate from '$lib/misc/ExpirationDate.svelte';
	import SectionCard from '$lib/misc/SectionCard.svelte';

	let { metadata }: { metadata: Record<string, string> } = $props();

	const EXCLUDED_FIELDS = [ 'userId', 'userName', 'driverName', 'requestedAmount', 'expiryDate', 'daysUntilExpiry', 'driverId' ];

	const renderableMetadata = $derived(Object.entries(metadata || {}).filter(([ key ]) => !EXCLUDED_FIELDS.includes(key)));
	const hasData = $derived(metadata && Object.keys(metadata).length > 0);
</script>

{#if hasData}
	<SectionCard title="Metadane">
		<table class="table small mb-0">
			<tbody>
				{#if metadata.userId && metadata.userName}
					<tr>
						<td style="width: 200px">Zgłaszający</td>
						<td>
							{#if metadata.driverName === metadata.userName}
								Kierowca {metadata.driverName}
							{:else}
								Użytkownik {metadata.userName}
							{/if}
						</td>
					</tr>
				{/if}
				{#if metadata.driverId && metadata.driverName}
					<tr>
						<td style="width: 200px">Kierowca</td>
						<td>
							<a href="/drivers/{metadata.driverId}">{metadata.driverName}</a>
						</td>
					</tr>
				{/if}

				{#if metadata.expiryDate}
					<tr>
						<td style="width: 200px">Data ważności</td>
						<td>
							<ExpirationDate date={metadata.expiryDate} />
						</td>
					</tr>
				{/if}

				{#each renderableMetadata as [ key, value ]}
					<tr>
						<td style="width: 200px">{key}</td>
						<td>{value}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</SectionCard>
{/if}
