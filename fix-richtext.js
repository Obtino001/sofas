const fs = require('fs');
const path = require('path');
const dir = 'c:/Users/Yasir/Pictures/world-of-comfort/sofas/sections';

const files = fs.readdirSync(dir).filter(f => f.endsWith('.liquid'));
let filesUpdated = 0;

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;

  const schemaRegex = /{% schema %}([\s\S]*?){% endschema %}/;
  const match = content.match(schemaRegex);
  if (match) {
    let schemaStr = match[1];
    try {
      let json = JSON.parse(schemaStr);
      let changed = false;

      function fixRichtext(obj) {
        if (!obj || typeof obj !== 'object') return;
        
        if (Array.isArray(obj)) {
          obj.forEach(fixRichtext);
        } else {
          if (obj.type === 'richtext' && typeof obj.default === 'string') {
            const def = obj.default.trim();
            if (def && !/^<(p|h[1-6]|ul|ol)[^>]*>/.test(def)) {
              obj.default = `<p>${def}</p>`;
              changed = true;
              console.log(`Fixed ${obj.id} in ${file}`);
            }
          }
          
          for (const key in obj) {
            fixRichtext(obj[key]);
          }
        }
      }

      fixRichtext(json);

      if (changed) {
        // preserve the spacing as much as possible if JSON.stringify messes it up
        let newSchemaStr = JSON.stringify(json, null, 2);
        content = content.replace(schemaStr, '\n' + newSchemaStr + '\n');
        fs.writeFileSync(filePath, content, 'utf-8');
        filesUpdated++;
      }
    } catch (e) {
      console.error('Failed to parse JSON for ' + file + ': ' + e.message);
    }
  }
}
console.log('Files updated: ' + filesUpdated);
