<script lang="ts">
    import { getAuth, type Auth } from "firebase/auth";
    import { getFirestore, type Firestore  } from "firebase/firestore";
    import { PUBLIC_FIREBASE_APIKEY, PUBLIC_FIREBASE_AUTH_DOMAIN, PUBLIC_FIREBASE_PROJECT_ID, PUBLIC_FIREBASE_STORAGE_BUCKET, PUBLIC_FIREBASE_MESSAGING_SENDER_ID, PUBLIC_FIREBASE_APP_ID } from "$env/static/public"
    import { initializeApp, getApps, deleteApp, type FirebaseOptions, type FirebaseApp as FirebaseAppInstance } from 'firebase/app';
	import { onMount } from "svelte";
	import { FirebaseApp } from "sveltefire";
	import Spinner from "./Spinner.svelte";

    interface Props {
        spinnerSize?: false | string;
        children?: import('svelte').Snippet;
        onFirestore?: (firestore: Firestore) => void;
    }

    let { spinnerSize = false, children, onFirestore }: Props = $props();
    
    let app: FirebaseAppInstance|undefined, auth: Auth|undefined = $state(), firestore: Firestore|undefined = $state() ;
    
    const initialize = (firebaseConfig: FirebaseOptions) => {
        if (app) return app;
        const apps = getApps();
        if (apps.length) {
            const properApp = apps.find(app => app.options.apiKey === firebaseConfig.apiKey);
            if (properApp) return app = properApp;
            else {
                for (const app of apps) {
                    deleteApp(app)
                }
            }
        }
	    return app = initializeApp(firebaseConfig);
    }

    onMount(() => {
        const firebaseConfig: FirebaseOptions = {
            apiKey: PUBLIC_FIREBASE_APIKEY,
            authDomain: PUBLIC_FIREBASE_AUTH_DOMAIN,
            projectId: PUBLIC_FIREBASE_PROJECT_ID,
            storageBucket: PUBLIC_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
            appId: PUBLIC_FIREBASE_APP_ID,
        };

        try {
            const appInstance = initialize(firebaseConfig);
            firestore = getFirestore(appInstance);
            if (firestore) onFirestore?.(firestore);
            auth = getAuth(appInstance);
        } catch (err: unknown) {
            err;
        }

    });
</script>

{#if auth}
    <FirebaseApp {auth} {firestore}>
        {@render children?.()}
    </FirebaseApp>
{:else if spinnerSize}
    <Spinner size={spinnerSize} />
{/if}

