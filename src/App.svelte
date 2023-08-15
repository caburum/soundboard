<script lang="ts">
	import { Howler } from 'howler';
	import { writable, type Writable } from 'svelte/store';
	import type { Sound, Config } from './lib/types';
	import Modal from './lib/Modal.svelte';
	import SoundModule from './lib/SoundModule.svelte';
	import { SoundHowl, soundDefaults } from './lib/SoundHowl';
	import { setContext } from 'svelte';
	import { useRegisterSW } from 'virtual:pwa-register/svelte';

	const { offlineReady, needRefresh, updateServiceWorker: _updateServiceWorker } = useRegisterSW({});
	const updateSW = async () => {
		(await navigator.serviceWorker.getRegistration())?.update();
		await _updateServiceWorker(true);
		console.log('updated sw?');
		// idk this might not even work
		(await navigator.serviceWorker.getRegistration())?.active.addEventListener('statechange', function () {
			if (this.state !== 'activating' && this.state !== 'activated') window.location.reload();
		});
	};

	const config: Writable<Config> = writable({});
	/** stores howls for the current loaded config */
	let howls: SoundHowl[] = [];
	let dirHandle: FileSystemDirectoryHandle = null;
	let configFileHandle: FileSystemFileHandle = null;

	if (window && !('showDirectoryPicker' in window)) alert('Unsupported browser.');

	const openProject = async () => {
		dirHandle = await window.showDirectoryPicker();

		dirHandle.requestPermission({
			mode: 'readwrite',
		});

		configFileHandle = await dirHandle.getFileHandle('config.json', {
			create: true,
		});

		try {
			$config = JSON.parse(await (await configFileHandle.getFile()).text());
		} catch (e) {
			alert('Creating new config boilerplate.');
			$config = {
				sounds: [],
			};
			unsavedChanges = true; // boilerplate config needs to be saved
		}
	};

	const regenHowls = async (config) => {
		if (!config?.sounds) return;
		console.trace('regenerating');
		// cleanup all old stuff
		Howler.unload();
		howls.forEach((howl) => howl._soundUrl && URL.revokeObjectURL(howl._soundUrl));
		// this is kinda jank but i don't want to pollute config to make serialization easier
		howls = Array($config.sounds?.length);
		// load in sounds
		await Promise.all(
			$config.sounds?.map((sound, index) => {
				try {
					howls[index] = new SoundHowl(sound);
					// loads in sound async
					return howls[index].initializeHowl(dirHandle);
				} catch (e) {
					console.log(e);
				}
			})
		);
	};
	// todo: only regenerate changed howls instead of them all, but like meh
	$: regenHowls($config);

	// probably a better way to implement this
	let unsavedChanges = false;
	const saveConfig = async () => {
		let writer = await configFileHandle.createWritable({ keepExistingData: false });
		writer.write(JSON.stringify($config, null, '\t'));
		writer.close();
		unsavedChanges = false;
	};
	let showModifySoundModal = false,
		modifySound: Partial<Sound> = {};
	const tsignore = (x: any) => x; // https://github.com/sveltejs/language-tools/issues/1026

	let editMode = writable(false);
	setContext('editMode', editMode);

	let showSettingsModal = false;
	let scale = 1;
	try {
		scale = parseFloat(localStorage.getItem('scale')) || 1;
	} catch (e) {}
	$: localStorage.setItem('scale', scale.toString());

	let title = '';
	$: title = (dirHandle?.name || '') + (unsavedChanges ? '*' : '') || '';

	// $: console.log($config);
</script>

<svelte:head>
	<title>{title ? `${title} | ` : ''}soundboard</title>
</svelte:head>

<svelte:window
	on:beforeunload={(e) => {
		if (unsavedChanges) {
			e.preventDefault();
			return (e.returnValue = 'You have unsaved changes.');
		}
	}}
/>

