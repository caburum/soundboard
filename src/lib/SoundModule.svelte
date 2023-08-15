<script lang="ts">
	import { createEventDispatcher, getContext } from 'svelte';
	const dispatch = createEventDispatcher();
	import type { SoundHowl } from './SoundHowl';
	import type { Sound } from './types';
	import type { Writable } from 'svelte/store';

	export let sound: Sound;
	export let howl: SoundHowl;

	let playing = howl.playing; // this is weird syntax idk

	let editMode: Writable<boolean> = getContext('editMode');
</script>

<!-- should i fix this weird behavior? yes. will i? wellllllll -->
{#if howl}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<div class="card" class:playing={$playing} role="button" tabindex="0" on:click={() => howl.play()}>
		<h2>{sound.name}</h2>
		<div class="buttons">
			<button on:click|stopPropagation={() => howl.stop()}>🛑</button>
			<button on:click|stopPropagation={() => howl.fadeStop()}>📉</button>
			{#if $editMode}<button class="edit" on:click|stopPropagation={() => dispatch('edit')}>✏️</button>{/if}
		</div>
	</div>
{/if}

<style lang="scss">
	.card {
		background: var(--card);
		padding: var(--gap);
		min-height: 8em;
		// aspect-ratio: 3 / 2;
		display: flex;
		flex-direction: column;
		gap: var(--gap);
		border-radius: var(--gap);
		cursor: pointer;
		user-select: none;
	}
	.playing {
		background: var(--card-active);
	}
	h2 {
		margin: 0;
	}
	.buttons {
		margin-top: auto;
		display: flex;
		justify-content: flex-start;
		gap: var(--gap);
		button {
			padding: var(--gap);
			font-size: 1.5em;
			&.edit {
				margin-left: auto;
			}
		}
	}
</style>
