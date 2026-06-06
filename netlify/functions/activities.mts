import type { Config, Context } from '@netlify/functions';
import { deleteCloudFile, getAuthUser, getDatabase, json, toObjectId } from './_shared';

type ActivityInput = {
	dogName?: string;
	type?: string;
	title?: string;
	amount?: number;
	unit?: string;
	date?: string;
	time?: string;
	endTime?: string;
	note?: string;
	mealType?: string;
	careType?: string;
	medicationName?: string;
	dose?: number;
	dosage?: string;
	vetReason?: string;
	vetClinic?: string;
	attachment?: {
		name?: string;
		type?: string;
		size?: number;
		key?: string;
		url?: string;
	};
	createdAt?: number;
};

const allowedTypes = ['Gassi', 'Futter', 'Pflege', 'Medikament', 'Arzt'];

function cleanString(value: unknown, maxLength = 120) {
	return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function cleanAmount(type: string, value: unknown) {
	const amount = Number(value);
	if (type === 'Pflege') return Math.min(180, Math.max(1, Number.isFinite(amount) ? amount : 20));
	if (['Futter', 'Gassi', 'Medikament'].includes(type)) return Number.isFinite(amount) && amount > 0 ? amount : 0;
	return 0;
}

function cleanAttachment(input: ActivityInput['attachment']) {
	if (!input || typeof input !== 'object') return null;
	const name = cleanString(input.name, 100);
	const type = cleanString(input.type, 80) || 'application/octet-stream';
	const size = Number.isFinite(Number(input.size)) ? Number(input.size) : 0;
	const key = cleanString(input.key, 600);
	const url = cleanString(input.url, 900);

	if (!name || !key || !url.startsWith('/api/files?')) return null;

	return { name, type, size, key, url };
}

function cleanActivity(input: ActivityInput, userId: string) {
	const dogName = typeof input.dogName === 'string' && input.dogName.trim() ? input.dogName.trim() : '';
	const type = allowedTypes.includes(String(input.type)) ? String(input.type) : 'Gassi';
	const amount = cleanAmount(type, input.amount);
	const date = cleanString(input.date, 10) || new Date().toISOString().slice(0, 10);
	const time = typeof input.time === 'string' && input.time ? input.time : new Date().toTimeString().slice(0, 5);
	const endTime = cleanString(input.endTime, 5);
	const note = typeof input.note === 'string' ? input.note.trim().slice(0, 180) : '';
	const title = cleanString(input.title, 120) || (type === 'Futter' ? 'Futter' : type === 'Medikament' ? 'Medikament' : type === 'Gassi' ? 'Gassi gehen' : type === 'Arzt' ? 'Termin' : '');
	const createdAt = Number.isFinite(Number(input.createdAt)) ? Number(input.createdAt) : Date.now();
	const unit =
		cleanString(input.unit, 40) ||
		(type === 'Futter' ? 'Portion' : type === 'Medikament' ? 'Tablette' : type === 'Gassi' ? 'Minuten' : type === 'Pflege' ? 'min' : '');
	const dose = Number.isFinite(Number(input.dose)) && Number(input.dose) > 0 ? Number(input.dose) : 0;

	return {
		userId,
		dogName,
		type,
		title,
		amount,
		unit,
		date,
		time,
		endTime,
		note,
		mealType: cleanString(input.mealType, 30),
		careType: cleanString(input.careType, 30),
		medicationName: cleanString(input.medicationName, 80),
		dose,
		dosage: cleanString(input.dosage, 80),
		vetReason: cleanString(input.vetReason, 80),
		vetClinic: cleanString(input.vetClinic, 80),
		attachment: cleanAttachment(input.attachment),
		createdAt
	};
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
			if (!activity.dogName) return json({ message: 'Bitte zuerst einen Hund erfassen.' }, 400);
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
				const activity = await activities.findOne({ _id: toObjectId(id), userId: authUser.id });
				await activities.deleteOne({ _id: toObjectId(id), userId: authUser.id });
				await deleteCloudFile(activity?.attachment?.key, authUser.id);
			} else {
				const items = await activities
					.find({ userId: authUser.id, 'attachment.key': { $exists: true } })
					.project<{ attachment?: { key?: string } }>({ attachment: 1 })
					.toArray();
				await activities.deleteMany({ userId: authUser.id });
				await Promise.all(items.map((item) => deleteCloudFile(item.attachment?.key, authUser.id)));
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
