<script>
	import CustomFormLanguage from "$lib/form/CustomFormLanguage.svelte";
	import CustomFormTextarea from "$lib/form/CustomFormTextarea.svelte";
	import translateFns from "$lib/nav/translate";
    let sentence = $state('The quick brown fox jumps over the lazy dog.');
    let translated = $state('')
    let language = $state('pl')
</script>

<div class="card">
    <h5 class="card-header">Tłumaczenie</h5>
    <div class="card-body">
        <div class="row">
            <div class="col-12 col-md-6">
                <CustomFormTextarea bind:value={sentence} />
            </div>
            <div class="col-12 col-md-6">
                <CustomFormTextarea value={translated} readonly />
            </div>
        </div>
        <div class="flex-center">
            <CustomFormLanguage bind:value={language} />
        </div>
        <div class="flex-center">
            {#each Object.entries(translateFns) as [ name, translate ] }
                <button class="btn btn-primary mx-2 mb-1" onclick={() => translate(sentence, 'en', language).then(res => translated = res)}>
                    {name}
                </button>
            {/each}
        </div>
    </div>
</div>