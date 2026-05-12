<script>
	let {
		authMode = $bindable('login'),
		name = $bindable(''),
		email = $bindable('demo@dogtracker.ch'),
		password = $bindable('demo123'),
		isAuthenticating = false,
		authMessage = '',
		onSubmit
	} = $props();
</script>

<main class="auth-shell">
	<section class="auth-hero" aria-labelledby="auth-title">
		<p class="eyebrow">DogTracker</p>
		<h1 id="auth-title">Aktivitäten für deinen Hund im Blick.</h1>
		<p>
			Melde dich an, erfasse Gassi, Futter und Pflege und sieh alle Einträge im persönlichen
			Dashboard.
		</p>
	</section>

	<section class="auth-panel" aria-label="Anmeldung">
		<div class="mode-switch" aria-label="Modus wählen">
			<button type="button" class:active={authMode === 'login'} onclick={() => (authMode = 'login')}>
				Login
			</button>
			<button type="button" class:active={authMode === 'register'} onclick={() => (authMode = 'register')}>
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
				<input bind:value={password} type="password" autocomplete="current-password" required />
			</label>

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
	}

	.auth-hero,
	.auth-panel {
		border: 1px solid #e3d8c9;
		border-radius: 8px;
		background: #fffaf2;
		box-shadow: 0 18px 44px rgba(40, 33, 24, 0.12);
		padding: 22px;
	}

	.auth-hero {
		background: #28756c;
		color: white;
	}

	.eyebrow {
		margin: 0 0 8px;
		color: #d9efe7;
		font-size: 0.76rem;
		font-weight: 800;
		letter-spacing: 0;
		text-transform: uppercase;
	}

	h1,
	p {
		margin-top: 0;
	}

	h1 {
		margin-bottom: 10px;
		font-size: 1.85rem;
		line-height: 1.08;
	}

	.auth-hero p {
		margin-bottom: 0;
		color: #eef9f4;
		line-height: 1.45;
	}

	.mode-switch {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 6px;
		margin-bottom: 18px;
		border-radius: 8px;
		background: #efe7dc;
		padding: 5px;
	}

	.mode-switch button {
		min-height: 38px;
		border: 0;
		border-radius: 6px;
		background: transparent;
		color: #6a716c;
		font-weight: 900;
	}

	.mode-switch .active {
		background: white;
		color: #18544d;
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
		border: 1px solid #e3d8c9;
		border-radius: 8px;
		background: #ffffff;
		color: #17211b;
		padding: 12px;
		outline: none;
	}

	input:focus {
		border-color: #28756c;
		box-shadow: 0 0 0 3px rgba(40, 117, 108, 0.14);
	}

	.auth-message {
		margin: 0;
		border-radius: 8px;
		background: #fff0df;
		color: #6f4d12;
		padding: 10px 12px;
		font-size: 0.86rem;
		line-height: 1.35;
	}

	.primary-button {
		min-height: 48px;
		border: 0;
		border-radius: 8px;
		background: #28756c;
		color: white;
		font-weight: 900;
	}

	.primary-button:disabled {
		opacity: 0.65;
		cursor: wait;
	}
</style>
