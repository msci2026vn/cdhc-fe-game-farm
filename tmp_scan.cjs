const fs = require('fs');
const path = require('path');

const dir = 'd:/du-an/cdhc/cdhc-game-vite/src';

const vietnameseRegex = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ]/;

const filesNeeded = [];

function walkSync(currentDirPath, callback) {
    fs.readdirSync(currentDirPath).forEach(function (name) {
        var filePath = path.join(currentDirPath, name);
        var stat = fs.statSync(filePath);
        if (stat.isFile()) {
            callback(filePath, stat);
        } else if (stat.isDirectory()) {
            walkSync(filePath, callback);
        }
    });
}

walkSync(dir, function (filePath) {
    if (filePath.includes('node_modules') || filePath.includes('.test.') || filePath.includes('.spec.') || filePath.includes('\\contracts\\') || filePath.includes('/contracts/')) return;
    if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) return;

    const content = fs.readFileSync(filePath, 'utf8');

    if (vietnameseRegex.test(content)) {
        filesNeeded.push(filePath);
    } else {
        const matches = content.match(/>[A-Za-z\s]+</g);
        if (matches) {
            let hasTrueText = false;
            for (let m of matches) {
                let text = m.substring(1, m.length - 1).trim();
                if (text.length > 2 && /^[A-Za-z\s]+$/.test(text)) {
                    hasTrueText = true;
                    break;
                }
            }
            if (hasTrueText && filePath.endsWith('.tsx')) {
                filesNeeded.push(filePath);
            }
        }
    }
});

fs.writeFileSync('d:/du-an/cdhc/cdhc-game-vite/files_to_translate_utf8.txt', filesNeeded.join('\n'), 'utf8');
