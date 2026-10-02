<script lang="ts">
	import { untrack } from 'svelte';
	import PageTitle from '$lib/misc/PageTitle.svelte';
	import SettingsSectionWrapper from '$lib/components/settings/SettingsSectionWrapper.svelte';
	import { platformSettingsBlueprint } from '$lib/settings/blueprints';
	import { writable } from 'svelte/store';
	import { SvelteSet } from 'svelte/reactivity';
	import { flattenConfig } from '$lib/types/settings';
	import { confirmSuccess, internal } from '$lib/nav/internal';
	import type { SettingsStoreData } from '$lib/types/settings';

	let { data } = $props();

	// Flatten loaded nested documents into dot-notation paths for the store
	// e.g. { rideServices: { bolt: { boltRate: 0.15 } } } -> { 'rideServices.bolt.boltRate': 0.15 }
	const initialValues = untrack(() =>
		flattenConfig({
			rideServices: data.settings.rideServices ?? {},
			company: data.settings.company ?? {}
		})
	);

	const configs = writable<SettingsStoreData>({
		...initialValues,
		dirty: new SvelteSet<string>()
	});

	const handleSave = async (dirtyNodes: string[], patch: Record<string, any>) => {
		const response = await confirmSuccess(
			internal.postApi({ patch }, 'post', { path: '/settings' }),
			'Ustawienia zostały pomyślnie zapisane'
		);
		if (!response?.success) {
			throw new Error(response?.message || 'Błąd zapisu ustawień');
		}
	};
</script>

<PageTitle title="Ustawienia Platformy" subtitle="Zarządzaj globalnymi stawkami, prowizjami i parametrami firmy" />

<SettingsSectionWrapper originalBlueprint={platformSettingsBlueprint} {configs} isAdmin={data.isAdmin} onSave={handleSave} />
