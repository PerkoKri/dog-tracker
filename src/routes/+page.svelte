<script>
	import { onMount } from 'svelte';
	import AuthPanel from '$lib/components/AuthPanel.svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import Dashboard from '$lib/components/Dashboard.svelte';
	import DogManager from '$lib/components/DogManager.svelte';
	import EntryForm from '$lib/components/EntryForm.svelte';
	import PlannerPanel from '$lib/components/PlannerPanel.svelte';
	import Timeline from '$lib/components/Timeline.svelte';
	import {
		displayQuantity,
		durationToMinutes,
		resolveUnitValue,
		routineDefaults,
		unitPresetForValue,
		walkDurationUnitOptions
	} from '$lib/forms/routine-fields.js';

	const authStorageKey = 'dogtracker-auth';

	let activities = $state([]);
	let dogs = $state([]);
	let reminders = $state([]);
	let user = $state(null);
	let token = $state('');
	let authMode = $state('login');
	let authName = $state('');
	let authEmail = $state('');
	let authPassword = $state('');
	let authPasswordConfirm = $state('');
	let authMessage = $state('');
	let isAuthenticating = $state(false);
	let currentStep = $state(1);
	let dogName = $state('');
	let type = $state('Gassi');
	let amount = $state(25);
	let activityDate = $state('');
	let time = $state('');
	let note = $state('');
	let routineTitle = $state('');
	let routineUnitPreset = $state('Minuten');
	let routineUnitCustom = $state('');
	let careType = $state('Fellpflege');
	let vetReason = $state('');
	let vetClinic = $state('');
	let attachmentName = $state('');
	let attachmentType = $state('');
	let attachmentData = $state('');
	let attachmentSize = $state(0);
	let reminderDogName = $state('');
	let reminderType = $state('Allgemein');
	let reminderTitle = $state('');
	let reminderDate = $state('');
	let reminderTime = $state('08:00');
	let reminderAmount = $state(1);
	let reminderUnitPreset = $state('Minuten');
	let reminderUnitCustom = $state('');
	let reminderNote = $state('');
	let reminderVetClinic = $state('');
	let reminderRecurrence = $state('once');
	let reminderMessage = $state('');
	let notificationPermission = $state('default');
	let now = $state(Date.now());
	let notifiedReminderIds = $state(new Set());
	let isLoading = $state(true);
	let isSaving = $state(false);
	let activeView = $state('home');
	let statusMessage = $state('');
	let dogMessage = $state('');
	let entryMessage = $state('');

	let sortedActivities = $derived([...activities].sort((a, b) => b.createdAt - a.createdAt));
	let sortedReminders = $derived(
		[...reminders]
			.map((reminder) => ({ ...reminder, isDue: isReminderDue(reminder) }))
			.sort(compareReminders)
	);
	let dueReminders = $derived(sortedReminders.filter((reminder) => !reminder.completed && reminder.isDue));
	let upcomingReminders = $derived(sortedReminders.filter((reminder) => !reminder.completed).slice(0, 5));
	let selectedDogActivities = $derived(activities.filter((activity) => activity.dogName === dogName));
	let walkMinutes = $derived(
		selectedDogActivities
			.filter((activity) => activity.type === 'Gassi')
			.reduce((sum, activity) => sum + durationToMinutes(activity.amount, activity.unit), 0)
	);
	let foodCount = $derived(selectedDogActivities.filter((activity) => activity.type === 'Futter').length);
	let latestActivity = $derived([...selectedDogActivities].sort((a, b) => b.createdAt - a.createdAt)[0]);

	onMount(async () => {
		activityDate = todayDate();
		reminderDate = todayDate();
		time = new Date().toTimeString().slice(0, 5);
		notificationPermission =
			typeof Notification === 'undefined' ? 'unsupported' : Notification.permission;
		const savedAuth = localStorage.getItem(authStorageKey);
		if (savedAuth) {
			try {
				const parsed = JSON.parse(savedAuth);
				user = parsed.user;
				token = parsed.token;
			} catch {
				localStorage.removeItem(authStorageKey);
			}
		}

		if (token) {
			restoreNotifiedReminders();
			await loadDogs();
			await loadActivities();
			await loadReminders();
		} else {
			isLoading = false;
		}

		const interval = setInterval(() => {
			now = Date.now();
			notifyDueReminders();
		}, 30000);

		return () => clearInterval(interval);
	});

	function authHeaders() {
		return {
			Authorization: `Bearer ${token}`
		};
	}

	function activityStorageKey() {
		return user?.id ? `dogtracker-activities-${user.id}` : 'dogtracker-activities';
	}

	function createLocalId() {
		return typeof crypto !== 'undefined' && 'randomUUID' in crypto
			? crypto.randomUUID()
			: Math.random().toString(36).slice(2, 10);
	}

	function normalizeTime(value) {
		return typeof value === 'string' && /^\d{2}:\d{2}$/.test(value) ? value : '';
	}

	function normalizePositiveAmount(value, fallback = 0) {
		const numeric = Number(value);
		return Number.isFinite(numeric) && numeric > 0 ? numeric : fallback;
	}

	function normalizeDogRecord(dog) {
		const feedingSchedules = Array.isArray(dog.feedingSchedules) && dog.feedingSchedules.length
			? dog.feedingSchedules
					.map((schedule) => ({
						id: schedule?.id || createLocalId(),
						title: schedule?.title || schedule?.name || '',
						name: schedule?.name || schedule?.title || '',
						time: normalizeTime(schedule?.time),
						amount: normalizePositiveAmount(schedule?.amount),
						unit: schedule?.unit || 'Portion'
					}))
					.filter((schedule) => schedule.time && schedule.amount > 0)
			: dog.feedingTime && Number(dog.feedingAmount) > 0
				? [
						{
							id: createLocalId(),
							title: dog.feedingTitle || dog.feedingName || '',
							name: dog.feedingName || dog.feedingTitle || '',
							time: normalizeTime(dog.feedingTime),
							amount: normalizePositiveAmount(dog.feedingAmount),
							unit: dog.feedingUnit || 'Portion'
						}
					]
				: [];

		const medicationSchedules = Array.isArray(dog.medicationSchedules) && dog.medicationSchedules.length
			? dog.medicationSchedules
					.map((schedule) => ({
						id: schedule?.id || createLocalId(),
						title: schedule?.title || schedule?.name || '',
						name: schedule?.name || schedule?.title || '',
						time: normalizeTime(schedule?.time),
						dose: normalizePositiveAmount(schedule?.dose, 1),
						unit: schedule?.unit || 'Stück'
					}))
					.filter((schedule) => schedule.title && schedule.time && schedule.dose > 0)
			: dog.medicationName && dog.medicationTime
				? [
						{
							id: createLocalId(),
							title: dog.medicationTitle || dog.medicationName,
							name: dog.medicationName || dog.medicationTitle || '',
							time: normalizeTime(dog.medicationTime),
							dose: normalizePositiveAmount(dog.medicationDose, 1),
							unit: dog.medicationUnit || dog.medicationDosage || 'Stück'
						}
					]
				: [];

		const walkSchedules = Array.isArray(dog.walkSchedules) && dog.walkSchedules.length
			? dog.walkSchedules
					.map((schedule) => ({
						id: schedule?.id || createLocalId(),
						title: schedule?.title || schedule?.name || 'Gassi gehen',
						name: schedule?.name || schedule?.title || 'Gassi gehen',
						time: normalizeTime(schedule?.time),
						amount: normalizePositiveAmount(schedule?.amount, 30),
						unit: schedule?.unit || 'Minuten'
					}))
					.filter((schedule) => schedule.time && schedule.amount > 0)
			: dog.walkTime
				? [
						{
							id: createLocalId(),
							title: 'Gassi gehen',
							name: 'Gassi gehen',
							time: normalizeTime(dog.walkTime),
							amount: normalizePositiveAmount(dog.walkDuration, 30),
							unit: unitPresetForValue(dog.walkDurationUnit, walkDurationUnitOptions, 'Minuten')
						}
					]
				: [];

		const firstWalk = walkSchedules[0];
		const walkDuration = firstWalk?.amount || normalizePositiveAmount(dog.walkDuration, 30);
		const walkDurationUnit = unitPresetForValue(
			firstWalk?.unit || dog.walkDurationUnit,
			walkDurationUnitOptions,
			'Minuten'
		);

		return {
			...dog,
			hint: dog.hint || '',
			feedingSchedules,
			medicationSchedules,
			walkSchedules,
			dossier: Array.isArray(dog.dossier) ? dog.dossier : [],
			walkTime: firstWalk?.time || dog.walkTime || '',
			walkDuration,
			walkDurationUnit,
			feedingTime: feedingSchedules[0]?.time || '',
			feedingAmount: feedingSchedules[0]?.amount || 0,
			feedingUnit: feedingSchedules[0]?.unit || '',
			feedingTitle: feedingSchedules[0]?.title || feedingSchedules[0]?.name || '',
			medicationName: medicationSchedules[0]?.name || '',
			medicationTitle: medicationSchedules[0]?.title || medicationSchedules[0]?.name || '',
			medicationTime: medicationSchedules[0]?.time || '',
			medicationDose: medicationSchedules[0]?.dose || 0,
			medicationUnit: medicationSchedules[0]?.unit || '',
			medicationDosage: medicationSchedules[0]
				? `${medicationSchedules[0].dose} ${medicationSchedules[0].unit || ''}`.trim()
				: ''
		};
	}

	function normalizeDogList(list) {
		return Array.isArray(list) ? list.map(normalizeDogRecord) : [];
	}

	async function submitAuth() {
		authMessage = '';
		if (authMode === 'register' && authPassword !== authPasswordConfirm) {
			authMessage = 'Die Passwörter stimmen nicht überein.';
			return;
		}

		isAuthenticating = true;

		try {
			const response = await fetch(`/api/auth?action=${authMode}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: authName,
					email: authEmail,
					password: authPassword
				})
			});
			const data = await response.json();
			if (!response.ok) throw new Error(data.message || 'Login fehlgeschlagen');

			user = data.user;
			token = data.token;
			localStorage.setItem(authStorageKey, JSON.stringify({ user, token }));
			statusMessage = '';
			dogMessage = '';
			entryMessage = '';
			reminderMessage = '';
			restoreNotifiedReminders();
			await loadDogs();
			await loadActivities();
			await loadReminders();
		} catch (error) {
			authMessage = error instanceof Error ? error.message : 'Login fehlgeschlagen';
		} finally {
			isAuthenticating = false;
		}
	}

	function logout() {
		user = null;
		token = '';
		activities = [];
		dogs = [];
		reminders = [];
		dogName = '';
		reminderDogName = '';
		authPasswordConfirm = '';
		currentStep = 1;
		activeView = 'home';
		localStorage.removeItem(authStorageKey);
	}

	function navigate(view) {
		statusMessage = '';
		activeView = view;
		if (view === 'activity') {
			entryMessage = '';
			currentStep = 1;
			activityDate = activityDate || todayDate();
			time = new Date().toTimeString().slice(0, 5);
		}
		if (view === 'planner') {
			reminderMessage = '';
			reminderDate = reminderDate || todayDate();
			if (!['Allgemein', 'Andere'].includes(reminderType)) {
				reminderDogName = reminderDogName || dogName || dogs[0]?.name || '';
			}
		}
	}

	async function loadDogs() {
		try {
			const response = await fetch('/api/dogs', { headers: authHeaders() });
			if (!response.ok) throw new Error('Hunde konnten nicht geladen werden');
			const data = await response.json();
			dogs = normalizeDogList(data.dogs);
			dogName = dogs[0]?.name || '';
			if (!['Allgemein', 'Andere'].includes(reminderType)) {
				reminderDogName = dogs[0]?.name || '';
			}
			if (dogs.length === 0) {
				activeView = 'home';
				dogMessage = 'Erfasse zuerst deinen Hund, damit du Aktivitäten speichern kannst.';
			}
		} catch {
			dogs = [];
			dogName = '';
			statusMessage = 'Hunde konnten gerade nicht geladen werden.';
		}
	}

	async function loadActivities() {
		isLoading = true;
		statusMessage = '';

		try {
			const response = await fetch('/api/activities', { headers: authHeaders() });
			if (!response.ok) throw new Error('API nicht erreichbar');
			const data = await response.json();
			activities = Array.isArray(data.activities) ? data.activities : [];
			localStorage.setItem(activityStorageKey(), JSON.stringify(activities));
		} catch {
			const saved = localStorage.getItem(activityStorageKey());
			if (saved) {
				try {
					const parsed = JSON.parse(saved);
					if (Array.isArray(parsed)) activities = parsed;
				} catch {
					activities = [];
				}
			}
			statusMessage = 'Offline-Modus: Daten werden lokal im Browser angezeigt.';
		} finally {
			isLoading = false;
		}
	}

	async function loadReminders() {
		try {
			const response = await fetch('/api/reminders', { headers: authHeaders() });
			if (!response.ok) throw new Error('Erinnerungen konnten nicht geladen werden');
			const data = await response.json();
			reminders = Array.isArray(data.reminders) ? data.reminders : [];
		} catch {
			statusMessage = 'Erinnerungen konnten gerade nicht geladen werden.';
		}
	}

	async function uploadCloudFile({ name, type, size, data }) {
		const response = await fetch('/api/files', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', ...authHeaders() },
			body: JSON.stringify({ name, type, size, data })
		});
		const result = await response.json();
		if (!response.ok) {
			throw new Error(result.message || 'Datei konnte nicht hochgeladen werden.');
		}
		return result.file;
	}

	function createDogRoutineReminders(dog) {
		const remindersToCreate = [];
		const feedingSchedules = Array.isArray(dog.feedingSchedules) ? dog.feedingSchedules : [];
		const medicationSchedules = Array.isArray(dog.medicationSchedules) ? dog.medicationSchedules : [];
		const walkSchedules = Array.isArray(dog.walkSchedules) && dog.walkSchedules.length
			? dog.walkSchedules
			: dog.walkTime
				? [
						{
							title: 'Gassi gehen',
							name: 'Gassi gehen',
							time: normalizeTime(dog.walkTime),
							amount: normalizePositiveAmount(dog.walkDuration, 30),
							unit: unitPresetForValue(dog.walkDurationUnit, walkDurationUnitOptions, 'Minuten')
						}
					]
				: [];

		for (const schedule of feedingSchedules) {
			if (!schedule?.time || Number(schedule.amount) <= 0) continue;
			remindersToCreate.push({
				dogName: dog.name,
				type: 'Futter',
				title: schedule.title || schedule.name || `Futter um ${schedule.time}`,
				date: todayDate(),
				time: schedule.time,
				amount: Number(schedule.amount),
				unit: schedule.unit || 'Portion',
				recurrence: 'daily'
			});
		}

		for (const schedule of medicationSchedules) {
			const title = schedule.title || schedule.name || '';
			if (!schedule?.time || !title) continue;
			const dose = Number(schedule.dose ?? schedule.amount ?? 0);
			remindersToCreate.push({
				dogName: dog.name,
				type: 'Medikament',
				title: title || `${schedule.name} um ${schedule.time}`,
				date: todayDate(),
				time: schedule.time,
				medicationName: title,
				dose,
				unit: schedule.unit || 'Stück',
				dosage: displayQuantity(dose, schedule.unit || 'Stück'),
				recurrence: 'daily'
			});
		}

		for (const schedule of walkSchedules) {
			if (!schedule?.time || Number(schedule.amount) <= 0) continue;
			remindersToCreate.push({
				dogName: dog.name,
				type: 'Gassi',
				title: schedule.title || schedule.name || 'Gassi gehen',
				date: todayDate(),
				time: schedule.time,
				amount: Number(schedule.amount),
				unit: schedule.unit || 'Minuten',
				recurrence: 'daily'
			});
		}

		return remindersToCreate;
	}

	async function addDog(payload) {
		const name = payload?.name?.trim();
		const breed = payload?.breed?.trim();
		if (!name) {
			throw new Error('Hundename fehlt.');
		}

		const dossier = [];
		const uploadedFiles = [];

		try {
			for (const item of payload.dossier || []) {
				if (!item?.title || !item?.data) continue;
				const uploaded = await uploadCloudFile({
					name: item.fileName,
					type: item.fileType,
					size: item.fileSize,
					data: item.data
				});
				uploadedFiles.push(uploaded);
				dossier.push({
					id: item.id || createLocalId(),
					title: item.title.trim(),
					file: uploaded
				});
			}

			const feedingSchedules = Array.isArray(payload.feedingSchedules) ? payload.feedingSchedules : [];
			const medicationSchedules = Array.isArray(payload.medicationSchedules) ? payload.medicationSchedules : [];
			const walkSchedules = Array.isArray(payload.walkSchedules) ? payload.walkSchedules : [];
			const routine = {
				name,
				breed,
				hint: payload.hint || '',
				feedingSchedules,
				medicationSchedules,
				walkSchedules,
				dossier,
				walkTime: walkSchedules[0]?.time || normalizeTime(payload.walkTime),
				walkDuration: walkSchedules[0]?.amount || normalizePositiveAmount(payload.walkDuration, 30),
				walkDurationUnit: unitPresetForValue(
					walkSchedules[0]?.unit || payload.walkDurationUnit,
					walkDurationUnitOptions,
					'Minuten'
				)
			};

			const response = await fetch('/api/dogs', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', ...authHeaders() },
				body: JSON.stringify(routine)
			});
			const data = await response.json();
			if (!response.ok) throw new Error(data.message || 'Hund konnte nicht gespeichert werden');

			const savedDog = normalizeDogRecord(data.dog);
			dogs = [...dogs, savedDog];
			dogName = savedDog.name;
			reminderDogName = savedDog.name;
			dogMessage = `${savedDog.name} wurde hinzugefügt.`;
			statusMessage = '';
			await createRoutineReminders(savedDog);
			return savedDog;
		} catch (error) {
			if (uploadedFiles.length > 0) {
				await Promise.allSettled(
					uploadedFiles.map((file) =>
						fetch(`/api/files?key=${encodeURIComponent(file.key)}`, {
							method: 'DELETE',
							headers: authHeaders()
						})
					)
				);
			}
			throw error;
		}
	}

	async function deleteDog(dog) {
		if (!dog?._id || dogs.length <= 1) return;

		statusMessage = '';
		dogMessage = '';
		entryMessage = '';

		try {
			const response = await fetch(`/api/dogs?id=${dog._id}`, {
				method: 'DELETE',
				headers: authHeaders()
			});
			const data = await response.json();
			if (!response.ok) throw new Error(data.message || 'Hund konnte nicht gelöscht werden');

			dogs = dogs.filter((item) => item._id !== dog._id);
			activities = activities.filter((activity) => activity.dogName !== dog.name);
			reminders = reminders.filter((reminder) => reminder.dogName !== dog.name);
			dogName = dogs[0]?.name || '';
			reminderDogName = dogName;
			dogMessage = `${dog.name} wurde gelöscht.`;
		} catch (error) {
			statusMessage = error instanceof Error ? error.message : 'Hund konnte nicht gelöscht werden.';
		}
	}

	function setStep(step) {
		currentStep = Math.min(3, Math.max(1, step));
		entryMessage = '';
	}

	function updateAmountForType(nextType) {
		type = nextType;
		amount = getDefaultAmount(nextType);
		if (['Futter', 'Medikament', 'Gassi'].includes(nextType)) {
			routineTitle = '';
			routineUnitPreset = getDefaultUnit(nextType);
			routineUnitCustom = '';
		}
		entryMessage = '';
	}

	function formatActivity(activity) {
		const date = activity.date ? `${formatDate(activity.date)} · ` : '';
		const start = activity.time || '--:--';
		const end = activity.endTime ? `-${activity.endTime}` : '';
		const amountValue = displayQuantity(activity.amount, activity.unit || '');

		if (activity.type === 'Futter') {
			const title = activity.title || activity.mealType || 'Futter';
			return `${date}${start} · ${title} · ${amountValue}`;
		}

		if (activity.type === 'Pflege') {
			return `${date}${start}${end} · ${amountValue}${activity.careType ? ` · ${activity.careType}` : ''}`;
		}

		if (activity.type === 'Medikament') {
			const title = activity.title || activity.medicationName || 'Medikament';
			const dose = activity.dose ? displayQuantity(activity.dose, activity.unit || '') : activity.dosage || '';
			return `${date}${start} · ${title}${dose ? ` · ${dose}` : ''}`;
		}

		if (activity.type === 'Gassi') {
			const title = activity.title || 'Gassi gehen';
			return `${date}${start}${end} · ${title} · ${amountValue}`;
		}

		if (activity.type === 'Arzt') {
			return `${date}${start} · ${activity.title || activity.vetReason || 'Termin'}${activity.vetClinic ? ` · ${activity.vetClinic}` : ''}`;
		}

		return `${date}${start}${end} · ${amountValue}`;
	}

	function todayDate() {
		return new Date().toISOString().slice(0, 10);
	}

	function formatDate(value) {
		const [year, month, day] = String(value).split('-');
		return day && month ? `${day}.${month}.` : value;
	}

	function addMinutes(value, minutes) {
		const match = /^(\d{2}):(\d{2})$/.exec(value || '');
		if (!match || !Number.isFinite(minutes)) return '';

		const total = Number(match[1]) * 60 + Number(match[2]) + minutes;
		const normalized = ((Math.round(total) % 1440) + 1440) % 1440;
		const hours = String(Math.floor(normalized / 60)).padStart(2, '0');
		const mins = String(normalized % 60).padStart(2, '0');
		return `${hours}:${mins}`;
	}

	function getDefaultAmount(nextType) {
		if (nextType === 'Futter') return routineDefaults.Futter.amount;
		if (nextType === 'Medikament') return routineDefaults.Medikament.amount;
		if (nextType === 'Gassi') return routineDefaults.Gassi.amount;
		if (nextType === 'Pflege') return 20;
		return 0;
	}

	function getDefaultUnit(nextType) {
		if (nextType === 'Futter') return routineDefaults.Futter.unitPreset;
		if (nextType === 'Medikament') return routineDefaults.Medikament.unitPreset;
		if (nextType === 'Gassi') return routineDefaults.Gassi.unitPreset;
		return '';
	}

	function normalizeAmount(nextType, value) {
		const numeric = Number(value);
		if (!Number.isFinite(numeric) || numeric <= 0) return 0;
		if (nextType === 'Pflege') return Math.min(180, Math.max(1, numeric));
		return numeric;
	}

	function buildEntry(uploadedAttachment = null) {
		const normalizedAmount = normalizeAmount(type, amount);
		const routineUnit =
			type === 'Futter'
				? resolveUnitValue(routineUnitPreset, routineUnitCustom, routineDefaults.Futter.unitPreset)
				: type === 'Medikament'
					? resolveUnitValue(
							routineUnitPreset,
							routineUnitCustom,
							routineDefaults.Medikament.unitPreset
						)
					: type === 'Gassi'
						? resolveUnitValue(routineUnitPreset, routineUnitCustom, routineDefaults.Gassi.unitPreset)
						: '';
		const entryDate = activityDate || todayDate();
		const entryTime = time || new Date().toTimeString().slice(0, 5);
		const createdAt = Date.parse(`${entryDate}T${entryTime}`) || Date.now();

		const entry = {
			dogName,
			type,
			amount: normalizedAmount,
			date: entryDate,
			time: entryTime,
			note: note.trim(),
			createdAt
		};

		if (type === 'Gassi') {
			entry.title = routineTitle.trim() || 'Gassi gehen';
			entry.unit = routineUnit || routineDefaults.Gassi.unitPreset;
			entry.endTime = addMinutes(entryTime, durationToMinutes(normalizedAmount, entry.unit));
		}

		if (type === 'Futter') {
			entry.title = routineTitle.trim() || 'Futter';
			entry.unit = routineUnit || routineDefaults.Futter.unitPreset;
		}

		if (type === 'Pflege') {
			entry.unit = 'min';
			entry.endTime = addMinutes(entryTime, normalizedAmount);
			entry.careType = careType;
		}

		if (type === 'Medikament') {
			entry.title = routineTitle.trim() || 'Medikament';
			entry.dose = normalizedAmount;
			entry.unit = routineUnit || routineDefaults.Medikament.unitPreset;
		}

		if (type === 'Arzt') {
			entry.title = vetReason.trim() || 'Termin';
			entry.vetReason = vetReason.trim();
			entry.vetClinic = vetClinic.trim();
		}

		if (uploadedAttachment) {
			entry.attachment = uploadedAttachment;
		}

		return entry;
	}

	async function uploadAttachment() {
		const response = await fetch('/api/files', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', ...authHeaders() },
			body: JSON.stringify({
				name: attachmentName,
				type: attachmentType,
				size: attachmentSize,
				data: attachmentData
			})
		});
		const data = await response.json();
		if (!response.ok) {
			throw new Error(data.message || 'Anhang konnte nicht in der Cloud gespeichert werden.');
		}
		return data.file;
	}

	function validateEntry(entry) {
		if (!entry.dogName) return 'Bitte erfasse zuerst deinen Hund.';
		if (!entry.date) return 'Bitte wähle ein Datum.';
		if (!entry.time) return 'Bitte wähle eine Uhrzeit.';
		if (entry.type === 'Futter' && (!entry.amount || entry.amount <= 0)) {
			return 'Bitte eine Futtermenge angeben.';
		}
		if (entry.type === 'Gassi' && (!entry.amount || entry.amount <= 0)) {
			return 'Bitte eine Gassi-Dauer angeben.';
		}
		if (entry.type === 'Pflege' && (!entry.amount || entry.amount < 1 || entry.amount > 180)) {
			return 'Pflege muss zwischen 1 und 180 Minuten liegen.';
		}
		if (entry.type === 'Medikament' && (!entry.title || !entry.dose || entry.dose <= 0)) {
			return 'Bitte Medikament und Dosis erfassen.';
		}
		if ((entry.type === 'Futter' || entry.type === 'Medikament' || entry.type === 'Gassi') && !entry.unit) {
			return 'Bitte eine Einheit wählen.';
		}
		if (entry.type === 'Arzt' && !entry.vetReason) {
			return 'Bitte den Grund für den Arzttermin erfassen.';
		}
		return '';
	}

	function reminderDateTimeValue(reminder) {
		return Date.parse(`${reminder.date || todayDate()}T${reminder.time || '00:00'}`) || 0;
	}

	function isReminderDue(reminder) {
		return !reminder.completed && reminderDateTimeValue(reminder) <= now;
	}

	function compareReminders(a, b) {
		if (a.completed !== b.completed) return a.completed ? 1 : -1;
		return reminderDateTimeValue(a) - reminderDateTimeValue(b);
	}

	function addDaysToDate(value, days) {
		const date = new Date(`${value || todayDate()}T12:00`);
		date.setDate(date.getDate() + days);
		return date.toISOString().slice(0, 10);
	}

	function formatReminder(reminder) {
		const date = reminder.date ? formatDate(reminder.date) : 'Heute';
		const repeat = reminder.recurrence === 'daily' ? ' · täglich' : '';
		const dogLabel = reminder.dogName ? reminder.dogName : 'ohne Hund';
		const amount =
			reminder.type === 'Futter' && reminder.amount
				? ` · ${displayQuantity(reminder.amount, reminder.unit || '')}`
				: '';
		const meds =
			reminder.type === 'Medikament'
				? ` · ${reminder.title || reminder.medicationName || 'Medikament'}${reminder.dose ? ` · ${displayQuantity(reminder.dose, reminder.unit || '')}` : reminder.dosage ? ` · ${reminder.dosage}` : ''}`
				: '';
		const walk =
			reminder.type === 'Gassi' && reminder.amount
				? ` · ${reminder.title || 'Gassi gehen'} · ${displayQuantity(reminder.amount, reminder.unit || '')}`
				: '';
		const clinic = reminder.type === 'Arzt' && reminder.vetClinic ? ` · ${reminder.vetClinic}` : '';
		return `${date} · ${reminder.time} · ${dogLabel} · ${reminder.type}${amount}${meds}${walk}${clinic}${repeat}`;
	}

	function buildReminder() {
		const title =
			reminderType === 'Futter'
				? reminderTitle.trim() || 'Futter'
				: reminderType === 'Medikament'
					? reminderTitle.trim() || 'Medikament'
					: reminderType === 'Gassi'
						? reminderTitle.trim() || 'Gassi gehen'
						: reminderType === 'Arzt'
							? reminderTitle.trim() || 'Arzttermin'
							: reminderTitle.trim() || 'Aufgabe';
		const unit =
			reminderType === 'Futter'
				? resolveUnitValue(reminderUnitPreset, reminderUnitCustom, routineDefaults.Futter.unitPreset)
				: reminderType === 'Medikament'
					? resolveUnitValue(
							reminderUnitPreset,
							reminderUnitCustom,
							routineDefaults.Medikament.unitPreset
						)
					: reminderType === 'Gassi'
						? resolveUnitValue(reminderUnitPreset, reminderUnitCustom, routineDefaults.Gassi.unitPreset)
						: '';
		const amountValue = Number(reminderAmount) || 0;

		return {
			dogName: reminderDogName || '',
			type: reminderType,
			title,
			date: reminderDate || todayDate(),
			time: reminderTime || '09:00',
			amount: reminderType === 'Futter' || reminderType === 'Gassi' ? amountValue : 0,
			dose: reminderType === 'Medikament' ? amountValue : 0,
			unit,
			note: reminderNote.trim(),
			medicationName: reminderType === 'Medikament' ? title : '',
			dosage: reminderType === 'Medikament' ? displayQuantity(amountValue, unit) : '',
			vetClinic: reminderVetClinic.trim(),
			recurrence: reminderRecurrence
		};
	}

	function resetReminderForm() {
		reminderType = 'Allgemein';
		reminderTitle = '';
		reminderDate = todayDate();
		reminderTime = '08:00';
		reminderAmount = 1;
		reminderUnitPreset = 'Minuten';
		reminderUnitCustom = '';
		reminderNote = '';
		reminderVetClinic = '';
		reminderRecurrence = 'once';
		reminderDogName = '';
	}

	async function postReminder(reminder) {
		const response = await fetch('/api/reminders', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', ...authHeaders() },
			body: JSON.stringify(reminder)
		});
		const data = await response.json();
		if (!response.ok) throw new Error(data.message || 'Erinnerung konnte nicht gespeichert werden');
		reminders = [...reminders, data.reminder];
		return data.reminder;
	}

	async function addReminder() {
		reminderMessage = '';
		statusMessage = '';

		try {
			const reminder = buildReminder();
			if (!reminder.dogName && !['Allgemein', 'Andere'].includes(reminder.type)) {
				throw new Error('Bitte zuerst einen Hund auswählen.');
			}
			await postReminder(reminder);
			reminderMessage = 'Erinnerung wurde geplant.';
			resetReminderForm();
		} catch (error) {
			reminderMessage =
				error instanceof Error ? error.message : 'Erinnerung konnte nicht gespeichert werden.';
		}
	}

	function activityFromReminder(reminder) {
		if (!reminder?.dogName) return null;
		if (!['Gassi', 'Futter', 'Pflege', 'Medikament', 'Arzt'].includes(reminder.type)) return null;

		const legacyDose =
			typeof reminder.dosage === 'string'
				? Number(String(reminder.dosage).replace(',', '.').match(/-?\d+(?:\.\d+)?/)?.[0] || 0)
				: 0;
		const amount =
			reminder.type === 'Futter'
				? Number(reminder.amount || 1)
				: reminder.type === 'Gassi'
					? Number(reminder.amount || 30)
					: reminder.type === 'Medikament'
						? Number(reminder.dose || reminder.amount || legacyDose || 0)
						: 0;
		const entry = {
			dogName: reminder.dogName,
			type: reminder.type,
			amount,
			unit: reminder.unit,
			date: reminder.date,
			time: reminder.time,
			note: reminder.note || 'Aus Erinnerung erledigt.',
			createdAt: reminderDateTimeValue(reminder)
		};

		if (reminder.type === 'Gassi') {
			entry.title = reminder.title || 'Gassi gehen';
			entry.endTime = addMinutes(reminder.time, durationToMinutes(amount, reminder.unit));
		}
		if (reminder.type === 'Futter') entry.title = reminder.title || 'Futter';
		if (reminder.type === 'Medikament') {
			entry.title = reminder.title || reminder.medicationName || 'Medikament';
			entry.dose = amount;
			entry.unit = reminder.unit || '';
			entry.medicationName = entry.title;
			entry.dosage = displayQuantity(amount, entry.unit);
		}
		if (reminder.type === 'Arzt') {
			entry.title = reminder.title || 'Termin';
			entry.vetReason = reminder.title;
			entry.vetClinic = reminder.vetClinic;
		}
		return entry;
	}

	async function saveActivityFromReminder(reminder) {
		const entry = activityFromReminder(reminder);
		if (!entry) return;
		try {
			const response = await fetch('/api/activities', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', ...authHeaders() },
				body: JSON.stringify(entry)
			});
			const data = await response.json();
			if (!response.ok) throw new Error('Aktivität konnte nicht gespeichert werden');
			activities = [data.activity, ...activities];
		} catch {
			activities = [entry, ...activities];
		}
		localStorage.setItem(activityStorageKey(), JSON.stringify(activities));
	}

	async function completeReminder(reminder) {
		reminderMessage = '';
		statusMessage = '';

		try {
			const response = await fetch(`/api/reminders?id=${reminder._id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json', ...authHeaders() },
				body: JSON.stringify({ completed: true })
			});
			const data = await response.json();
			if (!response.ok) throw new Error(data.message || 'Erinnerung konnte nicht erledigt werden');

			reminders = reminders.map((item) => (item._id === reminder._id ? data.reminder : item));
			await saveActivityFromReminder(reminder);

			if (reminder.recurrence === 'daily') {
				const { _id, completed, completedAt, createdAt, isDue, ...nextReminder } = reminder;
				await postReminder({
					...nextReminder,
					date: addDaysToDate(reminder.date, 1),
					completed: false
				});
			}

			reminderMessage = 'Erledigt und im Verlauf gespeichert.';
		} catch (error) {
			reminderMessage =
				error instanceof Error ? error.message : 'Erinnerung konnte nicht erledigt werden.';
		}
	}

	async function deleteReminder(reminder) {
		try {
			await fetch(`/api/reminders?id=${reminder._id}`, { method: 'DELETE', headers: authHeaders() });
			reminders = reminders.filter((item) => item._id !== reminder._id);
		} catch {
			reminderMessage = 'Erinnerung konnte nicht gelöscht werden.';
		}
	}

	async function createRoutineReminders(dog) {
		const planned = createDogRoutineReminders(dog);

		for (const reminder of planned) {
			try {
				await postReminder(reminder);
			} catch {
				statusMessage = 'Ein Routine-Reminder konnte nicht erstellt werden.';
			}
		}

		if (planned.length > 0) {
			reminderMessage = `${planned.length} Routine-Erinnerung${planned.length === 1 ? '' : 'en'} geplant.`;
		}
	}

	async function requestNotifications() {
		if (typeof Notification === 'undefined') {
			reminderMessage = 'Browser-Erinnerungen werden hier nicht unterstützt.';
			notificationPermission = 'unsupported';
			return;
		}

		notificationPermission = await Notification.requestPermission();
		reminderMessage =
			notificationPermission === 'granted'
				? 'Browser-Erinnerungen sind aktiv, solange die App geöffnet ist.'
				: 'Browser-Erinnerungen wurden nicht aktiviert.';
		notifyDueReminders();
	}

	function restoreNotifiedReminders() {
		try {
			const saved = localStorage.getItem(`dogtracker-notified-${user?.id}`);
			notifiedReminderIds = new Set(saved ? JSON.parse(saved) : []);
		} catch {
			notifiedReminderIds = new Set();
		}
	}

	function rememberNotifiedReminder(id) {
		const next = new Set(notifiedReminderIds);
		next.add(id);
		notifiedReminderIds = next;
		localStorage.setItem(`dogtracker-notified-${user?.id}`, JSON.stringify([...next]));
	}

	function notifyDueReminders() {
		if (typeof Notification === 'undefined' || notificationPermission !== 'granted') return;

		for (const reminder of dueReminders.slice(0, 3)) {
			if (!reminder._id || notifiedReminderIds.has(reminder._id)) continue;
			new Notification('DogTracker Erinnerung', {
				body: `${reminder.time} · ${reminder.title} für ${reminder.dogName}`
			});
			rememberNotifiedReminder(reminder._id);
		}
	}

	function resetEntryForm() {
		type = 'Gassi';
		amount = getDefaultAmount('Gassi');
		activityDate = todayDate();
		time = new Date().toTimeString().slice(0, 5);
		note = '';
		routineTitle = '';
		routineUnitPreset = routineDefaults.Gassi.unitPreset;
		routineUnitCustom = '';
		careType = 'Fellpflege';
		vetReason = '';
		vetClinic = '';
		attachmentName = '';
		attachmentType = '';
		attachmentData = '';
		attachmentSize = 0;
		currentStep = 1;
	}

	async function saveEntry() {
		if (!dogName) {
			activeView = 'home';
			dogMessage = 'Bitte erfasse zuerst deinen Hund.';
			return;
		}

		isSaving = true;
		statusMessage = '';
		entryMessage = '';

		let entry = buildEntry();
		const validationMessage = validateEntry(entry);
		if (validationMessage) {
			entryMessage = validationMessage;
			isSaving = false;
			return;
		}

		let uploadedAttachment = null;
		let shouldCloseForm = false;
		try {
			if (attachmentData && attachmentName) {
				entryMessage = 'Anhang wird in der Cloud gespeichert...';
				uploadedAttachment = await uploadAttachment();
				entry = buildEntry(uploadedAttachment);
			}

			const response = await fetch('/api/activities', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', ...authHeaders() },
				body: JSON.stringify(entry)
			});
			if (!response.ok) throw new Error('Speichern fehlgeschlagen');
			const saved = await response.json();
			activities = [saved.activity, ...activities];
			entryMessage = 'Aktivität gespeichert und im Dashboard aktualisiert.';
			shouldCloseForm = true;
		} catch (error) {
			if (attachmentData && attachmentName && !uploadedAttachment) {
				const message =
					error instanceof Error ? error.message : 'Anhang konnte nicht gespeichert werden.';
				statusMessage = message;
				entryMessage = message;
			} else {
				activities = [entry, ...activities];
				statusMessage = 'Aktivität lokal gespeichert. MongoDB ist gerade nicht erreichbar.';
				entryMessage = 'Aktivität lokal gespeichert.';
				shouldCloseForm = true;
			}
		} finally {
			if (shouldCloseForm) {
				localStorage.setItem(activityStorageKey(), JSON.stringify(activities));
				resetEntryForm();
				activeView = 'home';
			}
			isSaving = false;
		}
	}

	async function clearActivities() {
		statusMessage = '';
		entryMessage = '';
		dogMessage = '';

		try {
			await fetch('/api/activities', { method: 'DELETE', headers: authHeaders() });
		} catch {
			statusMessage = 'Nur lokale Daten wurden geleert.';
		}

		activities = [];
		localStorage.setItem(activityStorageKey(), JSON.stringify([]));
	}

	async function deleteActivity(activity) {
		if (!activity?._id) return;

		statusMessage = '';
		entryMessage = '';
		dogMessage = '';

		try {
			const response = await fetch(`/api/activities?id=${activity._id}`, {
				method: 'DELETE',
				headers: authHeaders()
			});
			const data = await response.json();
			if (!response.ok) throw new Error(data.message || 'Aktivität konnte nicht gelöscht werden');

			activities = activities.filter((item) => item._id !== activity._id);
			localStorage.setItem(activityStorageKey(), JSON.stringify(activities));
			entryMessage = 'Aktivität wurde gelöscht.';
		} catch (error) {
			statusMessage = error instanceof Error ? error.message : 'Aktivität konnte nicht gelöscht werden.';
		}
	}

