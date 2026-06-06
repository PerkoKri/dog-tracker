<script>
	let { activities = [], dogs = [], walkMinutes = 0, foodCount = 0 } = $props();

	let careCount = $derived(activities.filter((activity) => activity.type === 'Pflege').length);
	let medicationCount = $derived(activities.filter((activity) => activity.type === 'Medikament').length);
	let vetCount = $derived(activities.filter((activity) => activity.type === 'Arzt').length);
	let totalActivities = $derived(activities.length);
</script>

<section class="stats-panel" aria-labelledby="stats-title">
	<p class="eyebrow">Statistik</p>
	<h2 id="stats-title">Gesamtübersicht</h2>

	<div class="stats-list">
		<article>
			<span>Hunde</span>
			<strong>{dogs.length}</strong>
		</article>
		<article>
			<span>Aktivitäten</span>
			<strong>{totalActivities}</strong>
		</article>
		<article>
			<span>Gassi aktueller Hund</span>
			<strong>{walkMinutes} min</strong>
		</article>
		<article>
			<span>Fütterungen aktueller Hund</span>
			<strong>{foodCount}</strong>
		</article>
		<article>
			<span>Pflege gesamt</span>
			<strong>{careCount}</strong>
		</article>
		<article>
			<span>Medikamente</span>
			<strong>{medicationCount}</strong>
		</article>
		<article>
			<span>Arzttermine</span>
			<strong>{vetCount}</strong>
		</article>
	</div>
</section>

<style>
	.stats-panel {
		border: 1px solid #dfe4dd;
		border-radius: 16px;
		background: #ffffff;
		box-shadow: 0 16px 40px rgba(16, 24, 40, 0.08);
		padding: 18px;
		margin-top: 14px;
	}

	.eyebrow {
		margin: 0 0 4px;
		color: #2c6f67;
		font-size: 0.76rem;
		font-weight: 800;
		text-transform: uppercase;
	}

	h2 {
		margin: 0 0 16px;
		font-size: 1.15rem;
		line-height: 1.2;
	}

	.stats-list {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px;
	}

	article {
		min-height: 78px;
		border: 1px solid #dfe4dd;
		border-radius: 12px;
		background: white;
		padding: 12px;
	}

	span {
		display: block;
		color: #66707a;
		font-size: 0.78rem;
		line-height: 1.25;
	}

	strong {
		display: block;
		margin-top: 8px;
		color: #17211b;
		font-size: 1.25rem;
	}
</style>
