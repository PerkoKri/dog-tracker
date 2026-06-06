import type { Config, Context } from '@netlify/functions';
import { getAuthUser, json } from './_shared';

type Holiday = {
	date: string;
	localName: string;
	name: string;
	global: boolean;
	types?: string[];
};

export default async (req: Request, _context: Context) => {
	const authUser = getAuthUser(req);
	if (!authUser) return json({ message: 'Nicht eingeloggt' }, 401);

	if (req.method !== 'GET') return json({ message: 'Methode nicht erlaubt' }, 405);

	const url = new URL(req.url);
	const year = url.searchParams.get('year') || new Date().getFullYear().toString();
	const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/CH`);

	if (!response.ok) return json({ holidays: [] });

	const holidays = ((await response.json()) as Holiday[]).map((holiday) => ({
		date: holiday.date,
		localName: holiday.localName,
		name: holiday.name,
		global: holiday.global,
		types: holiday.types || []
	}));

	return json({ holidays });
};

export const config: Config = {
	path: '/api/holidays'
};
