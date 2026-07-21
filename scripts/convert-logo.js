const sharp = require('sharp');
const fs = require('fs');

async function convertSvgToPng() {
  try {
    const svgPath = './public/images/logo.svg';
    const pngPath = './public/images/logo.png';
    
    if (!fs.existsSync(svgPath)) {
      console.error('SVG文件不存在');
      return;
    }
    
    const svgBuffer = fs.readFileSync(svgPath);
    
    await sharp(svgBuffer)
      .resize(500, 500)
      .png({ quality: 100 })
      .toFile(pngPath);
    
    console.log('Logo PNG生成成功:', pngPath);
  } catch (error) {
    console.error('转换失败:', error);
  }
}

convertSvgToPng();