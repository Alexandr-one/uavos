const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// Функция для рекурсивного копирования папок
function copyFolderRecursive(source, target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  const items = fs.readdirSync(source);
  
  for (const item of items) {
    const sourcePath = path.join(source, item);
    const targetPath = path.join(target, item);
    const stat = fs.statSync(sourcePath);

    if (stat.isDirectory()) {
      copyFolderRecursive(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

function generateMeta() {
  const sourcePath = path.join(process.cwd(), 'pages', 'products');
  const targetPath = path.join(process.cwd(), 'content', 'products');
  
  console.log('Cleaning target directory (except index.mdx)...');
  
  if (!fs.existsSync(targetPath)) {
    fs.mkdirSync(targetPath, { recursive: true });
  }

  const indexMdxPath = path.join(targetPath, 'index.mdx');
  let indexMdxContent = null;
  
  if (fs.existsSync(indexMdxPath)) {
    indexMdxContent = fs.readFileSync(indexMdxPath, 'utf8');
    console.log('Preserving existing index.mdx');
  }

  // Очищаем целевую папку (кроме index.mdx)
  const items = fs.readdirSync(targetPath);
  items.forEach(item => {
    if (item !== 'index.mdx') {
      const itemPath = path.join(targetPath, item);
      try {
        if (fs.statSync(itemPath).isDirectory()) {
          fs.rmSync(itemPath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(itemPath);
        }
        console.log(`Removed: ${itemPath}`);
      } catch (error) {
        console.warn(`Could not remove ${itemPath}:`, error.message);
      }
    }
  });

  if (indexMdxContent) {
    fs.writeFileSync(indexMdxPath, indexMdxContent);
    console.log('Restored index.mdx');
  }

  const mainMeta = {};
  const categoryFolders = new Map();

  function processDirectory(currentPath, relativePath = '') {
    const items = fs.readdirSync(currentPath);
    
    for (const item of items) {
      const itemPath = path.join(currentPath, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory() && item !== 'images') {
        processDirectory(itemPath, path.join(relativePath, item));
      } else if (item === 'index.mdx') {
        processMdxFile(itemPath, relativePath);
      }
    }
  }

  function processMdxFile(filePath, relativePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const { data } = matter(content);
      
      if (data.category) {
        const category = data.category;
        const title = data.title || path.basename(relativePath);
        
        const safeCategoryKey = category
          .toLowerCase()
          .replace(/\s+/g, '_')
          .replace(/[^a-z0-9_]/g, '');
        
        mainMeta[safeCategoryKey] = category;
        
        if (!categoryFolders.has(category)) {
          categoryFolders.set(category, []);
        }
        categoryFolders.get(category).push({
          originalPath: path.dirname(filePath),
          title: title,
          content: content
        });

        // Копируем папку images
        const imagesSourcePath = path.join(path.dirname(filePath), 'images');
        if (fs.existsSync(imagesSourcePath)) {
          const categoryPath = path.join(targetPath, safeCategoryKey);
          const imagesTargetPath = path.join(categoryPath, 'images');
          
          // Копируем изображения
          copyFolderRecursive(imagesSourcePath, imagesTargetPath);
          console.log(`Copied images: ${imagesSourcePath} -> ${imagesTargetPath}`);
        }
      }
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error);
    }
  }

  console.log('Scanning source directory...');
  processDirectory(sourcePath);

  console.log('Creating target structure...');
  
  categoryFolders.forEach((folders, category) => {
    const safeCategoryKey = category
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
    
    const categoryPath = path.join(targetPath, safeCategoryKey);
    fs.mkdirSync(categoryPath, { recursive: true });
    
    const categoryMeta = {};
    
    folders.forEach((folder, index) => {
      const folderName = `item_${index + 1}`;
      categoryMeta[folderName] = folder.title;
      
      const targetFile = path.join(categoryPath, `${folderName}.mdx`);
      fs.writeFileSync(targetFile, folder.content);
      console.log(`Created: ${targetFile}`);
    });
    
    const metaJsonPath = path.join(categoryPath, '_meta.json');
    fs.writeFileSync(metaJsonPath, JSON.stringify(categoryMeta, null, 2));
    console.log(`Created: ${metaJsonPath}`);
  });

  if (Object.keys(mainMeta).length > 0) {
    const mainMetaContent = `// _meta.js
export default {
${Object.entries(mainMeta)
  .map(([key, value]) => `    "${key}": "${value.replace(/"/g, '\\"')}"`)
  .join(',\n')}
}`;

    const mainMetaPath = path.join(targetPath, '_meta.js');
    fs.writeFileSync(mainMetaPath, mainMetaContent);
    console.log(`Created: ${mainMetaPath}`);
  }

  const ensureBasicMetaFiles = () => {
    const basicMetaJS = `export default {
  index: "Products Overview"
}`;

    const basicMetaJSON = `{
  "index": "Products Overview"
}`;

    const metaJSPath = path.join(targetPath, '_meta.js');
    if (!fs.existsSync(metaJSPath)) {
      fs.writeFileSync(metaJSPath, basicMetaJS);
      console.log('Created basic _meta.js');
    }

    const metaJSONPath = path.join(targetPath, '_meta.json');
    if (!fs.existsSync(metaJSONPath)) {
      fs.writeFileSync(metaJSONPath, basicMetaJSON);
      console.log('Created basic _meta.json');
    }
  };

  ensureBasicMetaFiles();
  
  console.log('Generation completed!');
}

try {
  generateMeta();
} catch (error) {
  console.error('Error:', error);
  process.exit(1);
}