</script>

<svelte:head>
	<title>DogTracker</title>
	<meta
		name="description"
		content="DogTracker Prototyp zum Dokumentieren von Gassi, Futter, Pflege, Medikamenten und Arztterminen."
	/>
</svelte:head>

{#if !user}
	<AuthPanel
		bind:authMode
		bind:name={authName}
		bind:email={authEmail}
		bind:password={authPassword}
		bind:passwordConfirm={authPasswordConfirm}
		{isAuthenticating}
		{authMessage}
		onSubmit={submitAuth}
	/>
{:else}
<main class="app-shell">
	<header class="topbar">
		<div>
			<p class="eyebrow">DogTracker</p>
			<h1>{dogName ? `Heute mit ${dogName}` : 'Willkommen'}</h1>
		</div>
		<div class="header-actions">
			<button class="logout-button" type="button" onclick={logout}>Logout</button>
		</div>
	</header>

	{#if statusMessage}
		<p class="status-note">{statusMessage}</p>
	{/if}

	{#if activeView === 'home'}
		<Dashboard
			{latestActivity}
			{walkMinutes}
			{foodCount}
			{formatActivity}
			isLoading={isLoading}
			hasDogs={dogs.length > 0}
		/>

		<section class="quick-actions" aria-label="Schnellzugriff">
			<button class="primary-action" type="button" onclick={() => navigate('activity')}>
				Neue Aktivität
			</button>
			<button class="secondary-action" type="button" onclick={() => navigate('planner')}>
				Neue Aufgabe
			</button>
			<button class="secondary-action" type="button" onclick={() => navigate('history')}>
				Verlauf öffnen
			</button>
		</section>

		{#if dueReminders.length > 0}
			<section class="reminder-alert" aria-labelledby="due-title">
				<p class="eyebrow">Jetzt fällig</p>
				<h2 id="due-title">Erinnerung offen</h2>
				{#each dueReminders.slice(0, 3) as reminder}
					<article>
						<div>
							<strong>{reminder.title}</strong>
							<span>{formatReminder(reminder)}</span>
						</div>
						<button type="button" onclick={() => completeReminder(reminder)}>Erledigt</button>
					</article>
				{/each}
			</section>
		{/if}

		<DogManager
			{user}
			{dogs}
			bind:dogName
			successMessage={dogMessage}
			onAddDog={addDog}
			onDeleteDog={deleteDog}
		/>

		<Timeline
			title="Letzte 5 Einträge"
			showClear={false}
			activities={sortedActivities.slice(0, 5)}
			{formatActivity}
			{clearActivities}
			onDeleteActivity={deleteActivity}
		/>
	{:else if activeView === 'activity'}
		{#if dogs.length === 0}
			<section class="empty-panel" aria-labelledby="first-dog-title">
				<p class="eyebrow">Erster Schritt</p>
				<h2 id="first-dog-title">Erfasse zuerst deinen Hund.</h2>
				<p>Danach kannst du hier Gassi, Futter, Pflege, Medikamente und Arzttermine dokumentieren.</p>
				<button class="primary-action" type="button" onclick={() => (activeView = 'home')}>
					Hund hinzufügen
				</button>
			</section>
		{:else}
			<EntryForm
				bind:currentStep
				bind:dogName
				bind:type
				bind:amount
				bind:activityDate
				bind:time
				bind:note
				bind:routineTitle
				bind:routineUnitPreset
				bind:routineUnitCustom
				bind:careType
				bind:vetReason
				bind:vetClinic
				bind:attachmentName
				bind:attachmentType
				bind:attachmentData
				bind:attachmentSize
				{dogs}
				{isSaving}
				successMessage={entryMessage}
				{setStep}
				{updateAmountForType}
				onSave={saveEntry}
			/>
		{/if}
	{:else if activeView === 'planner'}
		<PlannerPanel
			reminders={sortedReminders}
			{dogs}
			{notificationPermission}
			bind:reminderDogName
			bind:reminderType
			bind:reminderTitle
			bind:reminderDate
			bind:reminderTime
			bind:reminderAmount
			bind:reminderUnitPreset
			bind:reminderUnitCustom
			bind:reminderNote
			bind:reminderVetClinic
			bind:reminderRecurrence
			message={reminderMessage}
			{formatReminder}
			onAddReminder={addReminder}
			onCompleteReminder={completeReminder}
			onDeleteReminder={deleteReminder}
			onRequestNotifications={requestNotifications}
		/>
	{:else}
		<Timeline
			title="Gesamter Verlauf"
			activities={sortedActivities}
			{formatActivity}
			{clearActivities}
			onDeleteActivity={deleteActivity}
		/>
	{/if}
</main>

<BottomNav {activeView} onNavigate={navigate} />
{/if}

<style>
	:global(body) {
		margin: 0;
		min-height: 100vh;
		background: linear-gradient(180deg, #f4f8f6 0%, #edf3ef 100%);
		color: #17211b;
		font-family:
			Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
	}

	:global(*) {
		box-sizing: border-box;
	}

	:global(button),
	:global(input),
	:global(select),
	:global(textarea) {
		font: inherit;
		min-width: 0;
		max-width: 100%;
	}

	:global(input),
	:global(textarea) {
		-webkit-appearance: none;
		appearance: none;
	}

	:global(input[type='date']),
	:global(input[type='time']) {
		-webkit-appearance: none;
		appearance: none;
		line-height: 1.2;
		text-align: center;
	}

	:global(input[type='file']) {
		overflow: hidden;
		text-overflow: ellipsis;
	}

	:global(label),
	:global(fieldset) {
		min-width: 0;
	}

	:global(button) {
		cursor: pointer;
	}

	:global(svg) {
		width: 22px;
		height: 22px;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.8;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.app-shell {
		width: min(100%, 480px);
		min-height: 100vh;
		margin: 0 auto;
		padding: 18px 16px calc(148px + env(safe-area-inset-bottom));
	}

	.topbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		margin-bottom: 18px;
	}

	.eyebrow {
		margin: 0 0 4px;
		color: #28756c;
		font-size: 0.76rem;
		font-weight: 800;
		letter-spacing: 0;
		text-transform: uppercase;
	}

	h1 {
		margin: 0;
		font-size: 1.8rem;
		line-height: 1.1;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.logout-button {
		min-height: 42px;
		border: 0;
		border-radius: 12px;
		background: #eef2ed;
		color: #17211b;
		padding: 0 12px;
		font-size: 0.82rem;
		font-weight: 900;
	}

	.status-note {
		margin: 0 0 12px;
		border: 1px solid #dfe4dd;
		border-radius: 12px;
		background: #ffffff;
		color: #86532d;
		padding: 10px 12px;
		font-size: 0.86rem;
		line-height: 1.35;
	}

	.quick-actions {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 10px;
		margin: 14px 0;
	}

	.secondary-action {
		min-height: 46px;
		border: 1px solid #d6dfd8;
		border-radius: 12px;
		background: #f7faf8;
		color: #1f5f57;
		padding: 0 12px;
		font-weight: 850;
	}

	.reminder-alert {
		border: 1px solid #ebb38f;
		border-radius: 16px;
		background: #fff7f1;
		box-shadow: 0 16px 40px rgba(16, 24, 40, 0.08);
		padding: 16px;
		margin: 14px 0;
	}

	.reminder-alert h2 {
		margin: 0 0 12px;
		font-size: 1.15rem;
	}

	.reminder-alert article {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 10px;
		align-items: center;
		border-top: 1px solid #f0d7c9;
		padding: 10px 0;
	}

	.reminder-alert strong,
	.reminder-alert span {
		display: block;
	}

	.reminder-alert span {
		margin-top: 3px;
		color: #66707a;
		font-size: 0.82rem;
	}

	.reminder-alert button {
		min-height: 40px;
		border: 0;
		border-radius: 12px;
		background: #2c6f67;
		color: white;
		padding: 0 12px;
		font-weight: 900;
	}

	.empty-panel {
		border: 1px solid #dfe4dd;
		border-radius: 16px;
		background: #ffffff;
		box-shadow: 0 16px 40px rgba(16, 24, 40, 0.08);
		padding: 18px;
		margin-top: 14px;
	}

	.empty-panel h2,
	.empty-panel p {
		margin-top: 0;
	}

	.empty-panel h2 {
		margin-bottom: 8px;
		font-size: 1.2rem;
	}

	.empty-panel p {
		color: #66707a;
		line-height: 1.4;
	}

	.primary-action {
		min-height: 46px;
		border: 0;
		border-radius: 12px;
		background: #2c6f67;
		color: white;
		padding: 0 16px;
		font-weight: 900;
	}

	@media (max-width: 640px) {
		.quick-actions {
			grid-template-columns: 1fr;
		}
	}
</style>
