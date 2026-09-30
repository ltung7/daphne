<script lang="ts">
	import ExpirationDate from '$lib/misc/ExpirationDate.svelte';
	import SectionCard from '$lib/misc/SectionCard.svelte';

	let { metadata }: { metadata: Record<string, string> } = $props();

	const EXCLUDED_FIELDS = [ 'userId', 'userName', 'driverName', 'requestedAmount', 'expiryDate', 'daysUntilExpiry', 'driverId', 'registrationNumber', 'documentName', 'categoryName', 'documentType' ];

	const renderableMetadata = $derived(Object.entries(metadata || {}).filter(([ key ]) => !EXCLUDED_FIELDS.includes(key)));
	const hasData = $derived(metadata && Object.keys(metadata).length > 0);
</script>

{#if hasData}
	<SectionCard title="Metadane">
		<table class="table small mb-0">
			<tbody>
<!-- CUSTOM FIELDS -->
			{#if metadata.userId && metadata.userName}
				<tr>
					<td style="width: 200px">Żądający</td>
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
						<a href="/drivers/{metadata.driverd}">{metadata.driverName}</a>
					</td>
				</tr>
			{/if}

{#if metadata.registrationNumber}
			<tr>
				<td style="width: 200px">Pojazd</td>
				<td>
					<a href="/vehicles/{metadata.registrationNumber}">{metadata.registrationNumber}</a>
				</td>
			</tr>
		{/if}

		{#if metadata.documentName && metadata.categoryName}
			<tr>
				<td style="width: 200px">Dokument</td>
				<td>{metadata.categoryName} {metadata.documentName}</td>
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

				<!-- GENERIC FIELDS -->
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
