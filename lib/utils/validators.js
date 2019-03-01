import * as _ from 'lodash';
import supportedViewports from '../devices';

const supportedFormats = ['pdf', 'png', 'jpeg', 'bmp', 'ppm'];
const viewportsNames = _.map(supportedViewports, 'name');
const viewportStringPattern = /^(\d{1,4})(?:x)?(\d{1,4})?$/;

export function isValidViewport(input) {
	if (_.isString(input)) {
		if (viewportStringPattern.test(input)) {
			return true;
		}

		return viewportsNames.includes(input.replace(/\s+/g, '-').toLowerCase());
	}

	if (_.isArray(input)) {
		return _.every(input, isValidViewport);
	}

	if (_.isNumber(input)) {
		return true;
	}

	return false;
}

export function validateViewport(v) {
	if (_.isString(v) && v.indexOf(',') > -1) {
		v = v.split(',');
	}

	if (!isValidViewport(v)) {
		throw new Error(
			`Viewport ${v} is not supported, check the documentation to see which values are supported`
		);
	}

	return v;
}

export function validateFormat(v) {
	v = v.toLowerCase();
	if (supportedFormats.includes(v)) {
		return v;
	}

	throw new Error(
		`Format ${v} is not supported, must be one of [${supportedFormats.join(
			','
		)}]`
	);
}
