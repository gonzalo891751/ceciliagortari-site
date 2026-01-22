const fs = require('fs');
const path = require('path');

function convertFile(filePath) {
    try {
        const buffer = fs.readFileSync(filePath);
        // detection logic is hard, but we know it's likely UTF-16LE if it starts with FF FE
        // or just read as utf16le and write as utf8
        let content;
        if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
            content = fs.readFileSync(filePath, 'utf16le');
        } else {
            content = fs.readFileSync(filePath, 'utf8'); // Assume utf8 or ansi
        }

        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Converted: ${filePath}`);
    } catch (e) {
        console.error(`Error converting ${filePath}:`, e);
    }
}

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (file.endsWith('.html')) {
            convertFile(fullPath);
        }
    }
}

processDir('_restore');
