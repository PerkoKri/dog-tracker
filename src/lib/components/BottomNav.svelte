<nav class="bottom-nav" aria-label="Hauptnavigation">
	<button class="active" type="button">
		<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11 12 4l8 7v8H4Z" /></svg>
		Home
	</button>
	<button type="button">
		<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
		Erfassen
	</button>
	<button type="button">
		<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V5" /><path d="M8 17v-6" /><path d="M13 17V7" /><path d="M18 17v-9" /></svg>
		Statistik
	</button>
</nav>

<style>
	.bottom-nav {
		position: fixed;
		right: 0;
		bottom: 0;
		left: 0;
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		width: min(100%, 460px);
		margin: 0 auto;
		border-top: 1px solid #e3d8c9;
		background: rgba(255, 250, 242, 0.96);
		backdrop-filter: blur(12px);
	}

	.bottom-nav button {
		min-height: 70px;
		display: grid;
		place-items: center;
		gap: 4px;
		border: 0;
		background: transparent;
		color: #6a716c;
		font-size: 0.76rem;
		font-weight: 800;
	}

	.bottom-nav .active {
		color: #28756c;
	}
</style>
