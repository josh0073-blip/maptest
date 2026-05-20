const fs = require('fs');
const path = require('path');

const backgroundsDir = path.join(__dirname, '../public/bootstrap-backgrounds');
const outputFilePath = path.join(__dirname, '../docs/bootstrap-backgrounds.json');

function generateBackgroundsJSON() {
  try {
    const files = fs.readdirSync(backgroundsDir);
    const imageFiles = files.filter(file => file.endsWith('.png') || file.endsWith('.jpg'));

    fs.writeFileSync(outputFilePath, JSON.stringify(imageFiles, null, 2));
    console.log('bootstrap-backgrounds.json has been generated successfully.');
  } catch (error) {
    console.error('Error generating bootstrap-backgrounds.json:', error);
  }
}

generateBackgroundsJSON();