const fs = require('fs');
const path = 'd:\\Cecilia web\\index.html';

try {
    let content = fs.readFileSync(path, 'utf8');

    // Define the start and end markers
    const startMarker = '<!-- Instagram Button - Moved out of content to avoid overlap -->';
    const endMarker = 'Seguime en Instagram! &rarr;\r\n            </a>'; // Using \r\n for windows or just </a>

    // Find start index
    const startIndex = content.indexOf(startMarker);

    if (startIndex === -1) {
        console.log('Start marker not found');
        process.exit(1);
    }

    // Find end index (start search from startIndex)
    // We look for the closing </a> tag of that specific block
    const closingTag = '</a>';
    const endIndex = content.indexOf(closingTag, startIndex);

    if (endIndex === -1) {
        console.log('End marker not found');
        process.exit(1);
    }

    // Calculate full removal range including the closing tag
    // We want to remove up to endIndex + closingTag.length
    const finalIndex = endIndex + closingTag.length;

    // Create new content
    const newContent = content.slice(0, startIndex) + content.slice(finalIndex);

    fs.writeFileSync(path, newContent, 'utf8');
    console.log('Successfully removed duplicate block.');

} catch (err) {
    console.error('Error:', err);
    process.exit(1);
}
