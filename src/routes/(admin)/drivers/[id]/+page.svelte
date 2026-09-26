<script lang="ts">
	import { untrack } from 'svelte';
	import type { PageProps } from './$types';
	import EditNotesCard from '$lib/form/EditNotesCard.svelte';
	import plTimezone, { formatTimezone } from '$lib/utils/tz';
	import UploadDriverDatafiles from '$lib/form/UploadDriverDatafiles.svelte';
	import TooltipSquareIconLink from '$lib/misc/TooltipSquareIconLink.svelte';
	import { driverDocumentNames } from '$lib/assets/constants';
	import NewHandoverProtocol from '$lib/components/documents/NewHandoverProtocol.svelte';
	import IconButton from '$lib/misc/IconButton.svelte';
	import { fly } from 'svelte/transition';
	import PageTitle from '$lib/misc/PageTitle.svelte';
	import SectionCard from '$lib/misc/SectionCard.svelte';
	import DriverImageAndData from '$lib/components/driver/DriverImageAndData.svelte';
	import DriverStatusChanger from '$lib/components/driver/DriverStatusChanger.svelte';
	import PageTopActions from '$lib/misc/PageTopActions.svelte';
	import ResetPasswordSection from '$lib/components/ResetPasswordSection.svelte';
	import ImageFallback from '$lib/misc/ImageFallback.svelte';
	import DriverStatusHistory from '$lib/components/driver/DriverStatusHistory.svelte';
	import DriverBalanceLedger from '$lib/components/finance/DriverBalanceLedger.svelte';
	import IconLink from '$lib/misc/IconLink.svelte';
	import { Offcanvas } from '@sveltestrap/sveltestrap';
	import DriverForm from '$lib/components/driver/DriverForm.svelte';

	let { data }: PageProps = $props();
	let driver: Driver.Driver = $state(untrack(() => data.driver));
	let documents: Driver.DriverDocument[] = $state(untrack(() => data.documents));
	let handoverModal: boolean = $state(false);
	let editModal: boolean = $state(false);

	const onFinished = (doc: Driver.DriverDocument) => {
		if (documents.find((d) => d.id !== doc.id)) documents.push(doc);
	};

	const onstatuschanged = (status: Driver.Status) => {
		driver.status = status;
	};

	const handleDriverUpdate = (response: any, item: Driver.Driver) => {
		if (response?.success) {
			Object.assign(driver, item);
			data.driver = { ...item }; // Update initial data so next patch diffs correctly
		}
		editModal = false;
	};

	const toggle = () => {
		editModal = !editModal;
	}
</script>

{#snippet footerSnippet()}
	<div class="d-flex justify-content-end gap-2">
		<IconButton icon="cross-circle" caption="Zamknij" onclick={() => (editModal = false)} outline color="dark" size={6} class="mb-0 me-2" />
	</div>
{/snippet}

<PageTitle title="Dane kierowcy {driver.name}" subtitle="Szczegóły zarejestrowanego kierowcy" />

<PageTopActions>
	<DriverStatusChanger {driver} {documents} {onstatuschanged} />
	<IconButton class="ms-auto mb-0" icon="edit" caption="Edytuj" onclick={() => (editModal = true)} size={6} />
</PageTopActions>

<SectionCard title="Dane kierowcy">
	{#snippet cta()}
		<DriverStatusHistory driverId={driver.id} />
	{/snippet}
	<DriverImageAndData {driver} />
</SectionCard>

{#if driver.status !== 'pending_verification'}
	<DriverBalanceLedger
		driverId={driver.id}
		currentBalance={data.currentBalance}
		cashBalance={data.cashBalance}
		onBalanceUpdate={(cb, cash) => {
			data.currentBalance = cb;
			data.cashBalance = cash;
		}}
	/>

	<SectionCard title="Pojazd">
		{#if driver.assignedVehicle}
			<div class="d-flex">
				<div class="vehicle-image small rounded">
					<ImageFallback src={driver.assignedVehicle.imageUrl} alt={driver.assignedVehicle.registrationNumber} />
				</div>
				<div class="w-100 ms-3">
					<table class="table table-striped small mb-0">
						<tbody>
							<tr>
								<td style="width: 150px">Numer rejestracyjny</td>
								<td>{driver.assignedVehicle.registrationNumber}</td>
							</tr>
							<tr>
								<td>Marka</td>
								<td>{driver.assignedVehicle.model}</td>
							</tr>
							<tr>
								<td>Data przypisania</td>
								<td>{formatTimezone(driver.assignedVehicle.timestamp)}</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
			<div class="d-flex gap-2 mt-2">
				<IconLink href="/vehicles/{driver.assignedVehicle.registrationNumber}" icon="car" caption="Szczegóły pojazdu" size={6} class="mb-0" />
			</div>
		{:else}
			<div class="flex-center flex-column">
				<div class="mb-3">Nie przypisano żadnego pojazdu</div>
				<IconButton icon="search" caption="Przypisz" onclick={() => (handoverModal = true)} size={6} />
			</div>
		{/if}
	</SectionCard>
{/if}

<SectionCard title="Dokumenty">
	{#snippet cta()}
		<UploadDriverDatafiles {onFinished} driverId={driver.id} />
	{/snippet}

	{#if documents?.length}
		<ul class="list-group">
			{#each documents as doc}
				<li class="list-group-item flex-between">
					<div>
						<div class="text-muted xsmall">{driverDocumentNames[doc.type]} ({plTimezone(doc.timestamp)})</div>
						<div class="fw-bold text-dark">{doc.name}</div>
					</div>
					<TooltipSquareIconLink class="me-n2" href={doc.url} download icon="cloud-download-alt" hoverText="Pobierz" blank />
				</li>
			{/each}
		</ul>
	{:else}
		Brak dodanych dokumentów
	{/if}
</SectionCard>

<EditNotesCard bind:notes={driver.notes} />

{#if handoverModal}
	<div class="position-fixed w-100 h-100 top-0 start-0 overflow-auto px-3 pb-3" style="z-index: 10" transition:fly>
		<NewHandoverProtocol {driver} />
	</div>
{/if}

<ResetPasswordSection />

{#if handoverModal}
	<div class="position-fixed w-100 h-100 top-0 start-0 overflow-auto px-3 pb-3" style="z-index: 10" transition:fly>
		<NewHandoverProtocol {driver} />
	</div>
{/if}

<Offcanvas bind:isOpen={editModal} class="w-100" placement="end" header="Edytuj kierowcę" {toggle}>
	<DriverForm bind:item={driver} cleanItem={untrack(() => data.driver)} onResponse={handleDriverUpdate} patch footer={footerSnippet} />
</Offcanvas>
