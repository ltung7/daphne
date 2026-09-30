<script lang="ts">
	import { onMount } from 'svelte';
	import { Collapse } from '@sveltestrap/sveltestrap';
	import { layoutState } from '$lib/nav/stores.svelte';
	import UIcon from '$lib/misc/UIcon.svelte';
	import TooltipText from '$lib/misc/TooltipText.svelte';
	import { fly } from 'svelte/transition';

	// TypeScript Interfaces
	interface SubItem {
		title: string;
		link: string;
		icon?: string;
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
		{
			id: 2,
			title: 'Flota',
			icon: 'cars',
			subItems: [
				{ title: 'Pojazdy', icon: 'car-side', link: '/vehicles' },
				{ title: 'Wydania', icon: 'user-key', link: '/handovers' },
				{ title: 'Inspekcje', icon: 'assessment', link: '/inspections' },
				{ title: 'Zdrowie floty', icon: 'first-aid-kit', link: '/health' }
			]
		},
		{ id: 3, title: 'Kierowcy', icon: 'steering-wheel', link: '/drivers' },
		{ id: 6, title: 'Użytkownicy', icon: 'users', link: '/users' },
		{ id: 7, title: 'Wczesne Rozliczenia', icon: 'money', link: '/earlysettlements' },
		{ id: 9, title: 'Zdarzenia', icon: 'triangle-warning', link: '/incidents' },
		{ id: 10, title: 'Powiadomienia', icon: 'bell', link: '/notifications' },
		{ id: 11, title: 'Wyloguj', icon: 'power', link: '/logout' }
	]);

	let notificationCount = $state(0);

	function toggleSidebar() {
		layoutState.isSidebarExpanded = !layoutState.isSidebarExpanded;
		if (!layoutState.isSidebarExpanded) {
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

	async function fetchNotificationCount() {
		try {
			const res = await fetch('/notifications/api?count=true');
			const data = await res.json();
			if (data.success && typeof data.count === 'number') {
				notificationCount = data.count;
			}
		} catch {
			// silently fail
		}
	}

	// Set active menu item based on current URL on mount
	onMount(() => {
		const currentPath = window.location.pathname;
		const matchingItem = menuItems.find((item) => {
			if (!item.link) return false;
			if (item.link === '/') {
				return currentPath === '/';
			}
			return currentPath.startsWith(item.link);
		});
		if (matchingItem) {
			setActive(matchingItem.id);
		}

		setTimeout(fetchNotificationCount, 1000);
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
								<ul class="list-unstyled ps-3 ms-2 mt-1 border-start">
									{#each item.subItems as sub}
										<li>
											<a href={sub.link} class="d-flex align-items-center py-2 px-3 text-decoration-none nav-link-sub text-truncate small text-dark" onclick={() => setActive(item.id)}>
												{#if sub.icon}
													<span class="me-2 d-flex align-items-center">
														<UIcon name={sub.icon} size={5} />
													</span>
												{/if}
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
								<span class="nav-icon-wrapper">
									<UIcon name={item.icon} size={4} />
								</span>
								<span class="ms-3 text-truncate flex-grow-1">{item.title}</span>
								{#if item.id === 10 && notificationCount > 0}
									<span transition:fly class="badge bg-danger rounded-pill ms-2">{notificationCount}</span>
								{/if}
							</a>
						</TooltipText>
					{/if}
				</li>
			{/each}
		</ul>
	</nav>
</aside>
