import type { Config, Context } from '@netlify/functions';
import { MongoClient, ObjectId } from 'mongodb';

type ActivityInput = {
	dogName?: string;
	type?: string;
	amount?: number;
	time?: string;
	note?: string;
	createdAt?: number;
};

declare const Netlify: {
	env: {
		get(key: string): string | undefined;
	};
};

declare const process: {
	env: Record<string, string | undefined>;
};

let clientPromise: Promise<MongoClient> | undefined;

function json(data: unknown, status = 200) {
	return Response.json(data, {
		status,
		headers: {
			'Cache-Control': 'no-store'
		}
	});
}

function getClient() {
	const uri = Netlify.env.get('MONGODB_URI') ?? process.env.MONGODB_URI;
	if (!uri) {
		throw new Error('MONGODB_URI fehlt');
	}

	if (!clientPromise) {
		clientPromise = new MongoClient(uri).connect();
	}

	return clientPromise;
}

function cleanActivity(input: ActivityInput) {
	const dogName = typeof input.dogName === 'string' && input.dogName.trim() ? input.dogName.trim() : 'Milo';
	const type = ['Gassi', 'Futter', 'Pflege'].includes(String(input.type)) ? String(input.type) : 'Gassi';
	const amount = Number.isFinite(Number(input.amount)) ? Math.max(1, Number(input.amount)) : 1;
	const time = typeof input.time === 'string' && input.time ? input.time : new Date().toTimeString().slice(0, 5);
	const note = typeof input.note === 'string' ? input.note.trim().slice(0, 180) : '';
	const createdAt = Number.isFinite(Number(input.createdAt)) ? Number(input.createdAt) : Date.now();

	return { dogName, type, amount, time, note, createdAt };
}

async function collection() {
	const client = await getClient();
	return client.db('dogtracker').collection('activities');
}

export default async (req: Request, _context: Context) => {
	try {
		const activities = await collection();

		if (req.method === 'GET') {
			const items = await activities
				.find({})
				.sort({ createdAt: -1 })
				.limit(50)
				.map((item) => ({ ...item, _id: item._id.toString() }))
				.toArray();

			return json({ activities: items });
		}

		if (req.method === 'POST') {
			const activity = cleanActivity(await req.json());
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
				await activities.deleteOne({ _id: new ObjectId(id) });
			} else {
				await activities.deleteMany({});
			}

			return json({ ok: true });
		}

		return json({ message: 'Methode nicht erlaubt' }, 405);
	} catch (error) {
		return json(
			{ message: error instanceof Error ? error.message : 'Unbekannter Fehler' },
			500
		);
	}
};

export const config: Config = {
	path: '/api/activities'
};
