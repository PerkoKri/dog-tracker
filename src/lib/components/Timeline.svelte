<script>
	let {
		activities = [],
		formatActivity,
		clearActivities = () => {},
		onDeleteActivity,
		title = 'Letzte Einträge',
		showClear = true
	} = $props();
</script>

<section class="timeline-panel" aria-labelledby="timeline-title">
	<div class="section-heading">
		<div>
			<p class="eyebrow">Verlauf</p>
			<h2 id="timeline-title">{title}</h2>
		</div>
		{#if showClear}
			<button class="text-button" type="button" onclick={clearActivities}>Leeren</button>
		{/if}
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
						{#if activity.attachment}
							{@const attachmentUrl = activity.attachment.url || activity.attachment.data}
							<a
								class="attachment-link"
								href={attachmentUrl}
								download={activity.attachment.name}
								target="_blank"
								rel="noreferrer"
							>
								{#if activity.attachment.type?.startsWith('image/') && attachmentUrl}
									<img src={attachmentUrl} alt={activity.attachment.name} />
								{:else}
									<span class="file-icon">Dok</span>
								{/if}
								<span>{activity.attachment.name}</span>
							</a>
						{/if}
					</div>
					<button
						class="delete-button"
						type="button"
						aria-label={`${activity.dogName} ${activity.type} von ${activity.time} löschen`}
						onclick={() => onDeleteActivity(activity)}
					>
						×
					</button>
				</article>
			{/each}
		{/if}
	</div>
</section>

<style>
	.timeline-panel {
		border: 1px solid #dfe4dd;
		border-radius: 16px;
		background: #ffffff;
		box-shadow: 0 16px 40px rgba(16, 24, 40, 0.08);
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
		color: #2c6f67;
		font-weight: 900;
	}

	.timeline {
		display: grid;
		gap: 12px;
		margin-top: 16px;
	}

	.timeline-item {
		display: grid;
		grid-template-columns: 40px 1fr 34px;
		align-items: start;
		gap: 12px;
		padding: 12px 0;
		border-top: 1px solid #edf3ef;
	}

	.timeline-icon {
		width: 40px;
		height: 40px;
		display: grid;
		place-items: center;
		border-radius: 12px;
		background: #2c6f67;
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
		color: #66707a;
		font-size: 0.86rem;
		line-height: 1.35;
	}

	.attachment-link {
		display: grid;
		grid-template-columns: 44px 1fr;
		align-items: center;
		gap: 8px;
		margin-top: 8px;
		border: 1px solid #dfe4dd;
		border-radius: 12px;
		background: #ffffff;
		color: #1f5f57;
		padding: 7px;
		font-size: 0.82rem;
		font-weight: 850;
		text-decoration: none;
	}

	.attachment-link img,
	.file-icon {
		width: 44px;
		height: 44px;
		border-radius: 7px;
		object-fit: cover;
	}

	.file-icon {
		display: grid;
		place-items: center;
		background: #eef6f3;
		color: #1f5f57;
		font-size: 0.72rem;
	}

	.delete-button {
		width: 34px;
		height: 34px;
		border: 0;
		border-radius: 12px;
		background: #f7dfd8;
		color: #8a2b18;
		font-size: 1.2rem;
		font-weight: 900;
		line-height: 1;
	}

	.empty-state {
		border: 1px dashed #d6dfd8;
		border-radius: 12px;
		color: #66707a;
		padding: 18px;
		text-align: center;
	}
</style>
