import type { Config, Context } from '@netlify/functions';
import { getAuthUser, getDatabase, json } from './_shared';

type DogInput = {
	name?: string;
	breed?: string;
};

function cleanDog(input: DogInput, userId: string) {
	const name = typeof input.name === 'string' && input.name.trim() ? input.name.trim().slice(0, 32) : '';
	const breed = typeof input.breed === 'string' ? input.breed.trim().slice(0, 40) : '';
	if (!name) throw new Error('Hundename fehlt');
	return { userId, name, breed, createdAt: Date.now() };
}

export default async (req: Request, _context: Context) => {
	try {
		const authUser = getAuthUser(req);
		if (!authUser) return json({ message: 'Nicht eingeloggt' }, 401);

		const db = await getDatabase();
		const dogs = db.collection('dogs');

		if (req.method === 'GET') {
			const items = await dogs
				.find({ userId: authUser.id })
				.sort({ createdAt: 1 })
				.map((item) => ({ ...item, _id: item._id.toString() }))
				.toArray();
			return json({ dogs: items });
		}

		if (req.method === 'POST') {
			const dog = cleanDog(await req.json(), authUser.id);
			const result = await dogs.insertOne(dog);
			return json({ dog: { ...dog, _id: result.insertedId.toString() } }, 201);
		}

		return json({ message: 'Methode nicht erlaubt' }, 405);
	} catch (error) {
		return json({ message: error instanceof Error ? error.message : 'Unbekannter Fehler' }, 500);
	}
};

export const config: Config = {
	path: '/api/dogs'
};
