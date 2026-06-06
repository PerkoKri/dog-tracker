<script>
	import FoodFields from '$lib/components/fields/FoodFields.svelte';
	import MedicationFields from '$lib/components/fields/MedicationFields.svelte';
	import WalkFields from '$lib/components/fields/WalkFields.svelte';
	import { routineDefaults } from '$lib/forms/routine-fields.js';

	let {
		reminders = [],
		dogs = [],
		notificationPermission = 'default',
		reminderDogName = $bindable(''),
		reminderType = $bindable('Allgemein'),
		reminderTitle = $bindable(''),
		reminderDate = $bindable(''),
		reminderTime = $bindable(''),
		reminderAmount = $bindable(1),
		reminderUnitPreset = $bindable('Minuten'),
		reminderUnitCustom = $bindable(''),
		reminderNote = $bindable(''),
		reminderVetClinic = $bindable(''),
		reminderRecurrence = $bindable('once'),
		message = '',
		formatReminder,
		onAddReminder,
		onCompleteReminder,
		onDeleteReminder,
		onRequestNotifications
	} = $props();

	const reminderTypes = ['Allgemein', 'Futter', 'Medikament', 'Arzt', 'Gassi', 'Pflege', 'Andere'];
	const reminderTypeHints = {
		Allgemein: 'Aufgaben ohne feste Hund-Zuordnung.',
		Andere: 'Individuelle oder einmalige Einträge.',
		Futter: 'Titel, Uhrzeit, Menge und Einheit.',
		Medikament: 'Name, Uhrzeit, Dosis und Einheit.',
		Arzt: 'Tierarzttermine oder Kontrollen.',
		Gassi: 'Uhrzeit, Dauer und Dauer-Einheit.',
		Pflege: 'Fellpflege, Baden oder Krallen schneiden.'
	};

	let selectedDate = $state(todayDate());
	let monthAnchor = $state(startOfMonth(todayDate()));

	let openReminders = $derived(reminders.filter((reminder) => !reminder.completed));
	let selectedDayReminders = $derived(openReminders.filter((reminder) => reminder.date === selectedDate));
	let todayReminders = $derived(openReminders.filter((reminder) => reminder.date === todayDate()));
	let routineReminders = $derived(openReminders.filter((reminder) => reminder.recurrence === 'daily'));
	let generalReminders = $derived(
		openReminders.filter((reminder) => ['Allgemein', 'Andere'].includes(reminder.type))
	);
	let monthLabel = $derived(formatMonthLabel(monthAnchor));
	let calendarDays = $derived(buildMonthDays(monthAnchor, reminders, selectedDate));

	function todayDate() {
		return new Date().toISOString().slice(0, 10);
	}

	function toDate(value) {
		return new Date(`${value || todayDate()}T12:00:00`);
	}

	function startOfMonth(value) {
		const date = toDate(value);
		date.setDate(1);
		return date.toISOString().slice(0, 10);
	}

	function addMonths(value, offset) {
		const date = toDate(value);
		date.setMonth(date.getMonth() + offset);
		date.setDate(1);
		return date.toISOString().slice(0, 10);
	}

	function sameDate(left, right) {
		return String(left || '').slice(0, 10) === String(right || '').slice(0, 10);
	}

	function formatMonthLabel(value) {
		return new Intl.DateTimeFormat('de-CH', { month: 'long', year: 'numeric' }).format(toDate(value));
	}

	function buildMonthDays(anchor, allReminders, selected) {
		const monthStart = toDate(startOfMonth(anchor));
		const weekdayOffset = (monthStart.getDay() + 6) % 7;
		monthStart.setDate(monthStart.getDate() - weekdayOffset);

		return Array.from({ length: 42 }, (_, index) => {
			const date = new Date(monthStart);
			date.setDate(monthStart.getDate() + index);
			const dateString = date.toISOString().slice(0, 10);
			const dayReminders = allReminders.filter(
				(reminder) => sameDate(reminder.date, dateString) && !reminder.completed
			);

			return {
				date: dateString,
				number: date.getDate(),
				inMonth: date.getMonth() === toDate(anchor).getMonth(),
				isToday: sameDate(dateString, todayDate()),
				isSelected: sameDate(dateString, selected),
				count: dayReminders.length
			};
		});
	}

	function selectDate(date) {
		selectedDate = date;
		reminderDate = date;
		monthAnchor = startOfMonth(date);
	}

	function changeMonth(offset) {
		monthAnchor = addMonths(monthAnchor, offset);
	}

	function setReminderType(nextType) {
		reminderType = nextType;
		if (['Allgemein', 'Andere'].includes(nextType)) {
			reminderDogName = '';
		} else if (!reminderDogName && dogs[0]) {
			reminderDogName = dogs[0].name;
		}

		if (nextType === 'Futter') {
			reminderTitle = '';
			reminderAmount = routineDefaults.Futter.amount;
			reminderUnitPreset = routineDefaults.Futter.unitPreset;
			reminderUnitCustom = '';
		} else if (nextType === 'Medikament') {
			reminderTitle = '';
			reminderAmount = routineDefaults.Medikament.amount;
			reminderUnitPreset = routineDefaults.Medikament.unitPreset;
			reminderUnitCustom = '';
		} else if (nextType === 'Gassi') {
			reminderTitle = '';
			reminderAmount = routineDefaults.Gassi.amount;
			reminderUnitPreset = routineDefaults.Gassi.unitPreset;
			reminderUnitCustom = '';
		}
	}
