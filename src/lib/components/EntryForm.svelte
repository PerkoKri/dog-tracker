<script>
	import FoodFields from '$lib/components/fields/FoodFields.svelte';
	import MedicationFields from '$lib/components/fields/MedicationFields.svelte';
	import WalkFields from '$lib/components/fields/WalkFields.svelte';

	let {
		currentStep = $bindable(1),
		dogName = $bindable(''),
		dogs = [],
		type = $bindable('Gassi'),
		amount = $bindable(25),
		activityDate = $bindable(''),
		time = $bindable(''),
		note = $bindable(''),
		routineTitle = $bindable(''),
		routineUnitPreset = $bindable('Minuten'),
		routineUnitCustom = $bindable(''),
		careType = $bindable('Fellpflege'),
		vetReason = $bindable(''),
		vetClinic = $bindable(''),
		attachmentName = $bindable(''),
		attachmentType = $bindable(''),
		attachmentData = $bindable(''),
		attachmentSize = $bindable(0),
		isSaving = false,
		successMessage = '',
		setStep,
		updateAmountForType,
		onSave
	} = $props();

	const activityOptions = [
	{
		value: 'Gassi',
		label: 'Gassi',
		help: 'Uhrzeit, Dauer und Dauer-Einheit.',
		unit: 'Minuten'
	},
	{
		value: 'Futter',
		label: 'Futter',
		help: 'Titel, Uhrzeit, Menge und Einheit.',
		unit: 'Portion'
	},
	{
		value: 'Pflege',
		label: 'Pflege',
		help: 'Pflegeart und Dauer in Minuten.',
		unit: 'Minuten'
	},
	{
		value: 'Medikament',
		label: 'Medikament',
		help: 'Name, Uhrzeit, Dosis und Einheit.',
		unit: 'Tablette'
	},
	{
		value: 'Arzt',
		label: 'Arzt',
		help: 'Termin oder Besuch beim Tierarzt.',
		unit: ''
	}
	];

	let selectedOption = $derived(
		activityOptions.find((option) => option.value === type) ?? activityOptions[0]
	);
	let usesRoutineFields = $derived(['Gassi', 'Futter', 'Medikament'].includes(type));
	let endTime = $derived(type === 'Pflege' ? addMinutes(time, Number(amount || 0)) : '');
	let attachmentMessage = $state('');

	function addMinutes(value, minutes) {
		const match = /^(\d{2}):(\d{2})$/.exec(value || '');
		if (!match || !Number.isFinite(minutes)) return '';

		const total = Number(match[1]) * 60 + Number(match[2]) + minutes;
		const normalized = ((Math.round(total) % 1440) + 1440) % 1440;
		const hours = String(Math.floor(normalized / 60)).padStart(2, '0');
		const mins = String(normalized % 60).padStart(2, '0');
		return `${hours}:${mins}`;
	}

	function formatFileSize(size) {
		if (!size) return '';
		if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
		return `${(size / 1024 / 1024).toFixed(1)} MB`;
	}

	function clearAttachment() {
		attachmentName = '';
		attachmentType = '';
		attachmentData = '';
		attachmentSize = 0;
		attachmentMessage = '';
	}

	function handleAttachment(event) {
		const file = event.currentTarget.files?.[0];
		attachmentMessage = '';
		if (!file) return;

		const maxSize = 1024 * 1024 * 3;
		if (file.size > maxSize) {
			clearAttachment();
			attachmentMessage = 'Bitte maximal 3 MB hochladen.';
			event.currentTarget.value = '';
			return;
		}

		const reader = new FileReader();
		reader.onload = () => {
			attachmentName = file.name;
			attachmentType = file.type || 'application/octet-stream';
			attachmentSize = file.size;
			attachmentData = String(reader.result || '');
		};
		reader.onerror = () => {
			clearAttachment();
			attachmentMessage = 'Anhang konnte nicht gelesen werden.';
		};
		reader.readAsDataURL(file);
	}
</script>

