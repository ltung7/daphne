import { isDev } from "$lib/utils/isDev";

// TODO: Remove after testing - disable all auth checks
export const CHECK_AUTH = isDev;

export const layoutState = $state({
    isSidebarExpanded: true,
    activeMenuId: 1
});