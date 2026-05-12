<script>
	let { activities = [], formatActivity, clearActivities } = $props();
</script>

<section class="timeline-panel" aria-labelledby="timeline-title">
	<div class="section-heading">
		<div>
			<p class="eyebrow">Verlauf</p>
			<h2 id="timeline-title">Letzte Einträge</h2>
		</div>
		<button class="text-button" type="button" onclick={clearActivities}>Leeren</button>
	</div>

	<div class="timeline">
		{#if activities.length === 0}
			<div class="empty-state">Noch keine Aktivitäten erfasst.</div>
		{:else}
			{#each activities as activity}
				<article class="timeline-item">
					<div class="timeline-icon">{activity.type.slice(0, 1)}</div>
					<div>
						<h3>{activity.dogName} · {activity.type}</h3>
						<p>{formatActivity(activity)}</p>
						<p>{activity.note || 'Keine Notiz'}</p>
					</div>
				</article>
			{/each}
		{/if}
	</div>
</section>

<style>
	.timeline-panel {
		border: 1px solid #e3d8c9;
		border-radius: 8px;
		background: #fffaf2;
		box-shadow: 0 18px 44px rgba(40, 33, 24, 0.12);
		padding: 18px;
		margin-top: 14px;
	}

	.section-heading {
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

	.text-button {
		border: 0;
		background: transparent;
		color: #28756c;
		font-weight: 900;
	}

	.timeline {
		display: grid;
		gap: 12px;
		margin-top: 16px;
	}

	.timeline-item {
		display: grid;
		grid-template-columns: 40px 1fr;
		gap: 12px;
		padding: 12px 0;
		border-top: 1px solid #eee3d6;
	}

	.timeline-icon {
		width: 40px;
		height: 40px;
		display: grid;
		place-items: center;
		border-radius: 8px;
		background: #28756c;
		color: white;
		font-weight: 900;
	}

	h3,
	p {
		margin: 0;
	}

	h3 {
		font-size: 0.96rem;
	}

	.timeline-item p {
		margin-top: 3px;
		color: #6a716c;
		font-size: 0.86rem;
		line-height: 1.35;
	}

	.empty-state {
		border: 1px dashed #d6c5a8;
		border-radius: 8px;
		color: #6a716c;
		padding: 18px;
		text-align: center;
	}
</style>
