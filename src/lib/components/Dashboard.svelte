<script>
	let {
		latestActivity,
		walkMinutes,
		foodCount,
		formatActivity,
		isLoading = false,
		hasDogs = true
	} = $props();
</script>

<section class="hero-panel" aria-label="Tagesübersicht">
	<div class="hero-copy">
		<span class="status-pill">{isLoading ? 'Lade Daten' : hasDogs ? 'Alles im Blick' : 'Start'}</span>
		<h2>
			{#if isLoading}
				Die Aktivitäten werden geladen.
			{:else if !hasDogs}
				Erfasse zuerst deinen Hund.
			{:else if latestActivity}
				{latestActivity.dogName} wurde zuletzt mit "{latestActivity.type}" erfasst.
			{:else}
				Noch kein Eintrag für heute.
			{/if}
		</h2>
		<p>
			{#if !hasDogs}
				Füge auf Home deinen ersten Hund hinzu. Danach kannst du Aktivitäten dokumentieren.
			{:else if latestActivity}
				{formatActivity(latestActivity)}{latestActivity.note ? ` · ${latestActivity.note}` : ''}
			{:else}
				Starte mit einer schnellen Aktivität.
			{/if}
		</p>
	</div>

	<div class="dog-portrait" aria-hidden="true">
		<svg viewBox="0 0 220 180">
			<rect class="schedule-card" x="20" y="30" width="86" height="96" rx="22" />
			<path class="card-ring" d="M34 52h58" />
			<path class="card-ring" d="M34 70h30" />
			<path class="card-ring" d="M34 88h42" />
			<path class="card-ring" d="M34 106h24" />
			<circle class="check-dot" cx="87" cy="52" r="11" />
			<path class="check" d="m82 52 3 3 7-8" />
			<path
				class="dog-body"
				d="M119 96c7-17 24-28 43-28 18 0 33 10 39 27 6 15 2 33-10 45-13 14-34 18-52 11-21-8-31-31-20-55Z"
			/>
			<path class="dog-head" d="M132 87c1-18 16-32 34-32 21 0 34 15 32 35-2 19-18 33-37 32-17-1-30-17-29-35Z" />
			<path class="dog-ear" d="M149 70c-7-19 3-35 17-36 10-1 11 18 6 28-5 11-15 18-23 8Z" />
			<path class="dog-snout" d="M168 96c10-8 27-5 31 6 4 12-8 22-21 20-11-2-19-16-10-26Z" />
			<circle class="dog-eye" cx="172" cy="74" r="4" />
			<path class="dog-nose" d="M190 102c4 0 8 3 8 7s-4 7-8 7-8-3-8-7 4-7 8-7Z" />
			<path class="dog-leg" d="M132 133h15v24h-15Z" />
			<path class="dog-leg" d="M170 130h15v27h-15Z" />
			<path class="tail" d="M115 100c-22 0-36-14-32-29 2-7 11-7 15-1 4 7 10 11 21 12" />
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
		border: 1px solid #dfe4dd;
		border-radius: 16px;
		background: #ffffff;
		box-shadow: 0 16px 40px rgba(16, 24, 40, 0.08);
	}

	.hero-panel {
		min-height: 190px;
		display: grid;
		grid-template-columns: 1fr 150px;
		gap: 12px;
		overflow: hidden;
		padding: 20px;
		background: linear-gradient(145deg, #ffffff 0%, #f4faf7 100%);
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
		background: #eef6f3;
		color: #1f5f57;
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
		color: #66707a;
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

	.schedule-card {
		fill: #fff6eb;
		stroke: #e6d3bd;
		stroke-width: 2;
	}

	.card-ring,
	.check {
		fill: none;
		stroke: #c58a5d;
		stroke-width: 6;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.check-dot {
		fill: #d7a46f;
	}

	.dog-body {
		fill: #8a6047;
	}

	.dog-head {
		fill: #a87156;
	}

	.dog-ear,
	.dog-snout {
		fill: #cf9a73;
	}

	.dog-nose,
	.dog-eye {
		fill: #18211c;
	}

	.dog-leg {
		fill: #8a6047;
	}

	.tail {
		fill: none;
		stroke: #8a6047;
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
		color: #66707a;
		font-size: 0.78rem;
		line-height: 1.25;
	}

	.stat-card strong {
		display: block;
		margin-top: 10px;
		font-size: 1.15rem;
		line-height: 1.1;
	}

	@media (max-width: 380px) {
		.hero-panel {
			grid-template-columns: 1fr;
			gap: 4px;
			padding: 18px;
		}

		.hero-copy {
			justify-content: flex-start;
		}

		h2 {
			font-size: 1.35rem;
		}

		.dog-portrait {
			justify-self: end;
			margin-top: -12px;
		}

		.dog-portrait svg {
			width: 148px;
			height: 120px;
		}

		.stats-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
