import * as _ from 'lodash';
import * as fs from 'fs';

export default function (arr) {
	return _.chain(arr).map(i => {
		if (i.endsWith('.html')) {
			return fs.readFileSync(i, 'utf-8');
		}

		if (i.endsWith('.txt')) {
			return fs.readFileSync(i, 'utf-8').trim().split(/\r\n/g);
		}

		return i;
	}).flatten().value();
}
