<script>
	let {
		label = 'Einheit',
		options = [],
		value = $bindable(''),
		customValue = $bindable(''),
		customLabel = 'Benutzerdefiniert',
		customPlaceholder = 'Eigene Einheit'
	} = $props();

	let showCustom = $derived(value === 'Andere');
</script>

<div class="unit-select">
	<label>
		{label}
		<select bind:value={value}>
			{#each options as option}
				<option value={option}>{option}</option>
			{/each}
		</select>
	</label>

	{#if showCustom}
		<label>
			{customLabel}
			<input bind:value={customValue} placeholder={customPlaceholder} />
		</label>
	{/if}
</div>

<style>
	.unit-select {
		display: grid;
		gap: 10px;
	}

	label {
		display: grid;
		gap: 6px;
		color: #17211b;
		font-size: 0.88rem;
		font-weight: 800;
	}

	select,
	input {
		width: 100%;
		border: 1px solid #dfe4dd;
		border-radius: 12px;
		background: #ffffff;
		color: #17211b;
		padding: 12px;
		outline: none;
		font: inherit;
	}

	select:focus,
	input:focus {
		border-color: #2c6f67;
		box-shadow: 0 0 0 3px rgba(44, 111, 103, 0.12);
	}
</style>
