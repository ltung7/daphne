import { getLocale } from "$lib/paraglide/runtime";

export const layoutState = $state({
    isSidebarExpanded: true,
    activeMenuId: 1,
    currentLocale: getLocale()
});