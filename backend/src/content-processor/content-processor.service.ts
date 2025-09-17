import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs-extra';
import * as path from 'path';
import matter from 'gray-matter';
import * as yaml from 'js-yaml';
import MarkdownIt from 'markdown-it';

@Injectable()
export class ContentProcessorService {
  private readonly logger = new Logger(ContentProcessorService.name);
  private readonly md = new MarkdownIt();

  private readonly contentSrcPath = path.join(process.cwd(), 'content');
  private readonly contentDestPath = path.join(process.cwd(), '../uavos/content');

  private readonly folderMappings = {
    'articles': 'media/articles',
    'products': 'products'
  };

  async processContent() {
    this.logger.log('🔄 Processing content for UAVOS...');
    
    for (const targetFolder of Object.values(this.folderMappings)) {
      const targetPath = path.join(this.contentDestPath, targetFolder);
      await fs.remove(targetPath);
      this.logger.log(`Cleaned target folder: ${targetPath}`);
    }

    for (const [sourceFolder, targetFolder] of Object.entries(this.folderMappings)) {
      const sourcePath = path.join(this.contentSrcPath, sourceFolder);
      
      if (await fs.pathExists(sourcePath)) {
        this.logger.log(`Processing ${sourceFolder} → ${targetFolder}`);
        await this.processContentFolder(sourcePath, targetFolder);
      } else {
        this.logger.warn(`Source folder not found: ${sourcePath}`);
      }
    }

    this.logger.log('✅ Content processed successfully');
  }

  private async processContentFolder(sourcePath: string, targetFolder: string) {
    const targetPath = path.join(this.contentDestPath, targetFolder);
    await fs.ensureDir(targetPath);
    const categoryStructure = {};
    await this.processDirectory(sourcePath, '', categoryStructure, sourcePath, targetPath);
    if (Object.keys(categoryStructure).length > 0) {
      await this.createCategoryStructure(categoryStructure, targetPath, {});
      const folderName = path.basename(targetFolder);
      const rootMetaContent = {
        "index": `${folderName.charAt(0).toUpperCase() + folderName.slice(1)} Overview`
      };

      const rootMetaPath = path.join(targetPath, '_meta.json');
      await fs.writeJson(rootMetaPath, rootMetaContent, { spaces: 2 });
      this.logger.log(`Created root meta: ${rootMetaPath}`);
    } else {
      this.logger.log(`No content found in ${sourcePath}`);
    }
  }

  private async processDirectory(
    currentPath: string, 
    relativePath: string, 
    categoryStructure: any,
    sourceBasePath: string,
    targetBasePath: string
  ) {
    try {
      const items = await fs.readdir(currentPath, { withFileTypes: true });
      
      for (const item of items) {
        const itemPath = path.join(currentPath, item.name);
        
        if (item.isDirectory()) {
          if (item.name.startsWith('.') || item.name === 'images' || item.name === 'common') {
            continue;
          }
          await this.processDirectory(
            itemPath, 
            path.join(relativePath, item.name), 
            categoryStructure,
            sourceBasePath,
            targetBasePath
          );
        } else if (item.name === 'index.mdx' || item.name.endsWith('.mdx')) {
          await this.processMdxFile(
            itemPath, 
            relativePath, 
            categoryStructure, 
            sourceBasePath,
            targetBasePath
          );
        }
      }
    } catch (error) {
      this.logger.error(`Error processing directory ${currentPath}:`, error);
    }
  }

  private async processMdxFile(
    filePath: string, 
    relativePath: string, 
    categoryStructure: any,
    sourceBasePath: string,
    targetBasePath: string
  ) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const { data, content: markdownContent } = matter(content);
      
      const dirName = path.dirname(filePath);
      const folderName = path.basename(dirName);
      let categories: string[];
      
