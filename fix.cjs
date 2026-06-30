const fs = require('fs');
let code = fs.readFileSync('src/connection.js', 'utf8');
code = code.replace('"ScravBotNAI"', '"SCRAVBOT"');
fs.writeFileSync('src/connection.js', code, 'utf8');
console.log('Fixed src/connection.js');
