const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

console.log('[1/3] Biên dịch TypeScript cho bot core...');
execSync('tsc -p tsconfig.build.json', { stdio: 'inherit' });

const tempOut = path.join(os.tmpdir(), 'autoquest-build');
console.log(`[2/3] Đóng gói Portable EXE qua thư mục tạm: ${tempOut}...`);
execSync(`npx electron-builder --win portable --config.directories.output="${tempOut.replace(/\\/g, '/')}"`, {
	stdio: 'inherit'
});

const builtExe = path.join(tempOut, 'AutoQuest-1.0.0-x64-portable.exe');
const targetDir = path.join(__dirname, '..', 'release');
if (!fs.existsSync(targetDir)) {
	fs.mkdirSync(targetDir, { recursive: true });
}
const targetExe = path.join(targetDir, 'AutoQuest-1.0.0-x64-portable.exe');

console.log(`[3/3] Sao chép file EXE vào thư mục dự án: ${targetExe}...`);
fs.copyFileSync(builtExe, targetExe);

console.log('\n Hoàn tất! File thực thi sẵn sàng tại:\n' + targetExe);
