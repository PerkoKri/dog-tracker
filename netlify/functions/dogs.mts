import type { Config, Context } from '@netlify/functions';
import { getAuthUser, getDatabase, json, toObjectId } from './_shared';

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

		if (req.method === 'DELETE') {
			const url = new URL(req.url);
			const id = url.searchParams.get('id');
			if (!id) return json({ message: 'Hund-ID fehlt' }, 400);

			const dog = await dogs.findOne({ _id: toObjectId(id), userId: authUser.id });
			if (!dog) return json({ message: 'Hund wurde nicht gefunden' }, 404);

			const dogCount = await dogs.countDocuments({ userId: authUser.id });
			if (dogCount <= 1) return json({ message: 'Der letzte Hund kann nicht gelöscht werden.' }, 400);

			await dogs.deleteOne({ _id: toObjectId(id), userId: authUser.id });
			await db.collection('activities').deleteMany({ userId: authUser.id, dogName: dog.name });

			return json({ ok: true });
		}

		return json({ message: 'Methode nicht erlaubt' }, 405);
	} catch (error) {
		return json({ message: error instanceof Error ? error.message : 'Unbekannter Fehler' }, 500);
	}
};

export const config: Config = {
	path: '/api/dogs'
};
