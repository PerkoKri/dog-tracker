<script>
	let { activeView = 'home', onNavigate } = $props();

	const items = [
		{
			id: 'home',
			label: 'Home',
			path: 'M4 11 12 4l8 7v8H4Z'
		},
		{
			id: 'capture',
			label: 'Erfassen',
			path: 'M5 12h14'
		},
		{
			id: 'planner',
			label: 'Planer',
			path: 'M7 3v4'
		},
		{
			id: 'stats',
			label: 'Statistik',
			path: 'M4 19V5'
		}
	];
</script>

<nav class="bottom-nav" aria-label="Hauptnavigation">
	{#each items as item}
		<button
			class:active={activeView === item.id}
			type="button"
			aria-current={activeView === item.id ? 'page' : undefined}
			onclick={() => onNavigate(item.id)}
		>
			<svg viewBox="0 0 24 24" aria-hidden="true">
				{#if item.id === 'capture'}
					<path d={item.path} /><path d="M12 5v14" />
				{:else if item.id === 'planner'}
					<path d={item.path} /><path d="M17 3v4" /><path d="M4 9h16" /><path d="M5 5h14v15H5Z" />
				{:else if item.id === 'stats'}
					<path d={item.path} /><path d="M8 17v-6" /><path d="M13 17V7" /><path d="M18 17v-9" />
				{:else}
					<path d={item.path} />
				{/if}
			</svg>
			{item.label}
		</button>
	{/each}
</nav>

<style>
	.bottom-nav {
		position: fixed;
		right: 0;
		bottom: 0;
		left: 0;
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		width: min(100%, 460px);
		margin: 0 auto;
		border-top: 1px solid #dfe4dd;
		background: rgba(255, 255, 255, 0.94);
		backdrop-filter: blur(14px);
		box-shadow: 0 -8px 30px rgba(16, 24, 40, 0.08);
	}

	.bottom-nav button {
		min-height: 70px;
		display: grid;
		place-items: center;
		gap: 4px;
		border: 0;
		background: transparent;
		color: #6b7280;
		font-size: 0.76rem;
		font-weight: 800;
	}

	.bottom-nav .active {
		color: #2c6f67;
		background: #eef6f3;
		border-top: 2px solid #2c6f67;
	}
</style>
