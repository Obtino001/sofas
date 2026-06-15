const fs = require('fs');
const path = require('path');
const dir = 'c:/Users/Yasir/Pictures/world-of-comfort/sofas/sections';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.liquid'));
let updatedCount = 0;

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // This regex matches "type": "richtext", followed by whitespace/newlines, followed by "id": "title" or "id": "heading"
  const regex1 = /"type"\s*:\s*"richtext"(\s*,\s*"id"\s*:\s*"(?:title|heading[^"]*)")/g;
  
  // Sometimes "id" comes before "type"
  const regex2 = /("id"\s*:\s*"(?:title|heading[^"]*)"\s*,\s*)"type"\s*:\s*"richtext"/g;
  
  let changed = false;
  if (regex1.test(content)) {
    content = content.replace(regex1, '"type": "inline_richtext"$1');
    changed = true;
  }
  if (regex2.test(content)) {
    content = content.replace(regex2, '$1"type": "inline_richtext"');
    changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('Updated ' + file);
    updatedCount++;
  }
}
console.log('Total files updated: ' + updatedCount);
