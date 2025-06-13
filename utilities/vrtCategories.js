const fs = require('fs');
const path = require('path');

const vrtData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data', 'vulnerability-rating-taxonomy.json'), 'utf8'));
module.exports = vrtData.categories;
