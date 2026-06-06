<script>
	import UnitSelect from './UnitSelect.svelte';
	import { foodUnitOptions } from '$lib/forms/routine-fields.js';

	let {
		title = $bindable(''),
		time = $bindable(''),
		amount = $bindable(1),
		unitPreset = $bindable('Portion'),
		unitCustom = $bindable(''),
		titleLabel = 'Titel / Beschreibung',
		titlePlaceholder = 'z. B. Morgenfutter',
		timeLabel = 'Uhrzeit',
		amountLabel = 'Menge',
		amountMin = 0.25,
		amountStep = 0.25
	} = $props();
</script>

<div class="routine-fields">
	<label>
		{titleLabel}
		<input bind:value={title} placeholder={titlePlaceholder} />
	</label>

	<div class="form-grid">
		<label>
			{timeLabel}
			<input type="time" bind:value={time} />
		</label>
		<label>
			{amountLabel}
			<input
				type="number"
				inputmode="decimal"
				min={amountMin}
				step={amountStep}
				bind:value={amount}
			/>
		</label>
	</div>

	<UnitSelect
		label="Einheit"
		options={foodUnitOptions}
		bind:value={unitPreset}
		bind:customValue={unitCustom}
		customLabel="Eigene Einheit"
		customPlaceholder="z. B. Portionen pro Tag"
	/>
</div>

<style>
	.routine-fields {
		display: grid;
		gap: 10px;
	}

	.form-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 10px;
	}

	label {
		display: grid;
		gap: 6px;
		color: #17211b;
		font-size: 0.88rem;
		font-weight: 800;
	}

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

	input:focus {
		border-color: #2c6f67;
		box-shadow: 0 0 0 3px rgba(44, 111, 103, 0.12);
	}
</style>
