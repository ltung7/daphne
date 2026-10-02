<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import type { Writable } from 'svelte/store';
	import SettingsSection from './SettingsSection.svelte';
	import SettingsSearchResult from './SettingsSearchResult.svelte';
	import UIcon from '$lib/misc/UIcon.svelte';
	import type { ConfigsBlueprint, SettingsStoreData, CustomConfigNode } from '$lib/types/settings';

	interface Props {
		originalBlueprint: ConfigsBlueprint<any>;
		configs: Writable<SettingsStoreData>;
		isAdmin?: boolean;
		onSave?: (dirtyNodes: string[], patch: Record<string, any>) => Promise<boolean | void> | boolean | void;
		menu?: import('svelte').Snippet;
		children?: import('svelte').Snippet;
	}

	let { originalBlueprint, configs, isAdmin = false, onSave, menu, children }: Props = $props();

	let blueprint = $state<ConfigsBlueprint<any>>();
	let resettableCopy = $state('{}');
	let isSaving = $state(false);
	let searchTerm = $state('');

	const resetConfigs = () => {
		const parsed = JSON.parse(resettableCopy);
		$configs = {
			...parsed,
			dirty: new SvelteSet<string>()
		};
	};

	export const saveSettings = async () => {
		if (!$configs?.dirty || $configs.dirty.size === 0 || isSaving) return;
		isSaving = true;
		try {
			const dirtyKeys = [ ...$configs.dirty ];
			const patch: Record<string, any> = {};
			for (const key of dirtyKeys) {
				patch[key] = $configs[key];
			}
			if (onSave) {
				await onSave(dirtyKeys, patch);
			}
			resettableCopy = JSON.stringify($configs);
			$configs.dirty = new SvelteSet<string>();
		} catch (err) {
			console.error('Failed to save settings:', err);
			throw err;
		} finally {
			isSaving = false;
		}
	};

	// Flatten all nodes to support searching
	let searchResults = $derived.by(() => {
		const query = searchTerm.trim().toLowerCase();
		if (!query || !blueprint) return [];
		const results: { item: CustomConfigNode; categoryCaption: string }[] = [];

		const collectNodes = (nodes: CustomConfigNode[], categoryCaption: string) => {
			for (const node of nodes) {
				if (node.caption?.toLowerCase().includes(query) || node.description?.toLowerCase().includes(query) || node.node?.toLowerCase().includes(query)) {
					results.push({ item: node, categoryCaption });
				}
				if (node.sub) {
					collectNodes(node.sub, categoryCaption);
				}
			}
		};

		for (const cat of Object.values(blueprint.nodes)) {
			collectNodes(cat.nodes, cat.caption);
		}

		return results;
	});

	onMount(async () => {
		await tick();
		resettableCopy = JSON.stringify($configs);
		blueprint = JSON.parse(JSON.stringify(originalBlueprint));
		if (!$configs.dirty) {
			$configs.dirty = new SvelteSet<string>();
		}
	});
</script>

{#if $configs && blueprint}
	<div class="row">
		<!-- Sidebar Navigation -->
		<div class="col-12 col-lg-3 mb-4">
			<div class="card position-sticky shadow-sm" style="top: 1rem; z-index: 10;">
				<div class="card-body p-3">
					<!-- Search Input -->
					<div class="input-group input-group-outline mb-3">
						<input type="text" class="form-control form-control-sm" placeholder="Szukaj ustawień..." bind:value={searchTerm} />
					</div>

					<!-- Search Results Dropdown/List -->
					{#if searchTerm.trim().length > 0}
						<div class="list-group mb-3 border rounded p-1" style="max-height: 240px; overflow-y: auto;">
							{#if searchResults.length > 0}
								{#each searchResults as { item, categoryCaption }}
									<SettingsSearchResult {item} {categoryCaption} onclick={() => (searchTerm = '')} />
								{/each}
							{:else}
								<div class="text-xs text-muted p-2 text-center">Brak wyników</div>
							{/if}
						</div>
					{/if}

					<!-- Category Anchors -->
					<nav class="nav nav-pills flex-column gap-1">
						{#each Object.entries(blueprint.nodes) as [ href, category ]}
							<a class="nav-link py-2 px-3 text-sm d-flex align-items-center gap-2 rounded text-dark" href="#{href}">
								{#if category.icon}
									<UIcon name={category.icon} size={5} color="primary" />
								{/if}
								<span class="fw-semibold">{category.anchor}</span>
							</a>
						{/each}
					</nav>

					{@render menu?.()}

					<!-- Unsaved Changes Action Buttons -->
					{#if $configs.dirty && $configs.dirty.size > 0}
						<div class="mt-4 pt-3 border-top d-flex flex-column gap-2">
							<div class="d-flex align-items-center justify-content-between text-xs text-muted px-1">
								<span>Niezapisane zmiany</span>
								<span class="badge bg-warning text-dark">{$configs.dirty.size}</span>
							</div>
							<button class="btn btn-primary btn-sm w-100 mb-0 d-flex align-items-center justify-content-center gap-2" onclick={saveSettings} disabled={isSaving}>
								{#if isSaving}
									<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
									<span>Zapisywanie...</span>
								{:else}
									<UIcon name="disk" size={6} />
									<span>Zapisz zmiany</span>
								{/if}
							</button>
							<button class="btn btn-outline-secondary btn-sm w-100 mb-0" onclick={resetConfigs} disabled={isSaving}> Cofnij </button>
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Content Area -->
		<div class="col-12 col-lg-9">
			{#each Object.entries(blueprint.nodes) as [ node, item ]}
				<SettingsSection {blueprint} {node} header={item.caption} {configs} {isAdmin} />
			{/each}
			{@render children?.()}
		</div>
	</div>
{/if}
