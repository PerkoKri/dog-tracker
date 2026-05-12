<script>
	let {
		currentStep = $bindable(1),
		dogName = $bindable('Milo'),
		dogs = [],
		newDogName = $bindable(''),
		type = $bindable('Gassi'),
		amount = $bindable(25),
		time = $bindable(''),
		note = $bindable(''),
		isSaving = false,
		successMessage = '',
		setStep,
		updateAmountForType,
		onAddDog,
		onSave
	} = $props();
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

			<div class="add-dog-row">
				<input bind:value={newDogName} placeholder="Neuen Hund hinzufügen" />
				<button class="secondary-button" type="button" onclick={onAddDog}>+</button>
			</div>
		{/if}

		{#if currentStep === 2}
			<fieldset>
				<legend>Was wurde gemacht?</legend>
				<div class="segmented">
					{#each ['Gassi', 'Futter', 'Pflege'] as option}
						<label>
							<input
								type="radio"
								name="type"
								value={option}
								checked={type === option}
								onchange={() => updateAmountForType(option)}
							/>
							<span>{option}</span>
						</label>
					{/each}
				</div>
			</fieldset>
		{/if}

		{#if currentStep === 3}
			<div class="form-grid">
				<label>
					Dauer / Menge
					<input inputmode="numeric" bind:value={amount} />
				</label>
				<label>
					Uhrzeit
					<input inputmode="numeric" placeholder="HH:MM" bind:value={time} />
				</label>
			</div>
			<label>
				Notiz
				<textarea bind:value={note} rows="3" placeholder="z. B. ruhig, verspielt, wenig Hunger"></textarea>
			</label>
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
				<button class="primary-button" type="submit" disabled={isSaving}>
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
		color: #28756c;
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
		background: #e6f1ec;
		color: #18544d;
		font-size: 0.78rem;
		font-weight: 800;
		padding: 7px 10px;
	}

	.success-note {
		margin: 14px 0 0;
		border-radius: 8px;
		background: #e6f1ec;
		color: #18544d;
		padding: 10px 12px;
		font-size: 0.86rem;
		font-weight: 700;
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
		border: 1px solid #e3d8c9;
		border-radius: 8px;
		background: #ffffff;
		color: #17211b;
		padding: 12px;
		outline: none;
	}

	select:focus,
	input:focus,
	textarea:focus {
		border-color: #28756c;
		box-shadow: 0 0 0 3px rgba(40, 117, 108, 0.14);
	}

	fieldset {
		margin: 0;
		padding: 0;
		border: 0;
	}

	.segmented {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 8px;
	}

	.segmented input {
		position: absolute;
		opacity: 0;
	}

	.segmented span {
		min-height: 82px;
		display: grid;
		place-items: center;
		border: 1px solid #e3d8c9;
		border-radius: 8px;
		background: #ffffff;
		color: #6a716c;
		font-weight: 800;
	}

	.segmented input:checked + span {
		border-color: #28756c;
		background: #e6f1ec;
		color: #18544d;
	}

	.form-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px;
	}

	.add-dog-row {
		display: grid;
		grid-template-columns: 1fr 46px;
		gap: 8px;
		margin-top: 10px;
	}

	textarea {
		resize: vertical;
	}

	.form-actions {
		margin-top: 18px;
	}

	.primary-button,
	.secondary-button {
		min-height: 46px;
		border: 0;
		border-radius: 8px;
		padding: 0 18px;
		font-weight: 900;
	}

	.primary-button {
		background: #28756c;
		color: white;
	}

	.primary-button:disabled {
		opacity: 0.65;
		cursor: wait;
	}

	.secondary-button {
		background: #efe7dc;
		color: #17211b;
	}

	.invisible {
		visibility: hidden;
	}
</style>
