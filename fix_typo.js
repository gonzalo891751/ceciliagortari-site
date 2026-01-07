const fs = require('fs');
const path = 'd:\\Cecilia web\\index.html';

try {
    let content = fs.readFileSync(path, 'utf8');
    const target = 'animamos a transformas';
    const replacement = 'animamos a transformar';

    if (content.includes(target)) {
        const newContent = content.replace(target, replacement);
        fs.writeFileSync(path, newContent, 'utf8');
        console.log('Successfully fixed typo.');
    } else {
        console.log('Target string not found.');
    }
} catch (err) {
    console.error('Error:', err);
    process.exit(1);
}
