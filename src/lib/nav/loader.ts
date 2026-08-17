import { writable } from 'svelte/store';

export const loading = writable(false);

export const frontMobile = writable(false);

export async function endLoad() {
    setTimeout(() => {
        loading.set(false);
    }, 50)
}

export async function startLoad() {
    loading.set(true);
}

export async function wrapLoader<T = any>(promise: Promise<T>) {
    startLoad();
    try {
        const response = await promise;
        return response;
    } finally {
        endLoad();
    }
}
