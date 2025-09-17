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
  const maintenancePath = path.join(process.cwd(), 'maintenance');
  const contentPath = path.join(process.cwd(), 'content');
  
  // Создаем целевую папку content если не существует
  if (!fs.existsSync(contentPath)) {
    fs.mkdirSync(contentPath, { recursive: true });
  }

  // Получаем все папки в maintenance, исключая скрытые и специальные папки
  const maintenanceItems = fs.readdirSync(maintenancePath, { withFileTypes: true });
  const contentFolders = maintenanceItems
    .filter(item => item.isDirectory() && 
                   !item.name.startsWith('.') && 
                   item.name !== '.github' &&
                   item.name !== 'images' && // исключаем common папки
                   item.name !== 'common')
    .map(item => item.name);

  console.log('Found content folders:', contentFolders);

  // Специальные пути для определенных папок
  const specialTargetPaths = {
    'articles': 'media/articles' // articles будет парситься в /media/articles
    // Можно добавить другие специальные пути здесь
  };

  // Обрабатываем каждую папку контента
  for (const folder of contentFolders) {
    console.log(`\nProcessing folder: ${folder}`);
    
    const sourcePath = path.join(maintenancePath, folder);
    
    // Определяем целевую папку: используем специальный путь если указан, иначе обычный
    const targetFolderPath = specialTargetPaths[folder] || folder;
    const targetPath = path.join(contentPath, targetFolderPath);
    
    console.log(`Source: ${sourcePath}`);
    console.log(`Target: ${targetPath}`);
    
    // Создаем целевую папку
    if (!fs.existsSync(targetPath)) {
      fs.mkdirSync(targetPath, { recursive: true });
    }

    const mainMeta = {};
    const categoryStructure = {};

    function processDirectory(currentPath, relativePath = '') {
      const items = fs.readdirSync(currentPath, { withFileTypes: true });
      
      for (const item of items) {
        const itemPath = path.join(currentPath, item.name);
        
        if (item.isDirectory()) {
          // Рекурсивно обрабатываем подпапки
          processDirectory(itemPath, path.join(relativePath, item.name));
        } else if (item.name === 'index.mdx') {
          // Обрабатываем файлы index.mdx
          processMdxFile(itemPath, relativePath);
        }
      }
    }

    function processMdxFile(filePath, relativePath) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const { data } = matter(content);
        
        const dirName = path.dirname(filePath);
        const folderName = path.basename(dirName);
        
        // Для статей используем название папки как категорию, если category не указан
        const categories = data.category ? 
          data.category.split('/').map(cat => cat.trim()) : 
          [folderName];
        
        const title = data.title || folderName;
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
              content: content,
              folderName: folderName
            });
          } else {
            targetCategory = targetCategory[safeCategoryKey].subcategories;
          }
        }

        // Копируем изображения
        const imagesSourcePath = path.join(path.dirname(filePath), 'images');
        if (fs.existsSync(imagesSourcePath)) {
          const categoryPathParts = categories.map(cat => 
            cat.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
          );
          const imagesTargetPath = path.join(targetPath, ...categoryPathParts, 'images');
          
          copyFolderRecursive(imagesSourcePath, imagesTargetPath);
          console.log(`Copied images: ${imagesSourcePath} -> ${imagesTargetPath}`);
        }

        console.log(`Processed article: ${title} in ${relativePath}`);

      } catch (error) {
        console.error(`Error processing ${filePath}:`, error);
      }
    }

    // Начинаем обработку с корневой папки
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
            const docKey = document.folderName || `doc_${index + 1}`;
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
    
    // Создаем структуру только если есть данные
    if (Object.keys(categoryStructure).length > 0) {
      const rootMeta = createCategoryStructure(categoryStructure, targetPath);

      // Создаем корневой meta.json
      const rootMetaContent = {
        "index": `${folder.charAt(0).toUpperCase() + folder.slice(1)} Overview`,
        ...rootMeta
      };

      const rootMetaPath = path.join(targetPath, '_meta.json');
      fs.writeFileSync(rootMetaPath, JSON.stringify(rootMetaContent, null, 2));
      console.log(`Created root meta: ${rootMetaPath}`);
    } else {
      console.log(`No articles found in ${folder}`);
    }
  }
}

try {
  generateMeta();
  console.log('\n✅ All content folders processed successfully!');
} catch (error) {
  console.error('Error:', error);
  process.exit(1);
}