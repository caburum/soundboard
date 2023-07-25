<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();

	export let show = false;
	export let confirmation = false;

	let dialog: HTMLDialogElement;

	$: if (dialog) {
		if (show) {
			dialog.showModal();
		} else dialog.close();
	}
</script>

<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions -->
<dialog
	bind:this={dialog}
	on:close={() => {
		if (dialog.returnValue === 'confirm') dispatch('confirm'); // when explicitly confirming
		else dispatch('cancel'); // for any other reason (click out, etc.)
		show = false;
		dispatch('close', dialog.returnValue); // always (for resetting content or handling a custom return), DONE LAST
		dialog.returnValue = '';
	}}
	on:click|self={() => dialog.close()}
>
	<form method="dialog">
		<slot />
		<div class="horizPanel">
			<!-- svelte-ignore a11y-autofocus -->
			<button autofocus type="submit" formnovalidate>{confirmation ? 'Cancel' : 'Close'}</button>
			{#if confirmation}<button type="submit" value="confirm">Confirm</button>{/if}
			<slot name="buttons" />
		</div>
	</form>
</dialog>

<style lang="scss">
	dialog[open] {
		border: none;
		padding: 0;

		border-radius: 8px;
		/* background-color: var(--light); */
		font-size: 17px;
	}
	form {
		width: clamp(260px, 50vw, 40rem);
		min-height: 15vh;
		box-sizing: border-box;
		/* so clicking on the edges won't count as clicking outside */
		padding: 12px;

		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--gap);

		& > :global(*) {
			margin: 0;
			width: 100%;
		}
	}

	dialog::backdrop {
		background: rgba(0, 0, 0, 0.5);
		animation: fade 250ms ease;
	}

	@keyframes fade {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
</style>
