// scripts/generate-meta.js
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

function generateMeta() {
  const productsPath = path.join(process.cwd(), 'content', 'products');
  const categories = fs.readdirSync(productsPath);

  categories.forEach(category => {
    const categoryPath = path.join(productsPath, category);
    if (!fs.statSync(categoryPath).isDirectory()) return;

    const meta = {};
    
    // Обрабатываем файлы в категории
    const files = fs.readdirSync(categoryPath);
    
    files.forEach(file => {
      if (file.endsWith('.mdx')) {
        const filePath = path.join(categoryPath, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const { data } = matter(content);
        
        const key = file.replace('.mdx', '');
        meta[key] = data.title || key;
      }
    });

    // Записываем _meta.json
    const metaPath = path.join(categoryPath, '_meta.json');
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
    console.log(`Generated ${metaPath}`);
  });
}

generateMeta();