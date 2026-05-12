<script>
	import { onMount } from 'svelte';
	import AuthPanel from '$lib/components/AuthPanel.svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import Dashboard from '$lib/components/Dashboard.svelte';
	import EntryForm from '$lib/components/EntryForm.svelte';
	import Timeline from '$lib/components/Timeline.svelte';

	const storageKey = 'dogtracker-activities';
	const authStorageKey = 'dogtracker-auth';

	const starterActivities = [
		{
			dogName: 'Milo',
			type: 'Gassi',
			amount: 35,
			time: '07:40',
			note: 'Ruhige Morgenrunde im Park',
			createdAt: Date.now() - 1000 * 60 * 90
		},
		{
			dogName: 'Milo',
			type: 'Futter',
			amount: 1,
			time: '12:15',
			note: 'Trockenfutter vollständig gegessen',
			createdAt: Date.now() - 1000 * 60 * 35
		}
	];

	let activities = $state(starterActivities);
	let dogs = $state([{ name: 'Milo' }, { name: 'Luna' }]);
	let user = $state(null);
	let token = $state('');
	let authMode = $state('login');
	let authName = $state('');
	let authEmail = $state('demo@dogtracker.ch');
	let authPassword = $state('demo123');
	let authMessage = $state('');
	let isAuthenticating = $state(false);
	let currentStep = $state(1);
	let dogName = $state('Milo');
	let newDogName = $state('');
	let type = $state('Gassi');
	let amount = $state(25);
	let time = $state('');
	let note = $state('');
	let isLoading = $state(true);
	let isSaving = $state(false);
	let statusMessage = $state('');
	let successMessage = $state('');

	let sortedActivities = $derived([...activities].sort((a, b) => b.createdAt - a.createdAt));
	let selectedDogActivities = $derived(activities.filter((activity) => activity.dogName === dogName));
	let walkMinutes = $derived(
		selectedDogActivities
			.filter((activity) => activity.type === 'Gassi')
			.reduce((sum, activity) => sum + Number(activity.amount || 0), 0)
	);
	let foodCount = $derived(selectedDogActivities.filter((activity) => activity.type === 'Futter').length);
	let latestActivity = $derived([...selectedDogActivities].sort((a, b) => b.createdAt - a.createdAt)[0]);

	onMount(async () => {
		time = new Date().toTimeString().slice(0, 5);
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
			await loadDogs();
			await loadActivities();
		} else {
			isLoading = false;
		}
	});

	function authHeaders() {
		return {
			Authorization: `Bearer ${token}`
		};
	}

	async function submitAuth() {
		isAuthenticating = true;
		authMessage = '';

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
			successMessage = '';
			await loadDogs();
			await loadActivities();
		} catch (error) {
			authMessage = error instanceof Error ? error.message : 'Login fehlgeschlagen';
		} finally {
			isAuthenticating = false;
		}
	}

	function logout() {
		user = null;
		token = '';
		activities = starterActivities;
		dogs = [{ name: 'Milo' }, { name: 'Luna' }];
		currentStep = 1;
		localStorage.removeItem(authStorageKey);
	}

	async function loadDogs() {
		try {
			const response = await fetch('/api/dogs', { headers: authHeaders() });
			if (!response.ok) throw new Error('Hunde konnten nicht geladen werden');
			const data = await response.json();
			dogs = Array.isArray(data.dogs) && data.dogs.length ? data.dogs : [{ name: 'Milo' }];
			dogName = dogs[0]?.name || 'Milo';
		} catch {
			dogs = [{ name: 'Milo' }, { name: 'Luna' }];
			dogName = 'Milo';
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
			localStorage.setItem(storageKey, JSON.stringify(activities));
		} catch {
			const saved = localStorage.getItem(storageKey);
			if (saved) {
				try {
					const parsed = JSON.parse(saved);
					if (Array.isArray(parsed)) activities = parsed;
				} catch {
					activities = starterActivities;
				}
			}
			statusMessage = 'Offline-Modus: Daten werden lokal im Browser angezeigt.';
		} finally {
			isLoading = false;
		}
	}

	async function addDog() {
		const name = newDogName.trim();
		if (!name) return;

		try {
			const response = await fetch('/api/dogs', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', ...authHeaders() },
				body: JSON.stringify({ name })
			});
			const data = await response.json();
			if (!response.ok) throw new Error(data.message || 'Hund konnte nicht gespeichert werden');
			dogs = [...dogs, data.dog];
			dogName = data.dog.name;
			newDogName = '';
		} catch (error) {
			statusMessage = error instanceof Error ? error.message : 'Hund konnte nicht gespeichert werden.';
		}
	}

	function setStep(step) {
		currentStep = Math.min(3, Math.max(1, step));
		successMessage = '';
	}

	function updateAmountForType(nextType) {
		type = nextType;
		amount = nextType === 'Futter' ? 1 : 25;
	}

	function formatActivity(activity) {
		const unit = activity.type === 'Gassi' ? 'min' : activity.type === 'Futter' ? 'Portion' : 'min';
		const plural = activity.type === 'Futter' && Number(activity.amount) !== 1 ? 'en' : '';
		return `${activity.time} · ${activity.amount} ${unit}${plural}`;
	}

	async function saveEntry() {
		isSaving = true;
		statusMessage = '';
		successMessage = '';

		const entry = {
			dogName,
			type,
			amount: Number(amount),
			time: time || new Date().toTimeString().slice(0, 5),
			note: note.trim(),
			createdAt: Date.now()
		};

		try {
			const response = await fetch('/api/activities', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', ...authHeaders() },
				body: JSON.stringify(entry)
			});
			if (!response.ok) throw new Error('Speichern fehlgeschlagen');
			const saved = await response.json();
			activities = [saved.activity, ...activities];
			successMessage = 'Aktivität gespeichert und im Dashboard aktualisiert.';
		} catch {
			activities = [entry, ...activities];
			statusMessage = 'Aktivität lokal gespeichert. MongoDB ist gerade nicht erreichbar.';
			successMessage = 'Aktivität lokal gespeichert.';
		} finally {
			localStorage.setItem(storageKey, JSON.stringify(activities));
			type = 'Gassi';
			amount = 25;
			time = new Date().toTimeString().slice(0, 5);
			note = '';
			currentStep = 1;
			isSaving = false;
		}
	}

	async function clearActivities() {
		statusMessage = '';
		successMessage = '';

		try {
			await fetch('/api/activities', { method: 'DELETE', headers: authHeaders() });
		} catch {
			statusMessage = 'Nur lokale Daten wurden geleert.';
		}

		activities = [];
		localStorage.setItem(storageKey, JSON.stringify([]));
	}

	async function resetDemo() {
		activities = starterActivities;
		localStorage.setItem(storageKey, JSON.stringify(starterActivities));
		currentStep = 1;
		statusMessage = 'Demo-Daten wurden lokal zurückgesetzt.';
		successMessage = '';
	}
