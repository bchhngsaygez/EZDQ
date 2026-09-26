'use strict';

/**
 * Sinh icon app: tao mot file .ico nhieu kich thuoc tu he sinh.
 * Chay: node tools/make-icon.js
 */

const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const SIZES = [16, 24, 32, 48, 64, 128, 256];

function crc32(buf) {
	let table = crc32.table;
	if (!table) {
		table = crc32.table = new Int32Array(256);
		for (let n = 0; n < 256; n++) {
			let c = n;
			for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
			table[n] = c;
		}
	}
	let crc = -1;
	for (let i = 0; i < buf.length; i++) {
		crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
	}
	return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
	const len = Buffer.alloc(4);
	len.writeUInt32BE(data.length, 0);
	const typeBuf = Buffer.from(type, 'ascii');
	const crcBuf = Buffer.alloc(4);
	crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
	return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function mix(a, b, t) {
	return [
		Math.round(a[0] + (b[0] - a[0]) * t),
		Math.round(a[1] + (b[1] - a[1]) * t),
		Math.round(a[2] + (b[2] - a[2]) * t),
	];
}

/** Ve mot icon deu, mau blurple -> violet, co dau tick. */
function drawIcon(size) {
	const px = new Uint8Array(size * size * 4);
	const c = (size - 1) / 2;
	const radius = size * 0.22;
	const stroke = Math.max(2, size * 0.09);
	const from = [0x58, 0x65, 0xf2];
	const to = [0x8b, 0x5c, 0xff];

	const put = (x, y, r, g, b, a) => {
		const i = (y * size + x) * 4;
		const sa = a / 255;
		const da = px[i + 3] / 255;
		const outA = sa + da * (1 - sa);
		if (outA <= 0) return;
		px[i] = Math.round((r * sa + px[i] * da * (1 - sa)) / outA);
		px[i + 1] = Math.round((g * sa + px[i + 1] * da * (1 - sa)) / outA);
		px[i + 2] = Math.round((b * sa + px[i + 2] * da * (1 - sa)) / outA);
		px[i + 3] = Math.round(outA * 255);
	};

	for (let y = 0; y < size; y++) {
		for (let x = 0; x < size; x++) {
			// hinh vuong bo goc (signed distance)
			const dx = Math.abs(x - c) - (c - radius);
			const dy = Math.abs(y - c) - (c - radius);
			const d =
				Math.min(Math.max(dx, dy), 0) +
				Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) -
				radius;
			const aa = 0.9;
			const alpha = Math.round(
				Math.min(1, Math.max(0, 0.5 - d / aa)) * 255,
			);
			if (alpha <= 0) continue;
			const [r, g, b] = mix(from, to, (x + y) / (2 * size));
			put(x, y, r, g, b, alpha);
		}
	}

	// ve dau tick
	const pts = [
		[0.28, 0.53],
		[0.43, 0.68],
		[0.73, 0.34],
	];
	const distToSeg = (px_, py, ax, ay, bx, by) => {
		const dx = bx - ax;
		const dy = by - ay;
		const l2 = dx * dx + dy * dy;
		let t = l2 === 0 ? 0 : ((px_ - ax) * dx + (py - ay) * dy) / l2;
		t = Math.min(1, Math.max(0, t));
		return Math.hypot(px_ - (ax + t * dx), py - (ay + t * dy));
	};
	const half = stroke / 2;
	for (let y = 0; y < size; y++) {
		for (let x = 0; x < size; x++) {
			const nx = x / size;
			const ny = y / size;
			let d = Infinity;
			for (let i = 0; i < pts.length - 1; i++) {
				d = Math.min(
					d,
					distToSeg(
						nx,
						ny,
						pts[i][0],
						pts[i][1],
						pts[i + 1][0],
						pts[i + 1][1],
					),
				);
			}
			const alpha = Math.round(
				Math.min(1, Math.max(0, half - d)) * 255,
			);
			if (alpha > 0) put(x, y, 255, 255, 255, alpha);
		}
	}

	const raw = Buffer.alloc(size * (size * 4 + 1));
	let p = 0;
	for (let y = 0; y < size; y++) {
		raw[p++] = 0;
		for (let x = 0; x < size; x++) {
			const i = (y * size + x) * 4;
			raw[p++] = px[i];
			raw[p++] = px[i + 1];
			raw[p++] = px[i + 2];
			raw[p++] = px[i + 3];
		}
	}
	return raw;
}

function pngFromRaw(raw, size) {
	const ihdr = Buffer.alloc(13);
	ihdr.writeUInt32BE(size, 0);
	ihdr.writeUInt32BE(size, 4);
	ihdr[8] = 8;
	ihdr[9] = 6;
	return Buffer.concat([
		Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
		chunk('IHDR', ihdr),
		chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
		chunk('IEND', Buffer.alloc(0)),
	]);
}

function buildIco(images) {
	const header = Buffer.alloc(6);
	header.writeUInt16LE(0, 0);
	header.writeUInt16LE(1, 2);
	header.writeUInt16LE(images.length, 4);
	const entries = [];
	let offset = 6 + images.length * 16;
	for (const { size, data } of images) {
		const entry = Buffer.alloc(16);
		entry[0] = size >= 256 ? 0 : size;
		entry[1] = size >= 256 ? 0 : size;
		entry[2] = 0;
		entry[3] = 0;
		entry.writeUInt16LE(1, 4);
		entry.writeUInt16LE(32, 6);
		entry.writeUInt32LE(data.length, 8);
		entry.writeUInt32LE(offset, 12);
		entries.push(entry);
		offset += data.length;
	}
	return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

const outDir = path.join(__dirname, '..', 'resources');
fs.mkdirSync(outDir, { recursive: true });
const pngPath = path.join(outDir, 'icon.png');
const icoPath = path.join(outDir, 'icon.ico');
const rendererPng = path.join(__dirname, '..', 'electron', 'renderer', 'icon.png');

if (fs.existsSync(pngPath) && fs.statSync(pngPath).size > 10000) {
	console.log('Phat hien icon.png chat luong cao da co san.');
	try {
		const { execSync } = require('node:child_process');
		execSync(`python -c "from PIL import Image; im=Image.open(r'${pngPath}'); im.save(r'${icoPath}', format='ICO', sizes=[(16,16),(24,24),(32,32),(48,48),(64,64),(128,128),(256,256)])"`, { stdio: 'inherit' });
		console.log('Da cap nhat resources/icon.ico tu icon.png');
	} catch (e) {
		console.log('Giu nguyen icon.ico hien tai.');
	}
	try {
		fs.copyFileSync(pngPath, rendererPng);
	} catch {}
	return;
}

const images = SIZES.map((size) => ({
	size,
	data: pngFromRaw(drawIcon(size), size),
}));

fs.writeFileSync(icoPath, buildIco(images));
fs.writeFileSync(pngPath, images[images.length - 1].data);
try {
	fs.copyFileSync(pngPath, rendererPng);
} catch {}
console.log('Da tao resources/icon.ico va resources/icon.png');
