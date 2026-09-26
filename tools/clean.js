'use strict';

const fs = require('node:fs');
const path = require('node:path');

const targets = [
	path.join(__dirname, '..', 'electron', 'bot'),
	path.join(__dirname, '..', 'release'),
	path.join(__dirname, '..', 'dist'),
];

for (const dir of targets) {
	try {
		fs.rmSync(dir, { recursive: true, force: true });
	} catch {
		/* ignore if in use */
	}
}
console.log('Da don cac thu muc build cu.');

