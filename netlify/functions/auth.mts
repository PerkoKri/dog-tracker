import type { Config, Context } from '@netlify/functions';
import {
	createToken,
	getAuthUser,
	getDatabase,
	hashPassword,
	json,
	verifyPassword
} from './_shared';

type AuthInput = {
	email?: string;
	name?: string;
	password?: string;
};

function cleanEmail(value: unknown) {
	return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function cleanName(value: unknown, email: string) {
	if (typeof value === 'string' && value.trim()) return value.trim().slice(0, 40);
	return email.split('@')[0] || 'DogTracker User';
}

function publicUser(user: { _id: unknown; email: string; name: string }) {
	return {
		id: String(user._id),
		email: user.email,
		name: user.name
	};
}

export default async (req: Request, _context: Context) => {
	try {
		const url = new URL(req.url);
		const action = url.searchParams.get('action');
		const db = await getDatabase();
		const users = db.collection('users');
		const dogs = db.collection('dogs');

		if (req.method === 'GET') {
			const authUser = getAuthUser(req);
			if (!authUser) return json({ message: 'Nicht eingeloggt' }, 401);
			return json({ user: authUser });
		}

		if (req.method !== 'POST') {
			return json({ message: 'Methode nicht erlaubt' }, 405);
		}

		const input = (await req.json()) as AuthInput;
		const email = cleanEmail(input.email);
		const password = typeof input.password === 'string' ? input.password : '';

		if (!email || !email.includes('@')) return json({ message: 'Bitte eine gültige E-Mail eingeben.' }, 400);
		if (password.length < 6) return json({ message: 'Passwort muss mindestens 6 Zeichen haben.' }, 400);

		if (action === 'register') {
			const existing = await users.findOne({ email });
			if (existing) return json({ message: 'Dieser Account existiert bereits.' }, 409);

			const user = {
				email,
				name: cleanName(input.name, email),
				passwordHash: hashPassword(password),
				createdAt: Date.now()
			};
			const result = await users.insertOne(user);
			const authUser = { id: result.insertedId.toString(), email: user.email, name: user.name };

			await dogs.insertMany([
				{ userId: authUser.id, name: 'Milo', breed: 'Labrador Mix', createdAt: Date.now() },
				{ userId: authUser.id, name: 'Luna', breed: 'Border Collie', createdAt: Date.now() }
			]);

			return json({ user: authUser, token: createToken(authUser) }, 201);
		}

		if (action === 'login') {
			const user = await users.findOne<{ _id: unknown; email: string; name: string; passwordHash: string }>({
				email
			});
			if (!user || !verifyPassword(password, user.passwordHash)) {
				return json({ message: 'E-Mail oder Passwort ist falsch.' }, 401);
			}

			const authUser = publicUser(user);
			return json({ user: authUser, token: createToken(authUser) });
		}

		return json({ message: 'Unbekannte Auth-Aktion' }, 400);
	} catch (error) {
		return json({ message: error instanceof Error ? error.message : 'Unbekannter Fehler' }, 500);
	}
};

export const config: Config = {
	path: '/api/auth'
};