</script>

<svelte:head>
	<title>DogTracker</title>
	<meta
		name="description"
		content="DogTracker Prototyp zum schnellen Erfassen von Gassi, Futter und Pflege."
	/>
</svelte:head>

{#if !user}
	<AuthPanel
		bind:authMode
		bind:name={authName}
		bind:email={authEmail}
		bind:password={authPassword}
		{isAuthenticating}
		{authMessage}
		onSubmit={submitAuth}
	/>
{:else}
<main class="app-shell">
	<header class="topbar">
		<div>
			<p class="eyebrow">DogTracker</p>
			<h1>Heute mit {dogName}</h1>
		</div>
		<div class="header-actions">
			<button class="icon-button" type="button" aria-label="Demo-Daten zurücksetzen" onclick={resetDemo}>
				<svg viewBox="0 0 24 24" aria-hidden="true">
					<path d="M3 12a9 9 0 1 0 3-6.7" />
					<path d="M3 4v5h5" />
				</svg>
			</button>
			<button class="logout-button" type="button" onclick={logout}>Logout</button>
		</div>
	</header>

	{#if statusMessage}
		<p class="status-note">{statusMessage}</p>
	{/if}

	<Dashboard
		{latestActivity}
		{walkMinutes}
		{foodCount}
		{formatActivity}
		isLoading={isLoading}
	/>

	<EntryForm
		bind:currentStep
		bind:dogName
		bind:newDogName
		bind:type
		bind:amount
		bind:time
		bind:note
		{dogs}
		{isSaving}
		{successMessage}
		{setStep}
		{updateAmountForType}
		onAddDog={addDog}
		onSave={saveEntry}
	/>

	<Timeline activities={sortedActivities} {formatActivity} {clearActivities} />
</main>

<BottomNav />
{/if}

<style>
	:global(body) {
		margin: 0;
		min-height: 100vh;
		background: linear-gradient(180deg, #fbf7f0 0%, #f7f3ec 100%);
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
		width: min(100%, 460px);
		min-height: 100vh;
		margin: 0 auto;
		padding: 18px 16px 96px;
	}

	.topbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		margin-bottom: 16px;
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
		font-size: 1.75rem;
		line-height: 1.1;
	}

	.icon-button {
		width: 42px;
		height: 42px;
		display: grid;
		place-items: center;
		border: 0;
		border-radius: 8px;
		background: #ffffff;
		color: #18544d;
		box-shadow: 0 8px 20px rgba(39, 117, 108, 0.1);
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.logout-button {
		min-height: 42px;
		border: 0;
		border-radius: 8px;
		background: #efe7dc;
		color: #17211b;
		padding: 0 12px;
		font-size: 0.82rem;
		font-weight: 900;
	}

	.status-note {
		margin: 0 0 12px;
		border: 1px solid #d6c5a8;
		border-radius: 8px;
		background: #fffaf2;
		color: #6f4d12;
		padding: 10px 12px;
		font-size: 0.86rem;
		line-height: 1.35;
	}
</style>
