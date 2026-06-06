import { randomBytes } from 'node:crypto';
import type { Config, Context } from '@netlify/functions';
import {
	fileUrl,
	getAuthUser,
	getFileStore,
	json,
	verifyFileSignature
} from './_shared';

type FileInput = {
	name?: string;
	type?: string;
	size?: number;
	data?: string;
};

const maxFileSize = 3 * 1024 * 1024;
const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'pdf', 'txt', 'doc', 'docx'];

function cleanString(value: unknown, maxLength = 160) {
	return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function cleanFileName(value: unknown) {
	const name = cleanString(value, 120)
		.replace(/[^\w.\- ]+/g, '')
		.replace(/\s+/g, '-');
	return name || `dogtracker-${Date.now()}`;
}

function getExtension(fileName: string) {
	const extension = fileName.split('.').pop()?.toLowerCase() ?? '';
	return allowedExtensions.includes(extension) ? extension : '';
}

function isAllowedFile(name: string, type: string) {
	const extension = getExtension(name);
	if (!extension) return false;
	if (type.startsWith('image/')) return true;
	return [
		'application/pdf',
		'text/plain',
		'application/msword',
		'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		'application/octet-stream'
	].includes(type);
}

function parseDataUrl(input: FileInput) {
	const name = cleanFileName(input.name);
	const type = cleanString(input.type, 100) || 'application/octet-stream';
	const dataUrl = typeof input.data === 'string' ? input.data.trim() : '';

	if (dataUrl.length > 4_500_000) {
		throw new Error('Bitte maximal 3 MB pro Datei hochladen.');
	}

	const match = /^data:([^;,]+);base64,(.+)$/s.exec(dataUrl);

	if (!match) {
		throw new Error('Die Datei konnte nicht gelesen werden.');
	}

	const detectedType = match[1] || type;
	if (!isAllowedFile(name, detectedType)) {
		throw new Error('Bitte nur Bilder, PDF, Text oder Word-Dokumente hochladen.');
	}

	const buffer = Buffer.from(match[2], 'base64');
	if (!buffer.byteLength || buffer.byteLength > maxFileSize) {
		throw new Error('Bitte maximal 3 MB pro Datei hochladen.');
	}

	return {
		name,
		type: detectedType,
		size: buffer.byteLength,
		buffer
	};
}

function arrayBufferFromBuffer(buffer: Buffer) {
	return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
}

function contentDisposition(name: string) {
	return `inline; filename="${name.replace(/"/g, '')}"`;
}

export default async (req: Request, _context: Context) => {
	try {
		const store = getFileStore();

		if (req.method === 'GET') {
			const url = new URL(req.url);
			const key = url.searchParams.get('key') ?? '';
			const signature = url.searchParams.get('signature');
			if (!key) return json({ message: 'Datei fehlt' }, 400);

			const metadataResult = await store.getMetadata(key, { consistency: 'strong' });
			const metadata = metadataResult?.metadata ?? {};
			const userId = typeof metadata.userId === 'string' ? metadata.userId : '';
			if (!userId || !verifyFileSignature(key, userId, signature)) {
				return json({ message: 'Kein Zugriff auf diese Datei' }, 403);
			}

			const data = await store.get(key, { type: 'arrayBuffer', consistency: 'strong' });
			if (!data) return json({ message: 'Datei nicht gefunden' }, 404);

			const name = cleanFileName(metadata.name);
			const type = cleanString(metadata.type, 100) || 'application/octet-stream';
			return new Response(data, {
				headers: {
					'Cache-Control': 'private, max-age=300',
					'Content-Disposition': contentDisposition(name),
					'Content-Type': type
				}
			});
		}

		const authUser = getAuthUser(req);
		if (!authUser) return json({ message: 'Nicht eingeloggt' }, 401);

		if (req.method === 'POST') {
			const file = parseDataUrl((await req.json()) as FileInput);
			const key = `${authUser.id}/${Date.now()}-${randomBytes(8).toString('hex')}-${file.name}`;

			await store.set(key, arrayBufferFromBuffer(file.buffer), {
				metadata: {
					userId: authUser.id,
					name: file.name,
					type: file.type,
					size: file.size,
					uploadedAt: Date.now()
				}
			});

			return json(
				{
					file: {
						key,
						name: file.name,
						type: file.type,
						size: file.size,
						url: fileUrl(key, authUser.id)
					}
				},
				201
			);
		}

		if (req.method === 'DELETE') {
			const url = new URL(req.url);
			const key = url.searchParams.get('key') ?? '';
			if (!key) return json({ message: 'Datei fehlt' }, 400);

			const metadata = await store.getMetadata(key, { consistency: 'strong' });
			if (metadata?.metadata?.userId === authUser.id) {
				await store.delete(key);
			}

			return json({ ok: true });
		}

		return json({ message: 'Methode nicht erlaubt' }, 405);
	} catch (error) {
		return json({ message: error instanceof Error ? error.message : 'Unbekannter Fehler' }, 500);
	}
};

export const config: Config = {
	path: '/api/files'
};
