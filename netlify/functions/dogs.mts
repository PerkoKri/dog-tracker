import type { Config, Context } from '@netlify/functions';
import { deleteCloudFile, getAuthUser, getDatabase, json, toObjectId } from './_shared';

type DogInput = {
	name?: string;
	breed?: string;
	hint?: string;
	feedingSchedules?: Array<{
		id?: string;
		title?: string;
		name?: string;
		time?: string;
		amount?: number;
		unit?: string;
	}>;
	medicationSchedules?: Array<{
		id?: string;
		title?: string;
		name?: string;
		time?: string;
		dose?: number;
		unit?: string;
	}>;
	dossier?: Array<{
		id?: string;
		title?: string;
		file?: {
			key?: string;
			name?: string;
			type?: string;
			size?: number;
			url?: string;
		};
	}>;
	feedingTime?: string;
	feedingAmount?: number;
	feedingUnit?: string;
	feedingTitle?: string;
	walkTime?: string;
	walkDuration?: number;
	walkDurationUnit?: string;
	medicationTitle?: string;
	medicationName?: string;
	medicationTime?: string;
	medicationDosage?: string;
	medicationDose?: number;
	medicationUnit?: string;
};

type DossierInput = NonNullable<DogInput['dossier']>[number];
type DossierFileInput = NonNullable<DossierInput['file']>;

function cleanString(value: unknown, maxLength = 80) {
	return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function randomId() {
	return Math.random().toString(36).slice(2, 10);
}

function normalizeTime(value: unknown, fallback = '') {
	return typeof value === 'string' && /^\d{2}:\d{2}$/.test(value) ? value : fallback;
}

function normalizeAmount(value: unknown, fallback = 0) {
	const number = Number(value);
	return Number.isFinite(number) && number > 0 ? number : fallback;
}

function normalizeFile(file: DossierFileInput | undefined) {
	if (!file) return null;

	const key = cleanString(file.key, 600);
	const name = cleanString(file.name, 120);
	const type = cleanString(file.type, 80);
	const size = Number.isFinite(Number(file.size)) ? Number(file.size) : 0;
	const url = cleanString(file.url, 900);

	if (!key || !name || !url.startsWith('/api/files?')) return null;

	return { key, name, type, size, url };
}

function normalizeDurationUnit(value: unknown) {
	return value === 'Stunden' ? 'Stunden' : 'Minuten';
}

function normalizeFeedingSchedules(input: DogInput) {
	const schedules = Array.isArray(input.feedingSchedules) ? input.feedingSchedules : [];
	const normalized = schedules
		.map((item) => ({
			id: cleanString(item?.id, 40) || randomId(),
			title: cleanString(item?.title, 80) || cleanString(item?.name, 80) || 'Futter',
			name: cleanString(item?.name, 80) || cleanString(item?.title, 80) || 'Futter',
			time: normalizeTime(item?.time),
			amount: normalizeAmount(item?.amount),
			unit: cleanString(item?.unit, 30) || 'Portion'
		}))
		.filter((item) => item.time && item.amount > 0);

	if (normalized.length > 0) return normalized;

	const legacyTime = normalizeTime(input.feedingTime);
	const legacyAmount = normalizeAmount(input.feedingAmount);
	if (!legacyTime || legacyAmount <= 0) return [];

	return [
		{
			id: randomId(),
			time: legacyTime,
			amount: legacyAmount,
			unit: cleanString(input.feedingUnit, 30) || 'Portion',
			title: cleanString(input.feedingTitle, 80) || 'Futter',
			name: cleanString(input.feedingTitle, 80) || 'Futter'
		}
	];
}

function normalizeMedicationSchedules(input: DogInput) {
	const schedules = Array.isArray(input.medicationSchedules) ? input.medicationSchedules : [];
	const normalized = schedules
		.map((item) => ({
			id: cleanString(item?.id, 40) || randomId(),
			title: cleanString(item?.title, 80) || cleanString(item?.name, 80) || 'Medikament',
			name: cleanString(item?.name, 80) || cleanString(item?.title, 80) || 'Medikament',
			time: normalizeTime(item?.time),
			dose: normalizeAmount(item?.dose),
			unit: cleanString(item?.unit, 40) || 'Stück'
		}))
		.filter((item) => item.title && item.time && item.dose > 0);

	if (normalized.length > 0) return normalized;

	const legacyName = cleanString(input.medicationName, 80);
	const legacyTime = normalizeTime(input.medicationTime);
	const legacyDose = normalizeAmount(input.medicationDose, 0);
	if (!legacyName || !legacyTime || legacyDose <= 0) return [];

	return [
		{
			id: randomId(),
			title: legacyName || 'Medikament',
			name: legacyName || 'Medikament',
			time: legacyTime,
			dose: legacyDose,
			unit: cleanString(input.medicationUnit, 40) || cleanString(input.medicationDosage, 40) || 'Stück'
		}
	];
}

function normalizeDossier(input: DogInput) {
	const items = Array.isArray(input.dossier) ? input.dossier : [];
	return items
		.map((item) => {
			const title = cleanString(item?.title, 80);
			const file = normalizeFile(item?.file);
			if (!title || !file) return null;

			return {
				id: cleanString(item?.id, 40) || randomId(),
				title,
				file
			};
		})
		.filter((item): item is { id: string; title: string; file: { key: string; name: string; type: string; size: number; url: string } } => Boolean(item));
}

function formatLegacyDosage(schedule: { dose?: number; unit?: string }) {
	if (!Number.isFinite(Number(schedule.dose)) || Number(schedule.dose) <= 0) return '';
	return `${schedule.dose} ${schedule.unit || ''}`.trim();
}

function cleanDog(input: DogInput, userId: string) {
	const name = cleanString(input.name, 32);
	const breed = cleanString(input.breed, 40);
	const hint = cleanString(input.hint, 140);
	if (!name) throw new Error('Hundename fehlt');
	if (!breed) throw new Error('Rasse fehlt');

	const feedingSchedules = normalizeFeedingSchedules(input);
	const medicationSchedules = normalizeMedicationSchedules(input);
	const dossier = normalizeDossier(input);
	const walkTime = normalizeTime(input.walkTime);
	const walkDuration = normalizeAmount(input.walkDuration) || 30;
	const walkDurationUnit = normalizeDurationUnit(input.walkDurationUnit);
	const firstFeeding = feedingSchedules[0];
	const firstMedication = medicationSchedules[0];

	return {
		userId,
		name,
		breed,
		hint,
		feedingSchedules,
		medicationSchedules,
		dossier,
		walkTime,
		walkDuration,
		walkDurationUnit,
		feedingTime: firstFeeding?.time || '',
		feedingAmount: firstFeeding?.amount || 0,
		feedingUnit: firstFeeding?.unit || '',
		feedingTitle: firstFeeding?.title || firstFeeding?.name || '',
		medicationName: firstMedication?.name || '',
		medicationTitle: firstMedication?.title || firstMedication?.name || '',
		medicationTime: firstMedication?.time || '',
		medicationDose: firstMedication?.dose || 0,
		medicationUnit: firstMedication?.unit || '',
		medicationDosage: firstMedication ? formatLegacyDosage(firstMedication) : '',
		createdAt: Date.now()
	};
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
			for (const item of Array.isArray(dog.dossier) ? dog.dossier : []) {
				await deleteCloudFile(item?.file?.key, authUser.id);
			}
			await db.collection('activities').deleteMany({ userId: authUser.id, dogName: dog.name });
			await db.collection('reminders').deleteMany({ userId: authUser.id, dogName: dog.name });

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
