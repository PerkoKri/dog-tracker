<script>
	import FoodFields from '$lib/components/fields/FoodFields.svelte';
	import MedicationFields from '$lib/components/fields/MedicationFields.svelte';
	import WalkFields from '$lib/components/fields/WalkFields.svelte';
	import {
		displayQuantity,
		foodUnitOptions,
		medicationUnitOptions,
		walkDurationUnitOptions,
		resolveUnitValue,
		unitPresetForValue
	} from '$lib/forms/routine-fields.js';

	let {
		user,
		dogs = [],
		dogName = $bindable(''),
		successMessage = '',
		onAddDog,
		onDeleteDog
	} = $props();

	let draftName = $state('');
	let draftBreed = $state('');
	let draftHint = $state('');
	let draftMessage = $state('');
	let isSaving = $state(false);
	let isExpanded = $state(false);

	let feedingTitle = $state('');
	let feedingTime = $state('07:00');
	let feedingAmount = $state(120);
	let feedingUnitPreset = $state('Gramm');
	let feedingUnitCustom = $state('');
	let feedingEditIndex = $state(-1);
	let feedingSchedules = $state([]);

	let medicationTitle = $state('');
	let medicationDose = $state(1);
	let medicationUnitPreset = $state('Tablette');
	let medicationUnitCustom = $state('');
	let medicationTime = $state('08:00');
	let medicationEditIndex = $state(-1);
	let medicationSchedules = $state([]);

	let walkTime = $state('');
	let walkDuration = $state(30);
	let walkDurationUnit = $state('Minuten');
	let walkEditIndex = $state(-1);
	let walkSchedules = $state([]);

	let dossierTitle = $state('');
	let dossierFileName = $state('');
	let dossierFileType = $state('');
	let dossierFileSize = $state(0);
	let dossierFileData = $state('');
	let dossierItems = $state([]);

	let activeDog = $derived(dogs.find((dog) => dog.name === dogName));

	function createLocalId() {
		return typeof crypto !== 'undefined' && 'randomUUID' in crypto
			? crypto.randomUUID()
			: Math.random().toString(36).slice(2, 10);
	}

	function formatFileSize(size) {
		if (!size) return '';
		if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
		return `${(size / 1024 / 1024).toFixed(1)} MB`;
	}

	function resolveUnit(preset, custom) {
		return resolveUnitValue(preset, custom);
	}

	function resetFeedingDraft() {
		feedingTitle = '';
		feedingTime = '07:00';
		feedingAmount = 120;
		feedingUnitPreset = 'Gramm';
		feedingUnitCustom = '';
		feedingEditIndex = -1;
	}

	function resetMedicationDraft() {
		medicationTitle = '';
		medicationDose = 1;
		medicationUnitPreset = 'Tablette';
		medicationUnitCustom = '';
		medicationTime = '08:00';
		medicationEditIndex = -1;
	}

	function resetDossierDraft() {
		dossierTitle = '';
		dossierFileName = '';
		dossierFileType = '';
		dossierFileSize = 0;
		dossierFileData = '';
	}

	function resetDraft() {
		draftName = '';
		draftBreed = '';
		draftHint = '';
		draftMessage = '';
		feedingSchedules = [];
		medicationSchedules = [];
		walkSchedules = [];
		dossierItems = [];
		resetFeedingDraft();
		resetMedicationDraft();
		resetWalkDraft();
		resetDossierDraft();
	}

	function validateDogDraft() {
		if (!draftName.trim()) return 'Hundename fehlt.';
		return '';
	}

	function upsertFeedingSchedule() {
		const unit = resolveUnit(feedingUnitPreset, feedingUnitCustom);
		const title = feedingTitle.trim() || 'Futter';
		const schedule = {
			id: feedingEditIndex >= 0 ? feedingSchedules[feedingEditIndex]?.id || createLocalId() : createLocalId(),
			title,
			name: title,
			time: feedingTime,
			amount: Number(feedingAmount) || 0,
			unit: unit || 'Portion'
		};

		if (!schedule.time) {
			draftMessage = 'Bitte eine Futterzeit wählen.';
			return;
		}
		if (schedule.amount <= 0) {
			draftMessage = 'Bitte eine gültige Menge angeben.';
			return;
		}
		if (!schedule.unit.trim()) {
			draftMessage = 'Bitte eine Einheit wählen oder eintragen.';
			return;
		}

		feedingSchedules =
			feedingEditIndex >= 0
				? feedingSchedules.map((item, index) => (index === feedingEditIndex ? schedule : item))
				: [...feedingSchedules, schedule];
		resetFeedingDraft();
		draftMessage = '';
	}

	function editFeedingSchedule(index) {
		const schedule = feedingSchedules[index];
		if (!schedule) return;
		feedingTitle = schedule.title || schedule.name || '';
		feedingTime = schedule.time || '07:00';
		feedingAmount = schedule.amount || 120;
		feedingUnitPreset = unitPresetForValue(schedule.unit, foodUnitOptions, 'Gramm');
		feedingUnitCustom = foodUnitOptions.includes(schedule.unit) ? '' : schedule.unit || '';
		feedingEditIndex = index;
	}

	function deleteFeedingSchedule(index) {
		feedingSchedules = feedingSchedules.filter((_, current) => current !== index);
		if (feedingEditIndex === index) resetFeedingDraft();
	}

	function upsertMedicationSchedule() {
		const unit = resolveUnit(medicationUnitPreset, medicationUnitCustom);
		const title = medicationTitle.trim() || 'Medikament';
		const schedule = {
			id: medicationEditIndex >= 0 ? medicationSchedules[medicationEditIndex]?.id || createLocalId() : createLocalId(),
			title,
			name: title,
			dose: Number(medicationDose) || 0,
			unit: unit || 'Stück',
			time: medicationTime
		};

		if (schedule.dose <= 0) {
			draftMessage = 'Bitte eine gültige Dosis angeben.';
			return;
		}
		if (!schedule.time) {
			draftMessage = 'Bitte eine Einnahmezeit wählen.';
			return;
		}
		if (!schedule.unit.trim()) {
			draftMessage = 'Bitte eine Einheit wählen oder eintragen.';
			return;
		}

		medicationSchedules =
			medicationEditIndex >= 0
				? medicationSchedules.map((item, index) => (index === medicationEditIndex ? schedule : item))
				: [...medicationSchedules, schedule];
		resetMedicationDraft();
		draftMessage = '';
	}

	function editMedicationSchedule(index) {
		const schedule = medicationSchedules[index];
		if (!schedule) return;
		medicationTitle = schedule.title || schedule.name || '';
		medicationDose = schedule.dose || 1;
		medicationTime = schedule.time || '08:00';
		medicationUnitPreset = unitPresetForValue(schedule.unit, medicationUnitOptions, 'Tablette');
		medicationUnitCustom = medicationUnitOptions.includes(schedule.unit) ? '' : schedule.unit || '';
		medicationEditIndex = index;
	}

	function deleteMedicationSchedule(index) {
		medicationSchedules = medicationSchedules.filter((_, current) => current !== index);
		if (medicationEditIndex === index) resetMedicationDraft();
	}

	function resetWalkDraft() {
		walkTime = '';
		walkDuration = 30;
		walkDurationUnit = 'Minuten';
		walkEditIndex = -1;
	}

	function upsertWalkSchedule() {
		const title = 'Gassi gehen';
		const schedule = {
			id: walkEditIndex >= 0 ? walkSchedules[walkEditIndex]?.id || createLocalId() : createLocalId(),
			title,
			name: title,
			time: walkTime,
			amount: Number(walkDuration) || 0,
			unit: resolveUnit(walkDurationUnit, '')
		};

		if (!schedule.time) {
			draftMessage = 'Bitte eine Gassi-Zeit wählen.';
			return;
		}
		if (schedule.amount <= 0) {
			draftMessage = 'Bitte eine gültige Dauer angeben.';
			return;
		}
		if (!schedule.unit.trim()) {
			draftMessage = 'Bitte eine Dauer-Einheit wählen.';
			return;
		}

		walkSchedules =
			walkEditIndex >= 0
				? walkSchedules.map((item, index) => (index === walkEditIndex ? schedule : item))
				: [...walkSchedules, schedule];
		resetWalkDraft();
		draftMessage = '';
	}

	function editWalkSchedule(index) {
		const schedule = walkSchedules[index];
		if (!schedule) return;
		walkTime = schedule.time || '';
		walkDuration = schedule.amount || 30;
		walkDurationUnit = unitPresetForValue(schedule.unit, walkDurationUnitOptions, 'Minuten');
		walkEditIndex = index;
	}

	function deleteWalkSchedule(index) {
		walkSchedules = walkSchedules.filter((_, current) => current !== index);
		if (walkEditIndex === index) resetWalkDraft();
	}

	function handleDossierFile(event) {
		const file = event.currentTarget.files?.[0];
		draftMessage = '';
		if (!file) return;

		const maxSize = 3 * 1024 * 1024;
		if (file.size > maxSize) {
			draftMessage = 'Bitte maximal 3 MB pro Datei hochladen.';
			event.currentTarget.value = '';
			return;
		}

		const reader = new FileReader();
		reader.onload = () => {
			dossierFileName = file.name;
			dossierFileType = file.type || 'application/octet-stream';
			dossierFileSize = file.size;
			dossierFileData = String(reader.result || '');
		};
		reader.onerror = () => {
			draftMessage = 'Die Datei konnte nicht gelesen werden.';
		};
		reader.readAsDataURL(file);
	}

	function addDossierItem() {
		const title = dossierTitle.trim();
		if (!title || !dossierFileData) {
			draftMessage = 'Bitte einen Titel und eine Datei hinzufügen.';
			return;
		}

		dossierItems = [
			...dossierItems,
			{
				id: createLocalId(),
				title,
				fileName: dossierFileName,
				fileType: dossierFileType,
				fileSize: dossierFileSize,
				data: dossierFileData
			}
		];
		resetDossierDraft();
		draftMessage = '';
	}

	function removeDossierItem(index) {
		dossierItems = dossierItems.filter((_, current) => current !== index);
	}

	async function submitDog() {
		draftMessage = '';
		const validation = validateDogDraft();
		if (validation) {
			draftMessage = validation;
			return;
		}

		isSaving = true;

		try {
			const saved = await onAddDog({
				name: draftName.trim(),
				breed: draftBreed.trim(),
				hint: draftHint.trim(),
				walkSchedules,
				feedingSchedules,
				medicationSchedules,
				dossier: dossierItems
			});

			if (saved?.name) {
				dogName = saved.name;
				isExpanded = false;
				resetDraft();
				draftMessage = `${saved.name} wurde gespeichert.`;
			}
		} catch (error) {
			draftMessage = error instanceof Error ? error.message : 'Hund konnte nicht gespeichert werden.';
		} finally {
			isSaving = false;
		}
	}
