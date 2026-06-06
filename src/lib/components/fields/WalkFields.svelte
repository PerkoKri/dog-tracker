<script>
	import { walkDurationUnitOptions, durationToMinutes, formatQuantity } from '$lib/forms/routine-fields.js';

	let {
		time = $bindable(''),
		amount = $bindable(30),
		unitPreset = $bindable('Minuten'),
		timeLabel = 'Uhrzeit',
		amountLabel = 'Geplante Dauer',
		unitLabel = 'Dauer-Einheit'
	} = $props();

	let amountStep = $derived(unitPreset === 'Stunden' ? 0.25 : 5);
	let amountMin = $derived(unitPreset === 'Stunden' ? 0.25 : 1);
	let previewMinutes = $derived(durationToMinutes(amount, unitPreset));
	let endTime = $derived(addMinutes(time, previewMinutes));

	function addMinutes(value, minutes) {
		const match = /^(\d{2}):(\d{2})$/.exec(value || '');
		if (!match || !Number.isFinite(minutes) || minutes <= 0) return '';

		const total = Number(match[1]) * 60 + Number(match[2]) + minutes;
		const normalized = ((Math.round(total) % 1440) + 1440) % 1440;
		const hours = String(Math.floor(normalized / 60)).padStart(2, '0');
		const mins = String(normalized % 60).padStart(2, '0');
		return `${hours}:${mins}`;
	}
</script>

<div class="routine-fields">
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

	<label>
		{unitLabel}
		<select bind:value={unitPreset}>
			{#each walkDurationUnitOptions as option}
				<option value={option}>{option}</option>
			{/each}
		</select>
	</label>

	{#if endTime}
		<p class="preview-note">Von {time} bis {endTime} · {formatQuantity(amount)} {unitPreset}</p>
	{/if}
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

	.preview-note {
		margin: 0;
		border: 1px solid #dfe4dd;
		border-radius: 12px;
		background: #ffffff;
		color: #4d5b52;
		padding: 10px 12px;
		font-size: 0.86rem;
		line-height: 1.35;
	}
</style>
