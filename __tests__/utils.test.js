import prepareViewports from '../lib/utils/prepare-viewports';
import prepareArguments from '../lib/utils/prepare-arguments';

import * as fs from 'fs';

jest.mock('fs', () => ({
	readFileSync: jest.fn().mockImplementation(value => value)
}));

describe('webpage-capture:utils', () => {
	describe('prepare-arguments', () => {
		afterEach(() => {
			fs.readFileSync.mockClear();
		});

		it('return arguments if urls', () => {
			const args = ['http://google.it'];
			expect(prepareArguments(args)).toEqual(args);
		});

		it('tries to load and parse txt files', () => {
			prepareArguments([
				'some/path/to/list.txt'
			]);
			expect(fs.readFileSync).toHaveBeenCalled();
			expect(fs.readFileSync).toHaveBeenCalledWith(expect.stringMatching('list.txt'), 'utf-8');
		});
	});

	describe('prepare-viewports', () => {
		it('return empty array when no match', () => {
			expect(prepareViewports('13456789').length).toBe(0);
		});
		it('support hardcoded cases', () => {
			const cases = [
				'desktop',
				'touch',
				'mobile',
				'landscape'
			];
			for (var i = 0; i < cases.length; i++) {
				expect(prepareViewports(cases[i]).length).not.toBe(0);
			}
		});
		it('filter viewports by input', () => {
			expect(prepareViewports('blackberry').length).not.toBe(0);
		});
	});
});
