<script lang="ts">
	import { onMount } from 'svelte';
	import { Collapse } from '@sveltestrap/sveltestrap';
	import { layoutState } from '$lib/nav/stores.svelte';
	import UIcon from '$lib/misc/UIcon.svelte'; // Assuming this is your icon component
	import TooltipText from '$lib/misc/TooltipText.svelte';

	// TypeScript Interfaces
	interface SubItem {
		title: string;
		link: string;
	}

	interface MenuItem {
		id: number;
		title: string;
		icon: string;
		link?: string;
		isOpen?: boolean;
		subItems?: SubItem[];
	}

	// Menu Data (fi-rr- prefixes removed)
	let menuItems: MenuItem[] = $state([
		{ id: 1, title: 'Dashboard', icon: 'apps', link: '/panel' },
		// {
		// 	id: 2,
		// 	title: 'Data Management',
		// 	icon: 'database',
		// 	isOpen: false,
		// 	subItems: [
		// 		{ title: 'Users List', link: '/users' },
		// 		{ title: 'Permissions', link: '/permissions' }
		// 	]
		// },
		{ id: 2, title: 'Flota', icon: 'cars', link: '/vehicles' },
		{ id: 3, title: 'Kierowcy', icon: 'users-alt', link: '/drivers' },
		{ id: 4, title: 'Wydania', icon: 'user-key', link: '/handovers' },
		{ id: 5, title: 'Inspekcja', icon: 'assessment', link: '/inspection' },
	]);

	function toggleSidebar() {
		layoutState.isSidebarExpanded = !layoutState.isSidebarExpanded;
		if (!layoutState.isSidebarExpanded) {
			// Auto-close submenus when collapsing sidebar
			menuItems.forEach((item) => (item.isOpen = false));
		}
	}

	function toggleSubmenu(index: number) {
		if (!layoutState.isSidebarExpanded) {
			layoutState.isSidebarExpanded = true;
		}
		menuItems[index].isOpen = !menuItems[index].isOpen;
	}

	function setActive(id: number) {
		layoutState.activeMenuId = id;
	}

	// Set active menu item based on current URL on mount
	onMount(() => {
		const currentPath = window.location.pathname;
		const matchingItem = menuItems.find((item) => {
			if (!item.link) return false;
			// Exact match for root, prefix match for others
			if (item.link === '/') {
				return currentPath === '/';
			}
			return currentPath.startsWith(item.link);
		});
		if (matchingItem) {
			setActive(matchingItem.id);
		}
	});
</script>

<aside class="position-sticky top-0 bg-white border-end shadow-sm d-flex flex-column sidebar-transition" class:sidebar-expanded={layoutState.isSidebarExpanded}>
	<div class="d-flex align-items-center justify-content-between p-3 border-bottom brand-header">
		{#if layoutState.isSidebarExpanded}
			<h5 class="mb-0 fw-bold text-primary text-truncate">APP</h5>
		{/if}
		<button class="btn btn-sm btn-light border-0 ms-auto mb-0" onclick={toggleSidebar} aria-label="Toggle Sidebar">
			<UIcon name="menu-burger" />
		</button>
	</div>

	<nav class="flex-grow-1 p-2 overflow-y-auto">
		<ul class="list-unstyled mb-0">
			{#each menuItems as item, i}
				<li class="mb-1">
					{#if item.subItems}
						<TooltipText hide={layoutState.isSidebarExpanded} hoverText={item.title} placement="right">
							<button class="btn w-100 text-start d-flex align-items-center nav-btn py-2" class:active={layoutState.activeMenuId === item.id} onclick={() => toggleSubmenu(i)} aria-expanded={item.isOpen}>
								<span class="nav-icon-wrapper"><UIcon name={item.icon} size={4} /></span>

								{#if layoutState.isSidebarExpanded}
									<span class="ms-3 flex-grow-1 text-truncate">{item.title}</span>
									<span class="icon-transition" class:rotate-180={item.isOpen}>
										<UIcon name="angle-small-down" size={4} />
									</span>
								{/if}
							</button>
						</TooltipText>

						{#if layoutState.isSidebarExpanded}
							<Collapse isOpen={item.isOpen}>
								<ul class="list-unstyled ps-4 ms-2 mt-1 border-start">
									{#each item.subItems as sub}
										<li>
											<a href={sub.link} class="d-block py-2 px-3 text-decoration-none nav-link-sub text-truncate" onclick={() => setActive(item.id)}>
												{sub.title}
											</a>
										</li>
									{/each}
								</ul>
							</Collapse>
						{/if}
					{:else}
						<TooltipText hide={layoutState.isSidebarExpanded} hoverText={item.title} placement="right">
							<a href={item.link} class="btn w-100 text-start d-flex align-items-center nav-btn" class:active={layoutState.activeMenuId === item.id} onclick={() => setActive(item.id)}>
								<span class="nav-icon-wrapper"><UIcon name={item.icon} size={4} /></span>
								{#if layoutState.isSidebarExpanded}
									<span class="ms-3 text-truncate">{item.title}</span>
								{/if}
							</a>
						</TooltipText>
					{/if}
				</li>
			{/each}
		</ul>
	</nav>
</aside>
