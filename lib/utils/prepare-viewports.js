import * as _ from 'lodash';
import devices from '../devices';

export default function (input) {
	let arr = null;
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
		default:
			console.log('Invalid viewport category', input);
			break;
	}

	return arr;
}
