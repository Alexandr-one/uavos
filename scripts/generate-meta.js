const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

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
  const sourcePath = path.join(process.cwd(), 'maintenance', 'products');
  const targetPath = path.join(process.cwd(), 'content', 'products');
  
  
  if (!fs.existsSync(targetPath)) {
    fs.mkdirSync(targetPath, { recursive: true });
  }

  const indexMdxPath = path.join(targetPath, 'index.mdx');
  let indexMdxContent = null;
  
  if (fs.existsSync(indexMdxPath)) {
    indexMdxContent = fs.readFileSync(indexMdxPath, 'utf8');
  }

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
      } catch (error) {
        console.warn(`Could not remove ${itemPath}:`, error.message);
      }
    }
  });

  if (indexMdxContent) {
    fs.writeFileSync(indexMdxPath, indexMdxContent);
  }

  const mainMeta = {};
  const categoryStructure = {};

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
        const categories = data.category.split('/').map(cat => cat.trim());
        const title = data.title || path.basename(relativePath);
        let currentLevel = categoryStructure;
        let fullPath = '';
        
        for (const category of categories) {
          const safeCategoryKey = category
            .toLowerCase()
            .replace(/\s+/g, '_')
            .replace(/[^a-z0-9_]/g, '');
          
          fullPath = fullPath ? `${fullPath}/${safeCategoryKey}` : safeCategoryKey;
          
          if (!currentLevel[safeCategoryKey]) {
            currentLevel[safeCategoryKey] = {
              displayName: category,
              documents: [],
              subcategories: {}
            };
          }
          
          if (categories.length === 1) {
            mainMeta[safeCategoryKey] = category;
          }
          
          currentLevel = currentLevel[safeCategoryKey].subcategories;
        }
        
        let targetCategory = categoryStructure;
        for (const category of categories) {
          const safeCategoryKey = category
            .toLowerCase()
            .replace(/\s+/g, '_')
            .replace(/[^a-z0-9_]/g, '');
          
          if (category === categories[categories.length - 1]) {
            targetCategory[safeCategoryKey].documents.push({
              originalPath: path.dirname(filePath),
              title: title,
              content: content
            });
          } else {
            targetCategory = targetCategory[safeCategoryKey].subcategories;
          }
        }

        const imagesSourcePath = path.join(path.dirname(filePath), 'images');
        if (fs.existsSync(imagesSourcePath)) {
          const categoryPathParts = categories.map(cat => 
            cat.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
          );
          const imagesTargetPath = path.join(targetPath, ...categoryPathParts, 'images');
          
          copyFolderRecursive(imagesSourcePath, imagesTargetPath);
          console.log(`Copied images: ${imagesSourcePath} -> ${imagesTargetPath}`);
        }
      }
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error);
    }
  }

  processDirectory(sourcePath);

  function createCategoryStructure(structure, basePath = '', parentMeta = {}) {
    Object.keys(structure).forEach(categoryKey => {
      const categoryInfo = structure[categoryKey];
      const categoryPath = path.join(basePath, categoryKey);
      
      fs.mkdirSync(categoryPath, { recursive: true });
      
      const categoryMeta = {};
      
      if (categoryInfo.documents.length > 0) {
        categoryMeta.index = categoryInfo.displayName;
        
        categoryInfo.documents.forEach((document, index) => {
          const docKey = `doc_${index + 1}`;
          categoryMeta[docKey] = document.title;
          
          const targetFile = path.join(categoryPath, `${docKey}.mdx`);
          fs.writeFileSync(targetFile, document.content);
          console.log(`Created: ${targetFile}`);
        });
      }
      
      if (Object.keys(categoryInfo.subcategories).length > 0) {
        const subMeta = createCategoryStructure(
          categoryInfo.subcategories, 
          categoryPath,
          categoryMeta
        );
        
        Object.assign(categoryMeta, subMeta);
      }
      
      const metaJsonPath = path.join(categoryPath, '_meta.json');
      fs.writeFileSync(metaJsonPath, JSON.stringify(categoryMeta, null, 2));
      console.log(`Created: ${metaJsonPath}`);
      
      parentMeta[categoryKey] = categoryInfo.displayName;
    });
    
    return parentMeta;
  }
  
  const rootMeta = createCategoryStructure(categoryStructure, targetPath);

  if (Object.keys(mainMeta).length > 0) {
    const mainMetaContent = `// _meta.js
      export default {
      ${Object.entries(mainMeta)
        .map(([key, value]) => `    "${key}": "${value.replace(/"/g, '\\"')}"`)
        .join(',\n')}
      }`;

    const mainMetaPath = path.join(targetPath, '_meta.js');
    fs.writeFileSync(mainMetaPath, mainMetaContent);
  }

  const rootMetaContent = {
    "index": "Products Overview",
    ...rootMeta
  };

  const rootMetaPath = path.join(targetPath, '_meta.json');
  fs.writeFileSync(rootMetaPath, JSON.stringify(rootMetaContent, null, 2));
}

try {
  generateMeta();
} catch (error) {
  console.error('Error:', error);
  process.exit(1);
}