      if (data.category) {
        categories = data.category.split('/').map(cat => cat.trim());
      } else {
        const relativeDir = path.relative(sourceBasePath, dirName);
        categories = relativeDir.split(path.sep).filter(part => part && part !== '.');
        if (categories.length === 0) {
          categories = [path.basename(sourceBasePath)];
        }
      }
      
      const title = data.title || folderName;
      let currentLevel = categoryStructure;
      for (const category of categories) {
        const safeCategoryKey = this.sanitizeCategoryKey(category);
        if (!currentLevel[safeCategoryKey]) {
          currentLevel[safeCategoryKey] = {
            displayName: category,
            documents: [],
            subcategories: {}
          };
        }
        
        currentLevel = currentLevel[safeCategoryKey].subcategories;
      }
      
      let targetCategory = categoryStructure;
      for (const category of categories) {
        const safeCategoryKey = this.sanitizeCategoryKey(category);
        
        if (category === categories[categories.length - 1]) {
          targetCategory[safeCategoryKey].documents.push({
            originalPath: dirName,
            title: title,
            content: `---\n${yaml.dump(data)}---\n${markdownContent}`,
            folderName: folderName,
            filename: path.basename(filePath, '.mdx')
          });
        } else {
          targetCategory = targetCategory[safeCategoryKey].subcategories;
        }
      }

      const imagesSourcePath = path.join(dirName, 'images');
      if (await fs.pathExists(imagesSourcePath)) {
        const categoryPathParts = categories.map(cat => this.sanitizeCategoryKey(cat));
        const imagesTargetPath = path.join(targetBasePath, ...categoryPathParts, 'images');
        
        await this.copyFolderRecursive(imagesSourcePath, imagesTargetPath);
        this.logger.log(`Copied images: ${imagesSourcePath} -> ${imagesTargetPath}`);
      }

      this.logger.log(`Processed: ${title} in ${relativePath}`);

    } catch (error) {
      this.logger.error(`Error processing MDX file ${filePath}:`, error);
    }
  }

  private sanitizeCategoryKey(category: string): string {
    return category
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
  }

  private async copyFolderRecursive(source: string, target: string) {
    if (!await fs.pathExists(target)) {
      await fs.mkdir(target, { recursive: true });
    }

    const items = await fs.readdir(source, { withFileTypes: true });
    
    for (const item of items) {
      const sourcePath = path.join(source, item.name);
      const targetPath = path.join(target, item.name);

      if (item.isDirectory()) {
        await this.copyFolderRecursive(sourcePath, targetPath);
      } else {
        await fs.copyFile(sourcePath, targetPath);
      }
    }
  }

  private async createCategoryStructure(
    structure: any, 
    basePath: string, 
    parentMeta: any
  ): Promise<any> {
    for (const categoryKey of Object.keys(structure)) {
      const categoryInfo = structure[categoryKey];
      const categoryPath = path.join(basePath, categoryKey);
      await fs.ensureDir(categoryPath);
      const categoryMeta = {};
      if (categoryInfo.documents.length > 0) {
        categoryMeta['index'] = categoryInfo.displayName;
        
        for (const [index, document] of categoryInfo.documents.entries()) {
          const docKey = document.filename || document.folderName || `doc_${index + 1}`;
          categoryMeta[docKey] = document.title;
          
          const targetFile = path.join(categoryPath, `${docKey}.mdx`);
          await fs.writeFile(targetFile, document.content);
          this.logger.log(`Created: ${targetFile}`);
        }
      }
      if (Object.keys(categoryInfo.subcategories).length > 0) {
        const subMeta = await this.createCategoryStructure(
          categoryInfo.subcategories, 
          categoryPath,
          categoryMeta
        );
        Object.assign(categoryMeta, subMeta);
      }
      const metaJsonPath = path.join(categoryPath, '_meta.json');
      await fs.writeJson(metaJsonPath, categoryMeta, { spaces: 2 });
      this.logger.log(`Created meta: ${metaJsonPath}`);
      parentMeta[categoryKey] = categoryInfo.displayName;
    }
    return parentMeta;
  }
}