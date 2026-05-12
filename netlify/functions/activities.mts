import type { Config, Context } from '@netlify/functions';
import { getAuthUser, getDatabase, json, toObjectId } from './_shared';

type ActivityInput = {
	dogName?: string;
	type?: string;
	amount?: number;
	time?: string;
	note?: string;
	createdAt?: number;
};

function cleanActivity(input: ActivityInput, userId: string) {
	const dogName = typeof input.dogName === 'string' && input.dogName.trim() ? input.dogName.trim() : 'Milo';
	const type = ['Gassi', 'Futter', 'Pflege'].includes(String(input.type)) ? String(input.type) : 'Gassi';
	const amount = Number.isFinite(Number(input.amount)) ? Math.max(1, Number(input.amount)) : 1;
	const time = typeof input.time === 'string' && input.time ? input.time : new Date().toTimeString().slice(0, 5);
	const note = typeof input.note === 'string' ? input.note.trim().slice(0, 180) : '';
	const createdAt = Number.isFinite(Number(input.createdAt)) ? Number(input.createdAt) : Date.now();

	return { userId, dogName, type, amount, time, note, createdAt };
}

export default async (req: Request, _context: Context) => {
	try {
		const authUser = getAuthUser(req);
		if (!authUser) return json({ message: 'Nicht eingeloggt' }, 401);

		const db = await getDatabase();
		const activities = db.collection('activities');

		if (req.method === 'GET') {
			const items = await activities
				.find({ userId: authUser.id })
				.sort({ createdAt: -1 })
				.limit(50)
				.map((item) => ({ ...item, _id: item._id.toString() }))
				.toArray();

			return json({ activities: items });
		}

		if (req.method === 'POST') {
			const activity = cleanActivity(await req.json(), authUser.id);
			const result = await activities.insertOne(activity);

			return json({
				activity: {
					...activity,
					_id: result.insertedId.toString()
				}
			}, 201);
		}

		if (req.method === 'DELETE') {
			const url = new URL(req.url);
			const id = url.searchParams.get('id');

			if (id) {
				await activities.deleteOne({ _id: toObjectId(id), userId: authUser.id });
			} else {
				await activities.deleteMany({ userId: authUser.id });
			}

			return json({ ok: true });
		}

		return json({ message: 'Methode nicht erlaubt' }, 405);
	} catch (error) {
		return json({ message: error instanceof Error ? error.message : 'Unbekannter Fehler' }, 500);
	}
};

export const config: Config = {
	path: '/api/activities'
};
