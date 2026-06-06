import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { getDeployStore, getStore } from '@netlify/blobs';
import { MongoClient, ObjectId } from 'mongodb';

declare const Netlify: {
	env: {
		get(key: string): string | undefined;
	};
};

declare const process: {
	env: Record<string, string | undefined>;
};

let clientPromise: Promise<MongoClient> | undefined;
const fileStoreName = 'dogtracker-files';

export type AuthUser = {
	id: string;
	email: string;
	name: string;
};

export function json(data: unknown, status = 200) {
	return Response.json(data, {
		status,
		headers: {
			'Cache-Control': 'no-store'
		}
	});
}

export function getEnv(key: string) {
	return Netlify.env.get(key) ?? process.env[key];
}

export async function getDatabase() {
	const uri = getEnv('MONGODB_URI');
	if (!uri) {
		throw new Error('MONGODB_URI fehlt');
	}

	if (!clientPromise) {
		clientPromise = new MongoClient(uri).connect();
	}

	const client = await clientPromise;
	return client.db('dog-tracker');
}

export function hashPassword(password: string) {
	const salt = randomBytes(16).toString('hex');
	const hash = scryptSync(password, salt, 64).toString('hex');
	return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
	const [salt, hash] = stored.split(':');
	if (!salt || !hash) return false;

	const candidate = scryptSync(password, salt, 64);
	const original = Buffer.from(hash, 'hex');

	return original.length === candidate.length && timingSafeEqual(original, candidate);
}

function base64url(input: string) {
	return Buffer.from(input).toString('base64url');
}

function sign(value: string) {
	const secret = getEnv('AUTH_SECRET') ?? getEnv('MONGODB_URI') ?? 'dogtracker-dev-secret';
	return createHmac('sha256', secret).update(value).digest('base64url');
}

function safeCompare(left: string, right: string) {
	const leftBuffer = Buffer.from(left);
	const rightBuffer = Buffer.from(right);
	return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function createToken(user: AuthUser) {
	const payload = base64url(JSON.stringify({ ...user, exp: Date.now() + 1000 * 60 * 60 * 24 * 7 }));
	return `${payload}.${sign(payload)}`;
}

export function verifyToken(token: string | null) {
	if (!token) return null;

	const [payload, signature] = token.split('.');
	if (!payload || !signature || !safeCompare(sign(payload), signature)) return null;

	try {
		const user = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as AuthUser & {
			exp?: number;
		};
		if (!user.id || !user.email || !user.name || !user.exp || user.exp < Date.now()) return null;
		return { id: user.id, email: user.email, name: user.name };
	} catch {
		return null;
	}
}

export function getAuthUser(req: Request) {
	const header = req.headers.get('authorization');
	const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
	return verifyToken(token);
}

export function toObjectId(id: string) {
	return new ObjectId(id);
}

export function getFileStore() {
	const options = { consistency: 'strong' as const };
	return getEnv('CONTEXT') === 'production'
		? getStore(fileStoreName, options)
		: getDeployStore(fileStoreName, options);
}

export function createFileSignature(key: string, userId: string) {
	return sign(`${userId}:${key}`);
}

export function verifyFileSignature(key: string, userId: string, signature: string | null) {
	return Boolean(signature) && safeCompare(createFileSignature(key, userId), signature);
}

export function fileUrl(key: string, userId: string) {
	const params = new URLSearchParams({
		key,
		signature: createFileSignature(key, userId)
	});
	return `/api/files?${params.toString()}`;
}

export async function deleteCloudFile(key: string | undefined, userId: string) {
	if (!key) return;

	try {
		const store = getFileStore();
		const metadata = await store.getMetadata(key, { consistency: 'strong' });
		const ownerId = metadata?.metadata?.userId;
		if (ownerId === userId) {
			await store.delete(key);
		}
	} catch {
		// Database deletion should still succeed if the file store is temporarily unavailable.
	}
}
