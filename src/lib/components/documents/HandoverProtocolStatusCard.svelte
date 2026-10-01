<script lang="ts">
	import HandoverStatus from '$lib/misc/HandoverStatus.svelte';
	import SectionCard from '$lib/misc/SectionCard.svelte';
	import { optionalTimestamp } from '$lib/utils/tz';

	interface Props {
		handoverProtocol: DocumentGenerator.HandoverDocumentRecord;
	}

	let { handoverProtocol }: Props = $props();
</script>

<SectionCard title="Status">
	<div style="max-width: 400px" class="mx-auto datatable">
		<table class="table table-striped table-between">
			<tbody>
				<tr>
					<td>Status protokołu</td>
					<td><HandoverStatus handover={handoverProtocol} /></td>
				</tr>
				<tr>
					<td>Pojazd</td>
					<td><a href="/vehicles/{handoverProtocol.registrationNumber}">{handoverProtocol.registrationNumber}</a></td>
				</tr>
				<tr>
					<td>Kierowca</td>
					<td><a href="/drivers/{handoverProtocol.driverId}">{handoverProtocol.driverName}</a></td>
				</tr>
				<tr>
					<td>Data wydruku</td>
					<td>{optionalTimestamp(handoverProtocol.printed)}</td>
				</tr>
				<tr>
					<td>Data wysyłki DocusSign</td>
					<td>{optionalTimestamp(handoverProtocol.docusignSent)}</td>
				</tr>
				<tr>
					<td>Data podpisu DocusSign</td>
					<td>{optionalTimestamp(handoverProtocol.docusignSigned)}</td>
				</tr>
			</tbody>
		</table>
	</div>
</SectionCard>