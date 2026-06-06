<script>
	let {
		authMode = $bindable('login'),
		name = $bindable(''),
		email = $bindable(''),
		password = $bindable(''),
		passwordConfirm = $bindable(''),
		isAuthenticating = false,
		authMessage = '',
		onSubmit
	} = $props();

	function setMode(nextMode) {
		authMode = nextMode;
		if (nextMode === 'login') passwordConfirm = '';
	}
</script>

<main class="auth-shell">
	<section class="auth-hero" aria-labelledby="auth-title">
		<div class="brand-row">
			<div class="brand-mark" aria-hidden="true">
				<svg viewBox="0 0 42 42">
					<path d="M11 24c2-8 9-13 17-10 6 2 10 8 8 15-2 7-10 11-18 8-6-2-9-7-7-13Z" />
					<path d="M16 16c-2-7 2-12 7-11 3 1 4 7 2 10-2 4-6 6-9 1Z" />
					<circle cx="28" cy="19" r="1.8" />
					<path d="M30 26c3-1 6 1 6 4 0 4-5 5-8 3-3-2-2-6 2-7Z" />
				</svg>
			</div>
			<p class="eyebrow">DogTracker</p>
		</div>
		<h1 id="auth-title">Der Alltag deines Hundes, sauber dokumentiert.</h1>
		<p>Plane Routinen, speichere Einträge und halte wichtige Dokumente an einem Ort.</p>
		<div class="trust-row" aria-label="Kernbereiche">
			<span>Routinen</span>
			<span>Hundeakte</span>
			<span>Verlauf</span>
		</div>
	</section>

	<section class="auth-panel" aria-label="Anmeldung">
		<div class="mode-switch" aria-label="Modus wählen">
			<button type="button" class:active={authMode === 'login'} onclick={() => setMode('login')}>
				Login
			</button>
			<button type="button" class:active={authMode === 'register'} onclick={() => setMode('register')}>
				Registrieren
			</button>
		</div>

		<form
			onsubmit={(event) => {
				event.preventDefault();
				onSubmit();
			}}
		>
			{#if authMode === 'register'}
				<label>
					Name
					<input bind:value={name} autocomplete="name" placeholder="Kristian" />
				</label>
			{/if}

			<label>
				E-Mail
				<input bind:value={email} inputmode="email" autocomplete="email" required />
			</label>

			<label>
				Passwort
				<input
					bind:value={password}
					type="password"
					autocomplete={authMode === 'register' ? 'new-password' : 'current-password'}
					required
				/>
			</label>

			{#if authMode === 'register'}
				<label>
					Passwort wiederholen
					<input bind:value={passwordConfirm} type="password" autocomplete="new-password" required />
				</label>
			{/if}

			{#if authMessage}
				<p class="auth-message">{authMessage}</p>
			{/if}

			<button class="primary-button" type="submit" disabled={isAuthenticating}>
				{#if isAuthenticating}
					Bitte warten...
				{:else if authMode === 'login'}
					Einloggen
				{:else}
					Account erstellen
				{/if}
			</button>
		</form>
	</section>
</main>

<style>
	.auth-shell {
		width: min(100%, 460px);
		min-height: 100vh;
		display: grid;
		align-content: center;
		gap: 16px;
		margin: 0 auto;
		padding: 22px 16px;
		background:
			linear-gradient(180deg, rgba(255, 255, 255, 0.68), rgba(238, 245, 240, 0.94)),
			radial-gradient(circle at 20% 12%, rgba(44, 111, 103, 0.16), transparent 32%);
	}

	.auth-hero,
	.auth-panel {
		border: 1px solid #dfe4dd;
		border-radius: 8px;
		box-shadow: 0 18px 44px rgba(16, 24, 40, 0.1);
		padding: 22px;
	}

	.auth-hero {
		position: relative;
		overflow: hidden;
		background:
			linear-gradient(145deg, rgba(31, 95, 87, 0.98) 0%, rgba(44, 111, 103, 0.98) 100%);
		color: white;
	}

	.auth-hero::after {
		content: '';
		position: absolute;
		right: -36px;
		bottom: -48px;
		width: 160px;
		height: 160px;
		border: 28px solid rgba(255, 255, 255, 0.09);
		border-radius: 50%;
	}

	.brand-row {
		position: relative;
		z-index: 1;
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 14px;
	}

	.brand-mark {
		width: 44px;
		height: 44px;
		display: grid;
		place-items: center;
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.13);
		color: #fff7ed;
	}

	.brand-mark svg {
		width: 34px;
		height: 34px;
		fill: currentColor;
		stroke: none;
	}

	.eyebrow {
		margin: 0;
		color: #cde8e1;
		font-size: 0.76rem;
		font-weight: 800;
		letter-spacing: 0;
		text-transform: uppercase;
	}

	h1,
	p {
		position: relative;
		z-index: 1;
		margin-top: 0;
	}

	h1 {
		margin-bottom: 12px;
		font-size: 1.92rem;
		line-height: 1.08;
	}

	.auth-hero p {
		margin-bottom: 0;
		color: #eef9f4;
		line-height: 1.45;
	}

	.trust-row {
		position: relative;
		z-index: 1;
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 18px;
	}

	.trust-row span {
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.12);
		color: #f5fffb;
		padding: 7px 10px;
		font-size: 0.76rem;
		font-weight: 850;
	}

	.auth-panel {
		background: rgba(255, 255, 255, 0.96);
	}

	.mode-switch {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 6px;
		margin-bottom: 18px;
		border-radius: 8px;
		background: #edf3ef;
		padding: 5px;
	}

	.mode-switch button {
		min-height: 38px;
		border: 0;
		border-radius: 7px;
		background: transparent;
		color: #5f6b66;
		font-weight: 900;
	}

	.mode-switch .active {
		background: white;
		color: #1f5f57;
		box-shadow: 0 10px 24px rgba(16, 24, 40, 0.08);
	}

	form {
		display: grid;
		gap: 14px;
	}

	label {
		display: grid;
		gap: 7px;
		color: #17211b;
		font-size: 0.88rem;
		font-weight: 800;
	}

	input {
		width: 100%;
		min-width: 0;
		max-width: 100%;
		border: 1px solid #dfe4dd;
		border-radius: 8px;
		background: #ffffff;
		color: #17211b;
		padding: 13px 12px;
		outline: none;
	}

	input:focus {
		border-color: #2c6f67;
		box-shadow: 0 0 0 3px rgba(44, 111, 103, 0.12);
	}

	.auth-message {
		margin: 0;
		border-radius: 12px;
		background: #fff4e6;
		color: #86532d;
		padding: 10px 12px;
		font-size: 0.86rem;
		line-height: 1.35;
	}

	.primary-button {
		min-height: 48px;
		border: 0;
		border-radius: 8px;
		background: #2c6f67;
		color: white;
		font-weight: 900;
		box-shadow: 0 12px 22px rgba(44, 111, 103, 0.2);
	}

	.primary-button:disabled {
		opacity: 0.65;
		cursor: wait;
	}
</style>
