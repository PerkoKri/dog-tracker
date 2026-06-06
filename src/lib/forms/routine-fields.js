export const foodUnitOptions = ['Gramm', 'Milliliter', 'Stück', 'Portion', 'Andere'];
export const medicationUnitOptions = [
	'Tablette',
	'halbe Tablette',
	'Stück',
	'Milligramm',
	'Milliliter',
	'Tropfen',
	'Andere'
];
export const walkDurationUnitOptions = ['Minuten', 'Stunden'];

export const routineDefaults = {
	Futter: {
		amount: 1,
		unitPreset: 'Portion'
	},
	Medikament: {
		amount: 1,
		unitPreset: 'Tablette'
	},
	Gassi: {
		amount: 30,
		unitPreset: 'Minuten'
	}
};

export function resolveUnitValue(preset, custom, fallback = '') {
	const selected = typeof preset === 'string' ? preset.trim() : '';
	if (selected === 'Andere') return typeof custom === 'string' ? custom.trim() : '';
	return selected || fallback;
}

export function unitPresetForValue(value, options, fallback = options[0] || '') {
	const selected = typeof value === 'string' ? value.trim() : '';
	if (!selected) return fallback;
	return options.includes(selected) ? selected : 'Andere';
}

export function formatQuantity(value) {
	const numeric = Number(value || 0);
	if (!Number.isFinite(numeric)) return '0';
	return Number.isInteger(numeric)
		? String(numeric)
		: numeric
				.toFixed(2)
				.replace(/0+$/, '')
				.replace(/\.$/, '');
}

export function durationToMinutes(value, unit = 'Minuten') {
	const numeric = Number(value || 0);
	if (!Number.isFinite(numeric) || numeric <= 0) return 0;
	return unit === 'Stunden' ? Math.round(numeric * 60) : Math.round(numeric);
}

export function displayQuantity(value, unit) {
	const quantity = formatQuantity(value);
	return unit ? `${quantity} ${unit}` : quantity;
}

export function normalizeRoutineText(value, maxLength = 120) {
	return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}
