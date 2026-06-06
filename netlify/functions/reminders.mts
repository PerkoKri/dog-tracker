import type { Config, Context } from '@netlify/functions';
import { getAuthUser, getDatabase, json, toObjectId } from './_shared';

type ReminderInput = {
	dogName?: string;
	type?: string;
	title?: string;
	date?: string;
	time?: string;
	amount?: number;
	dose?: number;
	unit?: string;
	note?: string;
	mealType?: string;
	medicationName?: string;
	dosage?: string;
	vetClinic?: string;
	recurrence?: string;
	completed?: boolean;
};

const allowedTypes = ['Gassi', 'Futter', 'Pflege', 'Medikament', 'Arzt', 'Allgemein', 'Andere'];

function cleanString(value: unknown, maxLength = 120) {
	return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function todayDate() {
	return new Date().toISOString().slice(0, 10);
}

function cleanReminder(input: ReminderInput, userId: string) {
	const type = allowedTypes.includes(String(input.type)) ? String(input.type) : 'Allgemein';
	const title =
		cleanString(input.title, 80) ||
		(type === 'Futter'
			? 'Futter'
			: type === 'Medikament'
				? 'Medikament'
				: type === 'Gassi'
					? 'Gassi gehen'
					: type === 'Arzt'
						? 'Arzttermin'
						: 'Aufgabe');
	const date = cleanString(input.date, 10) || todayDate();
	const time = cleanString(input.time, 5) || '09:00';
	const completed = Boolean(input.completed);
	const amount = Number.isFinite(Number(input.amount)) && Number(input.amount) > 0 ? Number(input.amount) : 0;
	const dose = Number.isFinite(Number(input.dose)) && Number(input.dose) > 0 ? Number(input.dose) : 0;
	const unit =
		cleanString(input.unit, 30) ||
		(type === 'Futter' ? 'Portion' : type === 'Medikament' ? 'Tablette' : type === 'Gassi' ? 'Minuten' : '');

	return {
		userId,
		dogName: cleanString(input.dogName, 32),
		type,
		title,
		date,
		time,
		amount: type === 'Futter' || type === 'Gassi' ? amount : 0,
		dose: type === 'Medikament' ? dose : 0,
		unit,
		note: cleanString(input.note, 180),
		mealType: cleanString(input.mealType, 30),
		medicationName: type === 'Medikament' ? cleanString(input.medicationName, 80) || title : cleanString(input.medicationName, 80),
		dosage: cleanString(input.dosage, 80),
		vetClinic: cleanString(input.vetClinic, 80),
		recurrence: input.recurrence === 'daily' ? 'daily' : 'once',
		completed,
		completedAt: completed ? Date.now() : null,
		createdAt: Date.now()
	};
}

function serialize(item: Record<string, any>) {
	return { ...item, _id: item._id?.toString() };
}

export default async (req: Request, _context: Context) => {
	try {
		const authUser = getAuthUser(req);
		if (!authUser) return json({ message: 'Nicht eingeloggt' }, 401);

		const db = await getDatabase();
		const reminders = db.collection('reminders');

		if (req.method === 'GET') {
			const items = await reminders
				.find({ userId: authUser.id })
				.sort({ date: 1, time: 1, createdAt: 1 })
				.limit(100)
				.map(serialize)
				.toArray();

			return json({ reminders: items });
		}

		if (req.method === 'POST') {
			const reminder = cleanReminder(await req.json(), authUser.id);
			if (!reminder.dogName && !['Allgemein', 'Andere'].includes(reminder.type)) {
				return json({ message: 'Bitte zuerst einen Hund wählen oder eine allgemeine Aufgabe anlegen.' }, 400);
			}
			const result = await reminders.insertOne(reminder);
			return json({ reminder: { ...reminder, _id: result.insertedId.toString() } }, 201);
		}

		if (req.method === 'PATCH') {
			const url = new URL(req.url);
			const id = url.searchParams.get('id');
			if (!id) return json({ message: 'Erinnerungs-ID fehlt' }, 400);

			const input = (await req.json()) as ReminderInput;
			const completed = Boolean(input.completed);
			await reminders.updateOne(
				{ _id: toObjectId(id), userId: authUser.id },
				{ $set: { completed, completedAt: completed ? Date.now() : null } }
			);

			const item = await reminders.findOne({ _id: toObjectId(id), userId: authUser.id });
			if (!item) return json({ message: 'Erinnerung wurde nicht gefunden' }, 404);
			return json({ reminder: serialize(item) });
		}

		if (req.method === 'DELETE') {
			const url = new URL(req.url);
			const id = url.searchParams.get('id');
			if (!id) return json({ message: 'Erinnerungs-ID fehlt' }, 400);
			await reminders.deleteOne({ _id: toObjectId(id), userId: authUser.id });
			return json({ ok: true });
		}

		return json({ message: 'Methode nicht erlaubt' }, 405);
	} catch (error) {
		return json({ message: error instanceof Error ? error.message : 'Unbekannter Fehler' }, 500);
	}
};

export const config: Config = {
	path: '/api/reminders'
};