<section class="entry-panel" aria-labelledby="entry-title">
	<div class="section-heading">
		<div>
			<p class="eyebrow">Schnellerfassung</p>
			<h2 id="entry-title">Aktivität eintragen</h2>
		</div>
		<span class="step-indicator">Schritt {currentStep} / 3</span>
	</div>

	{#if successMessage}
		<p class="success-note">{successMessage}</p>
	{/if}

	<form
		onsubmit={(event) => {
			event.preventDefault();
			onSave();
		}}
	>
		{#if currentStep === 1}
			<label for="dog">Hund</label>
			<select id="dog" bind:value={dogName}>
				{#each dogs as dog}
					<option value={dog.name}>{dog.name}</option>
				{/each}
			</select>
		{/if}

		{#if currentStep === 2}
			<fieldset>
				<legend>Was wurde gemacht?</legend>
				<div class="segmented">
					{#each activityOptions as option}
						<label>
							<input
								type="radio"
								name="type"
								value={option.value}
								checked={type === option.value}
								onchange={() => updateAmountForType(option.value)}
							/>
							<span>
								<strong>{option.label}</strong>
								<small>{option.help}</small>
							</span>
						</label>
					{/each}
				</div>
			</fieldset>
		{/if}

		{#if currentStep === 3}
			<div class="type-hint">
				<strong>{selectedOption.label}</strong>
				<span>{selectedOption.help}</span>
			</div>

			<div class="form-grid">
				<label>
					Datum
					<input type="date" bind:value={activityDate} />
				</label>
				{#if !usesRoutineFields}
					<label>
						Uhrzeit
						<input type="time" bind:value={time} />
					</label>
				{/if}
			</div>

			{#if type === 'Futter'}
				<FoodFields
					bind:title={routineTitle}
					bind:time={time}
					bind:amount={amount}
					bind:unitPreset={routineUnitPreset}
					bind:unitCustom={routineUnitCustom}
				/>
			{:else if type === 'Medikament'}
				<MedicationFields
					bind:title={routineTitle}
					bind:time={time}
					bind:amount={amount}
					bind:unitPreset={routineUnitPreset}
					bind:unitCustom={routineUnitCustom}
				/>
			{:else if type === 'Gassi'}
				<WalkFields bind:time={time} bind:amount={amount} bind:unitPreset={routineUnitPreset} />
			{:else if type === 'Pflege'}
				<div class="form-grid">
					<label>
						Dauer (Minuten)
						<input
							type="number"
							inputmode="decimal"
							min="1"
							step="5"
							bind:value={amount}
						/>
					</label>
					<label>
						Pflegeart
						<select bind:value={careType}>
							<option>Fellpflege</option>
							<option>Baden</option>
							<option>Krallen</option>
							<option>Zähne</option>
							<option>Ohren</option>
						</select>
					</label>
				</div>
				{#if endTime}
					<p class="preview-note">Von {time} bis {endTime} · {amount} Minuten</p>
				{/if}
			{:else if type === 'Arzt'}
				<label>
					Grund / Termin
					<input bind:value={vetReason} placeholder="z. B. Impfung" />
				</label>
				<label>
					Tierarzt / Ort
					<input bind:value={vetClinic} placeholder="z. B. Tierarztpraxis" />
				</label>
			{/if}

			<label>
				Notiz
				<textarea bind:value={note} rows="3" placeholder="z. B. ruhig, verspielt, wenig Hunger"></textarea>
			</label>

			<label>
				Anhang zur Hundeakte
				<input
					type="file"
					accept="image/*,.pdf,.txt,.doc,.docx"
					onchange={handleAttachment}
				/>
			</label>
			{#if attachmentMessage}
				<p class="attachment-warning">{attachmentMessage}</p>
			{/if}
			{#if attachmentName}
				<div class="attachment-card">
					<div>
						<strong>{attachmentName}</strong>
						<span>{attachmentType || 'Datei'} · {formatFileSize(attachmentSize)}</span>
					</div>
					<button type="button" onclick={clearAttachment}>Entfernen</button>
				</div>
			{/if}
		{/if}

		<div class="form-actions">
			<button
				class="secondary-button"
				type="button"
				class:invisible={currentStep === 1}
				onclick={() => setStep(currentStep - 1)}
			>
				Zurück
			</button>
			{#if currentStep < 3}
				<button class="primary-button" type="button" onclick={() => setStep(currentStep + 1)}>Weiter</button>
			{:else}
				<button class="primary-button" type="button" disabled={isSaving} onclick={onSave}>
					{isSaving ? 'Speichert...' : 'Speichern'}
				</button>
			{/if}
		</div>
	</form>
</section>

<style>
	.entry-panel {
		border: 1px solid #e3d8c9;
		border-radius: 8px;
		background: #fffaf2;
		box-shadow: 0 18px 44px rgba(40, 33, 24, 0.12);
		padding: 18px;
		margin-top: 14px;
	}

	.section-heading,
	.form-actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
	}

	.eyebrow {
		margin: 0 0 4px;
		color: #2c6f67;
		font-size: 0.76rem;
		font-weight: 800;
		letter-spacing: 0;
		text-transform: uppercase;
	}

	h2 {
		margin: 0;
		font-size: 1.15rem;
		line-height: 1.2;
	}

	.step-indicator {
		width: fit-content;
		border-radius: 999px;
		background: #eef6f3;
		color: #1f5f57;
		font-size: 0.78rem;
		font-weight: 800;
		padding: 7px 10px;
		white-space: nowrap;
	}

	.success-note,
	.preview-note,
	.type-hint,
	.attachment-warning {
		border-radius: 8px;
		font-size: 0.86rem;
		line-height: 1.35;
	}

	.success-note {
		margin: 14px 0 0;
		background: #eef6f3;
		color: #1f5f57;
		padding: 10px 12px;
		font-weight: 700;
	}

	.preview-note,
	.type-hint {
		margin: 0 0 12px;
		border: 1px solid #dfe4dd;
		background: #ffffff;
		color: #4d5b52;
		padding: 10px 12px;
	}

	.type-hint {
		display: grid;
		gap: 3px;
	}

	.type-hint strong {
		color: #17211b;
	}

	.attachment-warning {
		margin: 0 0 12px;
		background: #fff4e6;
		color: #86532d;
		padding: 10px 12px;
	}

	form {
		margin-top: 18px;
	}

	label,
	legend {
		display: block;
		margin-bottom: 8px;
		color: #17211b;
		font-size: 0.88rem;
		font-weight: 800;
	}

	select,
	input,
	textarea {
		width: 100%;
		min-width: 0;
		max-width: 100%;
		border: 1px solid #dfe4dd;
		border-radius: 12px;
		background: #ffffff;
		color: #17211b;
		padding: 12px;
		outline: none;
	}

	select:focus,
	input:focus,
	textarea:focus {
		border-color: #2c6f67;
		box-shadow: 0 0 0 3px rgba(44, 111, 103, 0.12);
	}

	fieldset {
		margin: 0;
		padding: 0;
		border: 0;
	}

	.segmented {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 8px;
	}

	.segmented input {
		position: absolute;
		opacity: 0;
	}

	.segmented span {
		min-height: 96px;
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 5px;
		border: 1px solid #dfe4dd;
		border-radius: 12px;
		background: #ffffff;
		color: #66707a;
		padding: 10px;
		font-weight: 800;
	}

	.segmented small {
		color: #66707a;
		font-size: 0.72rem;
		font-weight: 650;
		line-height: 1.25;
	}

	.segmented input:checked + span {
		border-color: #2c6f67;
		background: #eef6f3;
		color: #1f5f57;
	}

	.form-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px;
	}

	textarea {
		resize: vertical;
	}

	.attachment-card {
		display: grid;
		grid-template-columns: 1fr auto;
		align-items: center;
		gap: 10px;
		border: 1px solid #dfe4dd;
		border-radius: 12px;
		background: #ffffff;
		padding: 10px 12px;
	}

	.attachment-card strong,
	.attachment-card span {
		display: block;
	}

	.attachment-card span {
		margin-top: 3px;
		color: #66707a;
		font-size: 0.78rem;
	}

	.attachment-card button {
		min-height: 38px;
		border: 0;
		border-radius: 12px;
		background: #f7dfd8;
		color: #8a2b18;
		padding: 0 12px;
		font-weight: 900;
	}

	.form-actions {
		margin-top: 18px;
	}

	.primary-button,
	.secondary-button {
		min-height: 46px;
		border: 0;
		border-radius: 12px;
		padding: 0 18px;
		font-weight: 900;
	}

	.primary-button {
		background: #2c6f67;
		color: white;
	}

	.primary-button:disabled {
		opacity: 0.65;
		cursor: wait;
	}

	.secondary-button {
		background: #eef2ed;
		color: #17211b;
	}

	.invisible {
		visibility: hidden;
	}

	@media (max-width: 430px) {
		.section-heading {
			align-items: flex-start;
			flex-wrap: wrap;
		}

		.form-grid {
			grid-template-columns: 1fr;
		}

		.form-actions {
			gap: 10px;
		}

		.primary-button,
		.secondary-button {
			flex: 1;
			min-width: 120px;
		}
	}
</style>
