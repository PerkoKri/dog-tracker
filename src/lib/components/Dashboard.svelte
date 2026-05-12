<script>
	let { latestActivity, walkMinutes, foodCount, formatActivity, isLoading = false } = $props();
</script>

<section class="hero-panel" aria-label="Tagesübersicht">
	<div class="hero-copy">
		<span class="status-pill">{isLoading ? 'Lade Daten' : 'Alles im Blick'}</span>
		<h2>
			{#if isLoading}
				Die Aktivitäten werden geladen.
			{:else if latestActivity}
				{latestActivity.dogName} wurde zuletzt mit "{latestActivity.type}" erfasst.
			{:else}
				Noch kein Eintrag für heute.
			{/if}
		</h2>
		<p>
			{#if latestActivity}
				{formatActivity(latestActivity)}{latestActivity.note ? ` · ${latestActivity.note}` : ''}
			{:else}
				Starte mit einer schnellen Aktivität.
			{/if}
		</p>
	</div>

	<div class="dog-portrait" aria-hidden="true">
		<svg viewBox="0 0 220 180">
			<path class="sun" d="M168 34a22 22 0 1 1-44 0 22 22 0 0 1 44 0Z" />
			<path class="ground" d="M24 144c30-18 55-9 83-4 36 6 56-8 89 8v18H24Z" />
			<path
				class="body"
				d="M63 99c8-25 41-28 61-18 16 8 26 23 26 42 0 18-11 32-28 38-22 8-49 3-62-15-10-14-3-32 3-47Z"
			/>
			<path class="ear" d="M80 76c-5-24 9-43 27-42 12 1 10 24 4 36-7 14-21 21-31 6Z" />
			<path
				class="head"
				d="M72 85c3-23 24-39 47-35 25 5 35 27 27 49-8 24-36 34-57 21-12-8-19-19-17-35Z"
			/>
			<path class="snout" d="M113 96c12-9 31-5 36 8 5 14-10 26-25 23-13-3-22-21-11-31Z" />
			<path class="nose" d="M139 105c5 0 9 3 9 7s-4 7-9 7-9-3-9-7 4-7 9-7Z" />
			<path class="leg" d="M76 145h18v24H76Z" />
			<path class="leg" d="M126 143h18v26h-18Z" />
			<path class="tail" d="M55 105c-21-1-34-14-30-29 2-8 12-7 15 0 3 8 9 13 20 14" />
			<circle class="eye" cx="118" cy="77" r="4" />
		</svg>
	</div>
</section>

<section class="stats-grid" aria-label="Kennzahlen">
	<article class="stat-card">
		<span>Gassi heute</span>
		<strong>{walkMinutes} min</strong>
	</article>
	<article class="stat-card">
		<span>Fütterungen</span>
		<strong>{foodCount}</strong>
	</article>
	<article class="stat-card">
		<span>Letzte Aktivität</span>
		<strong>{latestActivity ? latestActivity.type : '-'}</strong>
	</article>
</section>

<style>
	.hero-panel,
	.stat-card {
		border: 1px solid #e3d8c9;
		border-radius: 8px;
		background: #fffaf2;
		box-shadow: 0 18px 44px rgba(40, 33, 24, 0.12);
	}

	.hero-panel {
		min-height: 190px;
		display: grid;
		grid-template-columns: 1fr 150px;
		gap: 12px;
		overflow: hidden;
		padding: 20px;
	}

	.hero-copy {
		display: flex;
		min-width: 0;
		flex-direction: column;
		justify-content: center;
	}

	.status-pill {
		width: fit-content;
		border-radius: 999px;
		background: #e6f1ec;
		color: #18544d;
		font-size: 0.78rem;
		font-weight: 800;
		padding: 7px 10px;
	}

	h2,
	p {
		margin-top: 0;
	}

	h2 {
		margin: 14px 0 8px;
		font-size: 1.55rem;
		line-height: 1.2;
	}

	p {
		margin-bottom: 0;
		color: #6a716c;
		line-height: 1.45;
	}

	.dog-portrait {
		align-self: end;
	}

	.dog-portrait svg {
		width: 180px;
		height: 150px;
		stroke: none;
	}

	.sun {
		fill: #e6bd61;
	}

	.ground {
		fill: #a9c4a5;
	}

	.body,
	.head,
	.leg {
		fill: #8c5b3f;
	}

	.ear,
	.snout {
		fill: #c98863;
	}

	.nose,
	.eye {
		fill: #18211c;
	}

	.tail {
		fill: none;
		stroke: #8c5b3f;
		stroke-width: 14;
		stroke-linecap: round;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 10px;
		margin: 14px 0;
	}

	.stat-card {
		min-height: 86px;
		padding: 14px 12px;
		box-shadow: none;
	}

	.stat-card span {
		display: block;
		color: #6a716c;
		font-size: 0.78rem;
		line-height: 1.25;
	}

	.stat-card strong {
		display: block;
		margin-top: 10px;
		font-size: 1.15rem;
		line-height: 1.1;
	}
</style>
