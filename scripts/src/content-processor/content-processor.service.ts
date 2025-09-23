import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs-extra';
import * as path from 'path';
import matter from 'gray-matter';
import * as yaml from 'js-yaml';

interface DocumentData {
  title: string;
  content: string;
  folderName: string;
  originalPath: string;
  imagesPath: string;
}

interface CategoryInfo {
  displayName: string;
  documents: DocumentData[];
  subcategories: Record<string, CategoryInfo>;
}

@Injectable()
export class ContentProcessorService {
  private readonly logger = new Logger(ContentProcessorService.name);

  private readonly contentSrcPath = path.join(process.cwd(), 'content');
  private readonly contentDestPath = path.join(process.cwd(), '../site/content');

  async processContent(): Promise<void> {
    const usedTemplates = new Set<string>();
    const categoryStructures: Record<string, CategoryInfo> = {};

    if (await fs.pathExists(this.contentSrcPath)) {
      await this.processContentRoot(this.contentSrcPath, usedTemplates, categoryStructures);

      for (const template of usedTemplates) {
        const targetPath = path.join(this.contentDestPath, template);
        await fs.remove(targetPath);
      }

      for (const [templateType, categoryStructure] of Object.entries(categoryStructures)) {
        const targetBasePath = path.join(this.contentDestPath, templateType);
        await fs.ensureDir(targetBasePath);

        const rootMeta = await this.buildCategoryStructure(categoryStructure, targetBasePath);
        const rootMetaPath = path.join(targetBasePath, '_meta.json');
        await fs.writeJson(rootMetaPath, rootMeta, { spaces: 2 });
      }
    } else {
      this.logger.warn(`Content source path does not exist: ${this.contentSrcPath}`);
    }
  }

  private async processContentRoot(
    sourcePath: string,
    usedTemplates: Set<string>,
    categoryStructures: Record<string, CategoryInfo>
  ): Promise<void> {
    const items = await fs.readdir(sourcePath, { withFileTypes: true });

    for (const item of items) {
      const itemPath = path.join(sourcePath, item.name);

      if (item.isDirectory()) {
        if (item.name.startsWith('.') || item.name === 'images' || item.name === 'common') continue;
        await this.processContentRoot(itemPath, usedTemplates, categoryStructures);
      } else if (item.name.endsWith('.mdx')) {
        await this.processMdxFile(itemPath, usedTemplates, categoryStructures);
      }
    }
  }

  private async processMdxFile(
    filePath: string,
    usedTemplates: Set<string>,
    categoryStructures: Record<string, CategoryInfo>
  ): Promise<void> {
    const content = await fs.readFile(filePath, 'utf8');
    const { data, content: markdownContent } = matter(content);

    const templateType = data.template;
    if (!templateType) return;

    usedTemplates.add(templateType);

    if (!categoryStructures[templateType]) {
      categoryStructures[templateType] = { displayName: templateType, documents: [], subcategories: {} };
    }

    const categories: string[] = data.category
      ? data.category.split('/').map((cat: string) => cat.trim())
      : path
          .relative(this.contentSrcPath, path.dirname(filePath))
          .split(path.sep)
          .filter(Boolean);

    if (categories.length === 0) categories.push('uncategorized');

    const title = data.title || path.basename(filePath, '.mdx');
    const folderName = this.slugify(title);

    let currentLevel = categoryStructures[templateType];

    for (const cat of categories) {
      const catSlug = this.slugify(cat);
      if (!currentLevel.subcategories[catSlug]) {
        currentLevel.subcategories[catSlug] = { displayName: cat, documents: [], subcategories: {} };
      }
      currentLevel = currentLevel.subcategories[catSlug];
    }

    const existingIndex = currentLevel.documents.findIndex(doc => doc.folderName === folderName);
    const documentData: DocumentData = {
      title,
      content: `---\n${yaml.dump(data)}---\n${markdownContent}`,
      folderName,
      originalPath: path.dirname(filePath),
      imagesPath: path.join(path.dirname(filePath), 'images'),
    };

    if (existingIndex === -1) {
      currentLevel.documents.push(documentData);
    } else {
      currentLevel.documents[existingIndex] = documentData;
    }
  }

  private slugify(text: string): string {
    return text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
  }

  private async copyFolderRecursive(source: string, target: string): Promise<void> {
    await fs.ensureDir(target);
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

  private async buildCategoryStructure(categoryInfo: CategoryInfo, basePath: string): Promise<Record<string, string>> {
    const meta: Record<string, string> = {};

    for (const doc of categoryInfo.documents) {
      const docPath = path.join(basePath, doc.folderName);
      await fs.ensureDir(docPath);
      await fs.writeFile(path.join(docPath, 'index.mdx'), doc.content);

      if (await fs.pathExists(doc.imagesPath)) {
        await this.copyFolderRecursive(doc.imagesPath, path.join(docPath, 'images'));
      }

      meta[doc.folderName] = doc.title;
    }

    for (const subCatKey of Object.keys(categoryInfo.subcategories)) {
      const subCat = categoryInfo.subcategories[subCatKey];
      const subMeta = await this.buildCategoryStructure(subCat, path.join(basePath, subCatKey));
      Object.assign(meta, subMeta);
    }

    return meta;
  }
}