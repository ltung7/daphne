<script lang="ts">
    import CustomFormPassword from "./CustomFormPassword.svelte";
    import { InputGroup } from '@sveltestrap/sveltestrap';
    import UIcon from "$lib/misc/UIcon.svelte";
	import { fly } from "svelte/transition";
	import * as m from '$lib/paraglide/messages.js';

    interface Props {
        name?: string;
        valid?: boolean;
        random?: boolean;
        password?: string;
    }

    let {
        name = 'password',
        valid = $bindable(false),
        random = true,
        password = $bindable('')
    }: Props = $props();
    let confirm = $state(''), message = $state(''), randomizedPassword = $state('');
    const PATTERN = "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})"

    async function verifyPassword() {
        message = '';
        if (password.length < 2 && confirm.length < 2) return;
        if (!password.match(PATTERN)) message = 'Hasło musi mieć co najmniej 8 znaków oraz posiadać co najmniej jedną dużą literę, jedną małą literę, jedną cyfrę oraz jeden znak specjalny';
        if (password !== confirm) message = 'Hasła nie są identyczne';
        valid = message.length === 0;
    }

    function verifyString(string: string) {
        return string.match(PATTERN);
    }

    async function generatePassword(rounds = 10) {
        rounds--;
        if (rounds < 1 && verifyString(randomizedPassword)) {
            password = randomizedPassword;
            confirm = randomizedPassword;
            verifyPassword();
            return;
        }
        setTimeout(() => {
            randomizedPassword = randomPassword();
            generatePassword(rounds);
        }, 75)
    }

    function randomPassword() {
        const length = 16;
        let password = [];
        for (let i = 0; i < length; i++) {
            const variant = randomInt(0, 5);
            let chr;
            switch(variant) {
                case 0: chr = randomInt(0, 9); break;
                case 1: chr = randomSpecialChar(); break;
                default: chr = randomChar(); break;
            }
            password[i] = chr;
        }
        return password.join("");
    }

    function randomInt(min: number, max: number) {
        return Math.floor(Math.random() * (max - min + 1) + min)
    }

    function randomChar() {
        const ccase = randomInt(0, 1);
        const ind = randomInt(0, 25);
        return String.fromCharCode(65 + 32 * ccase + ind);
    }

    function randomSpecialChar() {
        const CHARS = [ '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '[', ']', '-', '_', '=', '+', ',', '.', '<', '>', '?', ':', ';' ];
        return CHARS[randomInt(0, CHARS.length)];
    }
</script>

<div>
    <CustomFormPassword bind:value={password} {name} caption={m.password()} onInput={verifyPassword} />
    <CustomFormPassword bind:value={confirm} name="confirm" caption={m.confirmpass()} onInput={verifyPassword} />
    {#if random}
        <InputGroup class="mb-2 justify-content-end w-100">
            {#if randomizedPassword.length}
                <input type="text" class="form-control text-center btn-pill border border-primary {randomizedPassword.length === 0 ? 'opacity-0' : 'opacity-10'}" readonly value={randomizedPassword} style="width: calc(100% - 48px); padding: 5px;">
            {:else}
                <button class="my-0 d-flex justify-content-center align-items-center btn-sm disabled btn btn-outline-secondary" onclick={() => generatePassword()} style="width: calc(100% - 48px)">
                    {m.randompass()}
                </button>
            {/if}
            <button class="btn btn-primary mb-0 px-3 py-2" title={m.randompass()} onclick={() => generatePassword()}>
                <UIcon name="dice-alt"/>
            </button>
        </InputGroup>
    {/if}
    <div style="min-height: 2.5rem;">
        {#if message.length > 0}
            <div class="text-danger text-sm mb-4" transition:fly={{ y:-25 }}>{message}</div>
        {/if}
    </div>
</div>
