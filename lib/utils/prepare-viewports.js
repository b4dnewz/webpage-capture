import * as _ from 'lodash';
import devices from '../devices';

export default function (input) {
	let arr = [];

	switch (input) {
		case 'desktop':
			arr = _.filter(devices, ['viewport.isMobile', false]);
			break;
		case 'touch':
			arr = _.filter(devices, ['viewport.hasTouch', true]);
			break;
		case 'mobile':
			arr = _.filter(devices, ['viewport.isMobile', true]);
			break;
		case 'landscape':
			arr = _.filter(devices, ['viewport.isLandscape', true]);
			break;
		default: {
			const reg = new RegExp(input, 'gi');
			arr = _.filter(devices, d => d.name.match(reg));
			break;
		}
	}

	return arr;
}
