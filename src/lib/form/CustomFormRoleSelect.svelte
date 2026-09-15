<script lang="ts">
	import { untrack } from 'svelte';

	type AdminRole = App.AdminRole | 'revoked';

	interface Props {
		value?: AdminRole;
		name?: string;
		autoselect?: boolean;
		readonly?: boolean;
		size?: number;
		class?: string;
		caption?: string;
		onchange?: null | ((value: AdminRole) => any);
		onclick?: null | ((value: AdminRole) => any);
		hideRevoked?: boolean;
	}

	let { value = $bindable<AdminRole>('moderator'), name = $bindable(''), autoselect = false, readonly = false, size = 6, onchange, onclick, class: className = '', caption = 'Rola', hideRevoked }: Props = $props();

	const roles: Record<AdminRole, string> = {
		moderator: 'Moderator',
		manager: 'Manager',
		admin: 'Admin',
		revoked: 'Zablokowany'
	};

	if (!name) {
		name = 'select_' + Math.random().toString().slice(2);
	}

	if (untrack(() => autoselect) && !value) {
		const first = Object.keys(untrack(() => roles))[0] as AdminRole;
		if (first) value = first;
	}

	const handleChange = () => {
		if (onchange) onchange(value);
		if (onclick) onclick(value);
	};

	type Permission = {
		key: string;
		label: string;
		roles: AdminRole[];
	};

	const permissions: Permission[] = [
		{ key: 'view_dashboard', label: 'Przegląd panelu i wyników', roles: [ 'moderator', 'manager', 'admin' ] },
		{ key: 'manage_drivers', label: 'Zarządzanie pojazdami', roles: [ 'moderator', 'manager', 'admin' ] },
		{ key: 'manage_vehicles', label: 'Zarządzanie pojazdami', roles: [ 'moderator', 'manager', 'admin' ] },
		{ key: 'view_finance', label: 'Przegląd raportów finansowych', roles: [ 'manager', 'admin' ] },
		{ key: 'manage_finance', label: 'Zarządzanie finansami (płatności, provizje)', roles: [ 'manager', 'admin' ] },
		{ key: 'manage_admins', label: 'Zarządzanie użytkownikami', roles: [ 'admin' ] },
		{ key: 'system_settings', label: 'Ustawienia systemu', roles: [ 'manager', 'admin' ] }
	];

	const currentRolePermissions = $derived(
		permissions.map((p) => ({
			...p,
			allowed: p.roles.includes(value)
		}))
	);
</script>

{#if caption?.length}
	<label for="select_{name}" class="form-label small mb-1">{caption}</label>
{/if}
<div class="flex-between input-group input-group-outline border-secondary is-filled z-index-3 me-4 mb-3 {className}" class:cursor-pointer={!readonly}>
	<select id="select_{name}" {name} bind:value disabled={readonly} class="form-control fs-{size} text-dark w-100" onchange={handleChange}>
		{#each Object.entries(roles) as [ lvalue, lcaption ]}
			{#if !(hideRevoked && lvalue === 'revoked')}
				<option value={lvalue} disabled={lvalue.length === 0}>
					{@html lcaption}
				</option>
			{/if}
		{/each}
	</select>
</div>

<div class="mt-3">
	<div class="text-muted xsmall mb-2">Uprawnienia dla tej roli:</div>
	<div class="bg-light p-3 rounded border border-secondary">
		{#each currentRolePermissions as perm}
			<div class="form-check mb-1">
				<input class="form-check-input opacity-10" type="checkbox" id="perm_{perm.key}" checked={perm.allowed} disabled />
				<label class="form-check-label ms-2 opacity-10 text-dark" for="perm_{perm.key}">
					{perm.label}
				</label>
			</div>
		{/each}
	</div>
</div>