</script>

<section class="manager-panel" aria-labelledby="dogs-title">
	<div class="section-heading">
		<div>
			<p class="eyebrow">Konto</p>
			<h2 id="dogs-title">Hunde verwalten</h2>
		</div>
		<div class="header-actions">
			{#if dogs.length > 0}
				<button class="toggle-button" type="button" onclick={() => (isExpanded = !isExpanded)}>
					{isExpanded ? 'Einklappen' : 'Aufklappen'}
				</button>
			{/if}
			<span class="account-pill">{user?.email}</span>
		</div>
	</div>

	{#if successMessage}
		<p class="success-note">{successMessage}</p>
	{/if}
	{#if draftMessage}
		<p class="draft-note">{draftMessage}</p>
	{/if}

	{#if isExpanded || dogs.length === 0}
		<div class="active-row">
			{#if dogs.length === 0}
				<div class="first-dog-note">
					<strong>Noch kein Hund erfasst.</strong>
					<span>Lege deinen ersten Hund an, damit du danach Aktivitäten und Erinnerungen nutzen kannst.</span>
				</div>
			{:else}
				<label>
					Aktiver Hund
					<select bind:value={dogName}>
						{#each dogs as dog}
							<option value={dog.name}>{dog.name}</option>
						{/each}
					</select>
				</label>
			{/if}
		</div>

		<div class="dog-list" aria-label="Gespeicherte Hunde">
			{#each dogs as dog}
				<article class:active={dog.name === dogName}>
					<button type="button" onclick={() => (dogName = dog.name)}>
						<strong>{dog.name}</strong>
						<span>{dog.breed || 'Rasse optional'}</span>
					</button>
					{#if dogs.length > 1}
						<button class="delete-button" type="button" onclick={() => onDeleteDog(dog)}>Löschen</button>
					{/if}
				</article>
			{/each}
		</div>

		{#if activeDog}
			<div class="dossier-preview">
				<div class="section-heading compact">
					<div>
						<p class="eyebrow">Hundedossier</p>
						<h3>{activeDog.name}</h3>
					</div>
					<span class="muted">{activeDog.dossier?.length || 0} Dokumente</span>
				</div>

				{#if activeDog.hint}
					<p class="hint-note">{activeDog.hint}</p>
				{/if}

				<div class="schedule-preview">
					{#each activeDog.feedingSchedules || [] as schedule}
						<span>Futter · {schedule.time} · {displayQuantity(schedule.amount, schedule.unit)}</span>
					{/each}
					{#each activeDog.medicationSchedules || [] as schedule}
						<span>Medikament · {schedule.time} · {displayQuantity(schedule.dose, schedule.unit)}</span>
					{/each}
					{#each activeDog.walkSchedules || [] as schedule}
						<span>Gassi · {schedule.time} · {displayQuantity(schedule.amount, schedule.unit)}</span>
					{/each}
				</div>

				<div class="dossier-grid">
					{#each activeDog.dossier || [] as item}
						<a class="dossier-link" href={item.file?.url} target="_blank" rel="noreferrer">
							<strong>{item.title}</strong>
							<span>{item.file?.name} · {formatFileSize(item.file?.size)}</span>
						</a>
					{/each}
				</div>
			</div>
		{/if}

		<div class="editor-shell">
			<div class="editor-section">
				<div class="section-heading compact">
					<div>
						<p class="eyebrow">Stammdaten</p>
						<h3>Neuen Hund anlegen</h3>
					</div>
					<span class="muted">Pflicht ist nur der Name.</span>
				</div>

				<div class="form-grid">
					<label>
						Hundename *
						<input bind:value={draftName} placeholder="z. B. Milo" />
					</label>
					<label>
						Rasse (optional)
						<input bind:value={draftBreed} placeholder="z. B. Labrador" />
					</label>
				</div>
				<p class="optional-note">Rasse, Futter, Medikamente, Gassi und Dossier sind optional und können später ergänzt werden.</p>
				<label>
					Hinweis (optional)
					<textarea bind:value={draftHint} rows="3" placeholder="z. B. ruhig, sportlich, sensibel"></textarea>
				</label>
			</div>

			<div class="editor-section">
				<div class="section-heading compact">
					<div>
						<p class="eyebrow">Futter</p>
						<h3>Optional</h3>
					</div>
				</div>

				<FoodFields
					bind:title={feedingTitle}
					bind:time={feedingTime}
					bind:amount={feedingAmount}
					bind:unitPreset={feedingUnitPreset}
					bind:unitCustom={feedingUnitCustom}
				/>

				<div class="inline-actions">
					<button class="primary-button" type="button" onclick={upsertFeedingSchedule}>
						{feedingEditIndex >= 0 ? 'Futter aktualisieren' : 'Futter hinzufügen'}
					</button>
					{#if feedingEditIndex >= 0}
						<button class="secondary-button" type="button" onclick={resetFeedingDraft}>Abbrechen</button>
					{/if}
				</div>

				<div class="item-list">
					{#if feedingSchedules.length === 0}
						<div class="empty-state">Noch keine Futter-Routine hinterlegt.</div>
					{:else}
						{#each feedingSchedules as schedule, index}
							<div class="item-row">
								<div>
									<strong>{schedule.title || schedule.name || 'Futter'}</strong>
									<span>{schedule.time} · {displayQuantity(schedule.amount, schedule.unit)}</span>
								</div>
								<div class="item-actions">
									<button type="button" onclick={() => editFeedingSchedule(index)}>Bearbeiten</button>
									<button type="button" onclick={() => deleteFeedingSchedule(index)}>Löschen</button>
								</div>
							</div>
						{/each}
					{/if}
				</div>
			</div>

			<div class="editor-section">
				<div class="section-heading compact">
					<div>
						<p class="eyebrow">Medikamente</p>
						<h3>Optional</h3>
					</div>
				</div>

				<MedicationFields
					bind:title={medicationTitle}
					bind:time={medicationTime}
					bind:amount={medicationDose}
					bind:unitPreset={medicationUnitPreset}
					bind:unitCustom={medicationUnitCustom}
				/>

				<div class="inline-actions">
					<button class="primary-button" type="button" onclick={upsertMedicationSchedule}>
						{medicationEditIndex >= 0 ? 'Medikament aktualisieren' : 'Medikament hinzufügen'}
					</button>
					{#if medicationEditIndex >= 0}
						<button class="secondary-button" type="button" onclick={resetMedicationDraft}>Abbrechen</button>
					{/if}
				</div>

				<div class="item-list">
					{#if medicationSchedules.length === 0}
						<div class="empty-state">Noch keine Medikamenten-Routine hinterlegt.</div>
					{:else}
						{#each medicationSchedules as schedule, index}
							<div class="item-row">
								<div>
									<strong>{schedule.title || schedule.name || 'Medikament'}</strong>
									<span>{schedule.time} · {displayQuantity(schedule.dose, schedule.unit)}</span>
								</div>
								<div class="item-actions">
									<button type="button" onclick={() => editMedicationSchedule(index)}>Bearbeiten</button>
									<button type="button" onclick={() => deleteMedicationSchedule(index)}>Löschen</button>
								</div>
							</div>
						{/each}
					{/if}
				</div>
			</div>

			<div class="editor-section">
				<div class="section-heading compact">
					<div>
						<p class="eyebrow">Gassi</p>
						<h3>Optional</h3>
					</div>
				</div>

				<WalkFields
					bind:time={walkTime}
					bind:amount={walkDuration}
					bind:unitPreset={walkDurationUnit}
					timeLabel="Gassi-Zeit"
					amountLabel="Dauer"
					unitLabel="Dauer-Einheit"
				/>

				<div class="inline-actions">
					<button class="primary-button" type="button" onclick={upsertWalkSchedule}>
						{walkEditIndex >= 0 ? 'Gassi aktualisieren' : 'Gassi hinzufügen'}
					</button>
					{#if walkEditIndex >= 0}
						<button class="secondary-button" type="button" onclick={resetWalkDraft}>Abbrechen</button>
					{/if}
				</div>

				<div class="item-list">
					{#if walkSchedules.length === 0}
						<div class="empty-state">Noch keine Gassi-Zeiten hinterlegt.</div>
					{:else}
						{#each walkSchedules as schedule, index}
							<div class="item-row">
								<div>
									<strong>{schedule.title || 'Gassi gehen'}</strong>
									<span>{schedule.time} · {displayQuantity(schedule.amount, schedule.unit)}</span>
								</div>
								<div class="item-actions">
									<button type="button" onclick={() => editWalkSchedule(index)}>Bearbeiten</button>
									<button type="button" onclick={() => deleteWalkSchedule(index)}>Löschen</button>
								</div>
							</div>
						{/each}
					{/if}
				</div>
			</div>

			<div class="editor-section">
				<div class="section-heading compact">
					<div>
						<p class="eyebrow">Dossier</p>
						<h3>Optional</h3>
					</div>
				</div>

				<div class="form-grid">
					<label>
						Titel
						<input bind:value={dossierTitle} placeholder="z. B. Impfpass" />
					</label>
					<label>
						Datei
						<input
							type="file"
							accept="image/*,.pdf,.txt,.doc,.docx"
							onchange={handleDossierFile}
						/>
					</label>
				</div>

				{#if dossierFileName}
					<div class="file-chip">
						<strong>{dossierFileName}</strong>
						<span>{dossierFileType || 'Datei'} · {formatFileSize(dossierFileSize)}</span>
					</div>
				{/if}

				<div class="inline-actions">
					<button class="primary-button" type="button" onclick={addDossierItem}>Dossier-Eintrag hinzufügen</button>
					{#if dossierItems.length > 0}
						<button class="secondary-button" type="button" onclick={resetDossierDraft}>Datei entfernen</button>
					{/if}
				</div>

				<div class="item-list">
					{#if dossierItems.length === 0}
						<div class="empty-state">Noch keine Dossier-Datei ausgewählt.</div>
					{:else}
						{#each dossierItems as item, index}
							<div class="item-row">
								<div>
									<strong>{item.title}</strong>
									<span>{item.fileName} · {formatFileSize(item.fileSize)}</span>
								</div>
								<button type="button" onclick={() => removeDossierItem(index)}>Löschen</button>
							</div>
						{/each}
					{/if}
				</div>
			</div>
		</div>

		<div class="save-row">
			<button class="primary-button save-button" type="button" disabled={isSaving} onclick={submitDog}>
				{isSaving ? 'Speichert...' : 'Hund speichern'}
			</button>
		</div>
	{:else}
		<div class="collapsed-shell">
			<div>
				<p class="eyebrow">Hunde verwalten</p>
				<h2>{activeDog ? activeDog.name : 'Deine Hunde'}</h2>
				<p>
					{dogs.length} Hund{dogs.length === 1 ? '' : 'e'} gespeichert. Rasse, Futter, Medikamente, Gassi und Dossier
					sind optional.
				</p>
			</div>
			<div class="collapsed-actions">
				<span class="muted">
					{activeDog?.feedingSchedules?.length || 0} Futter · {activeDog?.medicationSchedules?.length || 0}
					Medikamente · {activeDog?.walkSchedules?.length || 0} Gassi
				</span>
				<button class="secondary-button" type="button" onclick={() => (isExpanded = true)}>Aufklappen</button>
			</div>
		</div>
	{/if}
</section>

<style>
	.manager-panel {
		display: grid;
		gap: 16px;
		border: 1px solid #dfe4dd;
		border-radius: 16px;
		background: rgba(255, 255, 255, 0.96);
		box-shadow: 0 16px 40px rgba(16, 24, 40, 0.08);
		padding: 18px;
		margin-top: 14px;
	}

	.section-heading {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 12px;
	}

	.section-heading.compact {
		align-items: center;
	}

	.eyebrow {
		margin: 0 0 4px;
		color: #2c6f67;
		font-size: 0.72rem;
		font-weight: 850;
		letter-spacing: 0;
		text-transform: uppercase;
	}

	h2,
	h3,
	p {
		margin: 0;
	}

	h2 {
		font-size: 1.18rem;
		line-height: 1.2;
	}

	h3 {
		font-size: 1rem;
		line-height: 1.25;
	}

	.account-pill {
		max-width: min(220px, 100%);
		overflow: hidden;
		border-radius: 999px;
		background: #eef6f3;
		color: #1f5f57;
		padding: 7px 10px;
		font-size: 0.72rem;
		font-weight: 800;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.header-actions {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		min-width: 0;
		max-width: 100%;
		flex-wrap: wrap;
		gap: 8px;
	}

	.toggle-button {
		border: 1px solid #d6dfd8;
		border-radius: 999px;
		background: #f7faf8;
		color: #1f5f57;
		padding: 8px 12px;
		font-weight: 850;
	}

	.success-note,
	.draft-note,
	.first-dog-note,
	.hint-note,
	.file-chip,
	.dossier-link,
	.dossier-preview,
	.editor-section {
		border-radius: 14px;
	}

	.success-note,
	.draft-note {
		padding: 10px 12px;
		font-size: 0.86rem;
		font-weight: 700;
	}

	.success-note {
		background: #eef6f3;
		color: #1f5f57;
	}

	.draft-note {
		background: #fff4e6;
		color: #86532d;
	}

	.active-row {
		display: grid;
		gap: 10px;
	}

	.first-dog-note {
		border: 1px dashed #c8d8d2;
		background: #fafcfb;
		padding: 14px;
		display: grid;
		gap: 4px;
	}

	.optional-note {
		border-radius: 12px;
		background: #f6faf8;
		color: #5d6e64;
		padding: 10px 12px;
		font-size: 0.83rem;
		line-height: 1.35;
	}

	.collapsed-shell {
		border: 1px solid #dfe4dd;
		border-radius: 16px;
		background: #f8fbf9;
		padding: 16px;
		display: grid;
		gap: 14px;
	}

	.collapsed-shell h2 {
		font-size: 1.08rem;
		margin-top: 4px;
	}

	.collapsed-shell p {
		color: #5d6e64;
		font-size: 0.88rem;
		line-height: 1.4;
	}

	.collapsed-actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		flex-wrap: wrap;
	}

	.dog-list {
		display: grid;
		gap: 8px;
	}

	.dog-list article {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: center;
		gap: 10px;
		border: 1px solid #dfe4dd;
		border-radius: 14px;
		background: #ffffff;
		padding: 10px 12px;
	}

	.dog-list article.active {
		border-color: #2c6f67;
		background: #f3faf8;
	}

	.dog-list button {
		border: 0;
		background: transparent;
		text-align: left;
		padding: 0;
	}

	strong,
	span {
		display: block;
	}

	strong {
		color: #111827;
	}

	span {
		margin-top: 2px;
		color: #6b7280;
		font-size: 0.84rem;
		line-height: 1.3;
	}

	.dossier-preview {
		border: 1px solid #dfe4dd;
		background: #fbfcfb;
		padding: 14px;
		display: grid;
		gap: 12px;
	}

	.muted {
		color: #6b7280;
		font-size: 0.82rem;
	}

	.schedule-preview {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.schedule-preview span {
		border-radius: 999px;
		background: #eaf2ef;
		color: #1f5f57;
		padding: 7px 10px;
		font-size: 0.78rem;
		font-weight: 750;
	}

	.dossier-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 8px;
	}

	.dossier-link {
		display: grid;
		gap: 4px;
		border: 1px solid #dfe4dd;
		background: #ffffff;
		color: inherit;
		padding: 10px 12px;
		text-decoration: none;
	}

	.dossier-link span,
	.file-chip span {
		color: #6b7280;
		font-size: 0.78rem;
	}

	.editor-shell {
		display: grid;
		gap: 12px;
	}

	.editor-section {
		border: 1px solid #e5e8e3;
		background: #fdfdfd;
		padding: 14px;
		display: grid;
		gap: 12px;
	}

	.form-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 10px;
	}

	label {
		display: grid;
		gap: 7px;
		color: #111827;
		font-size: 0.88rem;
		font-weight: 800;
	}

	input,
	select,
	textarea {
		width: 100%;
		border: 1px solid #dfe4dd;
		border-radius: 12px;
		background: #ffffff;
		color: #111827;
		padding: 12px;
		outline: none;
	}

	textarea {
		resize: vertical;
	}

	input:focus,
	select:focus,
	textarea:focus {
		border-color: #2c6f67;
		box-shadow: 0 0 0 3px rgba(44, 111, 103, 0.12);
	}

	.inline-actions,
	.save-row,
	.item-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.primary-button,
	.secondary-button,
	.delete-button,
	.item-actions button,
	.save-button {
		min-height: 44px;
		border: 0;
		border-radius: 12px;
		padding: 0 14px;
		font-weight: 850;
	}

	.primary-button,
	.save-button {
		background: #2c6f67;
		color: white;
	}

	.primary-button:disabled,
	.save-button:disabled {
		opacity: 0.65;
		cursor: wait;
	}

	.secondary-button {
		background: #eef2ed;
		color: #111827;
	}

	.item-list {
		display: grid;
		gap: 8px;
	}

	.item-row {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: center;
		gap: 10px;
		border: 1px solid #e5e8e3;
		border-radius: 12px;
		background: #ffffff;
		padding: 10px 12px;
	}

	.item-row button {
		border: 0;
		background: transparent;
		color: #2c6f67;
		font-weight: 800;
		padding: 0;
	}

	.file-chip {
		display: grid;
		gap: 3px;
		border: 1px solid #e5e8e3;
		background: #ffffff;
		padding: 10px 12px;
	}

	.save-row {
		justify-content: flex-end;
	}

	@media (max-width: 720px) {
		.section-heading {
			flex-wrap: wrap;
		}

		.header-actions {
			width: 100%;
			justify-content: flex-start;
		}

		.collapsed-actions {
			display: grid;
			grid-template-columns: 1fr;
			justify-items: start;
		}

		.form-grid {
			grid-template-columns: 1fr;
		}

		.section-heading,
		.dog-list article,
		.item-row {
			grid-template-columns: 1fr;
		}
	}
</style>