<header>
	<div>
		<h1 title={unsavedChanges ? 'Unsaved changes' : ''}>{title || 'No project'}</h1>
		{#if $needRefresh}
			<button on:click={updateSW}>🔄️</button>
		{/if}
	</div>
	<div>
		<button on:click={openProject}>Open</button>
		<button on:click={saveConfig} disabled={!configFileHandle}>Save</button>
		<button on:click={() => (showModifySoundModal = true)} disabled={!configFileHandle}>New Sound</button>
		<button on:click={() => ($editMode = !$editMode)}>{$editMode ? 'Hide' : 'Show'} Edit</button>
		<button on:click={() => (showSettingsModal = true)}>Settings</button>
		<button on:click={() => Howler.stop()}>🛑 All</button>
	</div>
</header>

<main style:--scale={scale}>
	<!-- regenerate it all as howls are all renegerated -->
	{#key $config?.sounds}
		{#each $config?.sounds || [] as sound, index}
			<SoundModule
				{sound}
				howl={howls[index]}
				on:edit={() => {
					modifySound = sound;
					showModifySoundModal = true;
				}}
			/>
		{/each}
	{/key}
</main>

<Modal
	confirmation
	bind:show={showModifySoundModal}
	on:confirm={() => {
		unsavedChanges = true;
		// @ts-ignore - html form will verify types
		// we only pass a new object when creating a new entry so we can check includes for whether to push
		if (!$config.sounds.includes(modifySound)) $config.sounds.push(modifySound);
		$config = { ...$config };
	}}
	on:close={(e) => {
		if (e.detail === 'delete') {
			unsavedChanges = true;
			// @ts-ignore
			let index = $config.sounds.indexOf(modifySound);
			if (index >= 0) {
				$config.sounds.splice(index, 1);
				$config = { ...$config };
			} else {
				alert('Failed to delete sound.');
			}
		}
		modifySound = {};
	}}
>
	<div>
		<label for="name">Name:</label>
		<input id="name" type="text" required bind:value={modifySound.name} />
	</div>
	<div>
		<label for="filename">Filename:</label>
		<input id="filename" type="text" required bind:value={modifySound.filename} />
	</div>
	<div>
		<label for="loop">Loop:</label>
		<input
			id="loop"
			type="checkbox"
			bind:checked={modifySound.loop}
			on:change={() => {
				if (modifySound.loop) modifySound.oneAtATime = true;
			}}
		/>
	</div>
	<div>
		<label for="oneAtATime">One at a time:</label>
		<input id="oneAtATime" type="checkbox" disabled={modifySound.loop} bind:checked={modifySound.oneAtATime} />
	</div>
	<div>
		<label for="fadeOutDuration">Fade out duration (ms):</label>
		<input id="fadeOutDuration" type="number" placeholder={`${soundDefaults.fadeOutDuration}`} step="100" bind:value={modifySound.fadeOutDuration} />
	</div>
	<div>
		<label for="volume">Volume:</label>
		<input id="volume" type="number" placeholder={`${soundDefaults.volume}`} step="0.05" min="0" max="1" bind:value={modifySound.volume} />
	</div>
	<small>todo: implement changing order, rn just go edit the json yourself</small>
	<small>⚠️ Confirming will immediately cancel all currently playing sounds!</small>
	<svelte:fragment slot="buttons">
		{#if $config?.sounds?.includes(tsignore(modifySound))}
			<button value="delete" type="submit" formnovalidate>Delete</button>
		{/if}
	</svelte:fragment>
</Modal>

<Modal bind:show={showSettingsModal}>
	<div>
		<label for="scale">UI Scale:</label>
		<input id="scale" type="range" bind:value={scale} min={0.8} max={2} step={0.1} />
		{scale}
	</div>
	<!-- todo: dropdown for choosing an audio output -->
	<!-- svelte-ignore missing-declaration -->
	<small
		>{#if $offlineReady}offline ready | {/if}built {BUILD_TIME}</small
	>
	<div class="horizPanel" style:margin="var(--gap)">
		<button on:click|preventDefault={updateSW}>Force update</button>
	</div>
</Modal>

<style lang="scss">
	header {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--gap);
		& :first-child {
			margin: 0;
			margin-right: auto;
			line-height: 1;
		}
		div {
			display: flex;
			flex-wrap: wrap;
			gap: var(--gap);
		}
	}

	main {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(calc(160px * var(--scale)), 100vw), 1fr));
		font-size: calc(1em * var(--scale));
		gap: var(--gap);
	}
</style>