</script>

<section class="planner-panel" aria-labelledby="planner-title">
	<div class="section-heading">
		<div>
			<p class="eyebrow">Planer</p>
			<h2 id="planner-title">Kalender, Aufgaben und Routinen</h2>
		</div>
		<button class="ghost-button" type="button" onclick={onRequestNotifications}>
			{notificationPermission === 'granted' ? 'Erinnerung aktiv' : 'Erinnerung aktivieren'}
		</button>
	</div>

	{#if message}
		<p class="success-note">{message}</p>
	{/if}

	<div class="summary-grid">
		<article>
			<span>Heute offen</span>
			<strong>{todayReminders.length}</strong>
		</article>
		<article>
			<span>Gewählter Tag</span>
			<strong>{selectedDayReminders.length}</strong>
		</article>
		<article>
			<span>Routinen</span>
			<strong>{routineReminders.length}</strong>
		</article>
		<article>
			<span>Allgemein</span>
			<strong>{generalReminders.length}</strong>
		</article>
	</div>

	<section class="calendar-panel" aria-labelledby="calendar-title">
		<div class="panel-heading">
			<div>
				<p class="eyebrow">Kalender</p>
				<h3 id="calendar-title">{monthLabel}</h3>
			</div>
			<div class="month-actions">
				<button type="button" onclick={() => changeMonth(-1)}>Zurück</button>
				<button type="button" onclick={() => selectDate(todayDate())}>Heute</button>
				<button type="button" onclick={() => changeMonth(1)}>Weiter</button>
			</div>
		</div>

		<div class="weekday-row" aria-hidden="true">
			<span>Mo</span>
			<span>Di</span>
			<span>Mi</span>
			<span>Do</span>
			<span>Fr</span>
			<span>Sa</span>
			<span>So</span>
		</div>

		<div class="calendar-grid" aria-label="Monatskalender">
			{#each calendarDays as day}
				<button
					class:active={day.isSelected}
					class:today={day.isToday}
					class:outside={!day.inMonth}
					type="button"
					onclick={() => selectDate(day.date)}
				>
					<strong>{day.number}</strong>
					<span>{day.count}</span>
				</button>
			{/each}
		</div>
	</section>

	<section class="day-panel" aria-labelledby="day-title">
		<div class="panel-heading">
			<div>
				<p class="eyebrow">Tagesansicht</p>
				<h3 id="day-title">
					{new Intl.DateTimeFormat('de-CH', { weekday: 'long', day: '2-digit', month: 'long' }).format(
						toDate(selectedDate)
					)}
				</h3>
			</div>
			<span class="muted">Kalenderauswahl</span>
		</div>

		<div class="task-list" aria-label="Aufgaben für den gewählten Tag">
			{#if selectedDayReminders.length === 0}
				<div class="empty-state">Für diesen Tag sind keine Aufgaben geplant.</div>
			{:else}
				{#each selectedDayReminders as reminder}
					<article class:due={reminder.isDue}>
						<div class="task-copy">
							<strong>{reminder.title}</strong>
							<span>{formatReminder(reminder)}</span>
							{#if reminder.note}
								<small>{reminder.note}</small>
							{/if}
						</div>
						<div class="task-actions">
							<button type="button" onclick={() => onCompleteReminder(reminder)}>Erledigt</button>
							<button type="button" onclick={() => onDeleteReminder(reminder)}>×</button>
						</div>
					</article>
				{/each}
			{/if}
		</div>

		<div class="routine-block">
			<div class="panel-heading compact">
				<div>
					<p class="eyebrow">Routinen</p>
					<h3>Wiederkehrende Aufgaben</h3>
				</div>
			</div>
			<div class="compact-list">
				{#if routineReminders.length === 0}
					<span class="muted">Noch keine Routinen geplant.</span>
				{:else}
					{#each routineReminders.slice(0, 5) as reminder}
						<div class="compact-item">
							<div>
								<strong>{reminder.title}</strong>
								<span>{formatReminder(reminder)}</span>
							</div>
							<button type="button" onclick={() => onCompleteReminder(reminder)}>Erledigt</button>
						</div>
					{/each}
				{/if}
			</div>
		</div>
	</section>

	<section class="task-editor" aria-labelledby="task-editor-title">
		<div class="panel-heading">
			<div>
				<p class="eyebrow">Neue Aufgabe</p>
				<h3 id="task-editor-title">Eintrag für einen bestimmten Tag</h3>
			</div>
			<span class="muted">{dogs.length > 0 ? `${dogs.length} Hunde verfügbar` : 'Ohne Hund möglich'}</span>
		</div>

		<form
			class="task-form"
			onsubmit={(event) => {
				event.preventDefault();
				onAddReminder();
			}}
		>
			<div class="form-grid">
				<label>
					Kategorie
					<select bind:value={reminderType} onchange={(event) => setReminderType(event.currentTarget.value)}>
						{#each reminderTypes as type}
							<option value={type}>{type}</option>
						{/each}
					</select>
				</label>
				<label>
					Hund
					<select bind:value={reminderDogName}>
						<option value="">Ohne Hund</option>
						{#each dogs as dog}
							<option value={dog.name}>{dog.name}</option>
						{/each}
					</select>
				</label>
				{#if !['Futter', 'Medikament', 'Gassi'].includes(reminderType)}
					<label class="span-2">
						Titel
						<input bind:value={reminderTitle} placeholder="z. B. Fell bürsten oder Tierarzt anrufen" />
					</label>
				{/if}
				<label>
					Datum
					<input
						type="date"
						bind:value={reminderDate}
						onchange={(event) => selectDate(event.currentTarget.value || todayDate())}
					/>
				</label>
				{#if !['Futter', 'Medikament', 'Gassi'].includes(reminderType)}
					<label>
						Zeit
						<input type="time" bind:value={reminderTime} />
					</label>
				{/if}
			</div>

			<div class="helper-row">
				<span>{reminderTypeHints[reminderType] || ''}</span>
				{#if reminderType === 'Allgemein' || reminderType === 'Andere'}
					<span>Ohne Hund-Zuordnung möglich.</span>
				{:else}
					<span>Mit Hund-Zuordnung am besten vorplanen.</span>
				{/if}
			</div>

			{#if reminderType === 'Futter'}
				<FoodFields
					bind:title={reminderTitle}
					bind:time={reminderTime}
					bind:amount={reminderAmount}
					bind:unitPreset={reminderUnitPreset}
					bind:unitCustom={reminderUnitCustom}
				/>
			{:else if reminderType === 'Medikament'}
				<MedicationFields
					bind:title={reminderTitle}
					bind:time={reminderTime}
					bind:amount={reminderAmount}
					bind:unitPreset={reminderUnitPreset}
					bind:unitCustom={reminderUnitCustom}
				/>
			{:else if reminderType === 'Gassi'}
				<WalkFields bind:time={reminderTime} bind:amount={reminderAmount} bind:unitPreset={reminderUnitPreset} />
			{:else if reminderType === 'Arzt'}
				<div class="form-grid">
					<label class="span-2">
						Tierarzt / Ort
						<input bind:value={reminderVetClinic} placeholder="z. B. Hautkontrolle" />
					</label>
				</div>
			{/if}

			<label>
				Beschreibung / Notiz
				<textarea bind:value={reminderNote} rows="3" placeholder="optional"></textarea>
			</label>

			<label>
				Wiederholung
				<select bind:value={reminderRecurrence}>
					<option value="once">Einmalig</option>
					<option value="daily">Täglich nach Erledigung neu planen</option>
				</select>
			</label>

			<button class="primary-button" type="submit">Aufgabe speichern</button>
		</form>
	</section>

	<section class="all-tasks" aria-labelledby="all-tasks-title">
		<div class="panel-heading">
			<div>
				<p class="eyebrow">Aufgaben</p>
				<h3 id="all-tasks-title">Alle offenen Einträge</h3>
			</div>
			<span class="muted">{openReminders.length} offen</span>
		</div>

		<div class="compact-list">
			{#if openReminders.length === 0}
				<div class="empty-state">Im Moment sind keine offenen Einträge vorhanden.</div>
			{:else}
				{#each openReminders.slice(0, 10) as reminder}
					<div class="compact-item">
						<div>
							<strong>{reminder.title}</strong>
							<span>{formatReminder(reminder)}</span>
						</div>
						<div class="task-actions">
							<button type="button" onclick={() => onCompleteReminder(reminder)}>Erledigt</button>
							<button type="button" onclick={() => onDeleteReminder(reminder)}>×</button>
						</div>
					</div>
				{/each}
			{/if}
		</div>
	</section>
</section>

<style>
	.planner-panel {
		display: grid;
		gap: 16px;
		border: 1px solid #dfe4dd;
		border-radius: 16px;
		background: rgba(255, 255, 255, 0.96);
		box-shadow: 0 16px 40px rgba(16, 24, 40, 0.08);
		padding: 18px;
		margin-top: 14px;
	}

	.section-heading,
	.panel-heading {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 12px;
	}

	.panel-heading.compact {
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
		font-size: 1.2rem;
		line-height: 1.2;
	}

	h3 {
		font-size: 1rem;
		line-height: 1.2;
	}

	.ghost-button {
		border: 1px solid #d6dfd8;
		background: #f7faf8;
		color: #1f5f57;
		border-radius: 999px;
		padding: 9px 12px;
		font-weight: 850;
	}

	.success-note {
		border-radius: 12px;
		background: #eef6f3;
		color: #1f5f57;
		padding: 10px 12px;
		font-size: 0.86rem;
		font-weight: 700;
	}

	.summary-grid {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 10px;
	}

	.summary-grid article {
		border: 1px solid #e5e8e3;
		border-radius: 14px;
		background: #ffffff;
		padding: 12px;
	}

	.summary-grid span,
	.weekday-row span,
	.calendar-grid span,
	.task-copy span,
	.task-copy small,
	.compact-item span,
	.muted,
	.helper-row span {
		display: block;
		color: #6b7280;
		font-size: 0.78rem;
		line-height: 1.25;
	}

	.summary-grid strong {
		display: block;
		margin-top: 8px;
		font-size: 1.25rem;
	}

	.calendar-panel,
	.day-panel,
	.task-editor,
	.all-tasks {
		border: 1px solid #e5e8e3;
		border-radius: 16px;
		background: #ffffff;
		padding: 14px;
		display: grid;
		gap: 12px;
	}

	.month-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.month-actions button,
	.compact-item > button,
	.task-actions button,
	.primary-button {
		min-height: 40px;
		border: 0;
		border-radius: 12px;
		padding: 0 12px;
		font-weight: 850;
	}

	.month-actions button,
	.compact-item > button,
	.task-actions button {
		background: #eef2ed;
		color: #111827;
	}

	.weekday-row {
		display: grid;
		grid-template-columns: repeat(7, minmax(0, 1fr));
		gap: 8px;
	}

	.weekday-row span {
		text-align: center;
		font-size: 0.72rem;
		font-weight: 750;
		text-transform: uppercase;
	}

	.calendar-grid {
		display: grid;
		grid-template-columns: repeat(7, minmax(0, 1fr));
		gap: 8px;
	}

	.calendar-grid button {
		min-height: 104px;
		display: grid;
		align-content: start;
		gap: 6px;
		border: 1px solid #e5e8e3;
		border-radius: 14px;
		background: #ffffff;
		padding: 10px;
		text-align: left;
	}

	.calendar-grid button.outside {
		opacity: 0.45;
	}

	.calendar-grid button.today {
		border-color: #a9cfc8;
		background: #f3faf8;
	}

	.calendar-grid button.active {
		border-color: #2c6f67;
		box-shadow: 0 0 0 3px rgba(44, 111, 103, 0.08);
	}

	.task-list,
	.compact-list {
		display: grid;
		gap: 10px;
	}

	.task-list article,
	.compact-item {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 10px;
		border: 1px solid #e5e8e3;
		border-radius: 14px;
		background: #ffffff;
		padding: 12px;
	}

	.task-list article.due {
		border-color: #c96d3d;
		background: #fff7f1;
	}

	.task-copy,
	.compact-item > div:first-child {
		display: grid;
		gap: 4px;
		min-width: 0;
	}

	.task-actions {
		display: flex;
		align-items: flex-start;
		gap: 8px;
	}

	.task-actions button:last-child {
		width: 44px;
		padding: 0;
	}

	.routine-block {
		display: grid;
		gap: 10px;
	}

	.task-form {
		display: grid;
		gap: 12px;
	}

	.form-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 10px;
	}

	.span-2 {
		grid-column: span 2;
	}

	label {
		display: grid;
		gap: 7px;
		color: #111827;
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
		color: #111827;
		padding: 12px;
		outline: none;
	}

	input:focus,
	select:focus,
	textarea:focus {
		border-color: #2c6f67;
		box-shadow: 0 0 0 3px rgba(44, 111, 103, 0.12);
	}

	textarea {
		resize: vertical;
	}

	.helper-row {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 8px;
		border: 1px dashed #d6dfd8;
		border-radius: 12px;
		background: #fafcfb;
		padding: 10px 12px;
	}

	.primary-button {
		background: #2c6f67;
		color: white;
	}

	.empty-state {
		border: 1px dashed #d6dfd8;
		border-radius: 14px;
		background: #fafcfb;
		color: #6b7280;
		padding: 14px;
		text-align: center;
	}

	@media (max-width: 920px) {
		.summary-grid {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 640px) {
		.calendar-panel .panel-heading {
			display: grid;
			grid-template-columns: 1fr;
		}

		.month-actions {
			display: grid;
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}

		.form-grid {
			grid-template-columns: 1fr;
		}

		.span-2 {
			grid-column: auto;
		}

		.task-list article,
		.compact-item {
			grid-template-columns: 1fr;
		}

		.compact-item > button,
		.task-actions {
			width: fit-content;
		}
	}
</style>
