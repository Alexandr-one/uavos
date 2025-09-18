import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs-extra';
import * as path from 'path';
import matter from 'gray-matter';
import * as yaml from 'js-yaml';

@Injectable()
export class ContentProcessorService {
  private readonly logger = new Logger(ContentProcessorService.name);

  private readonly contentSrcPath = path.join(process.cwd(), 'content');
  private readonly contentDestPath = path.join(process.cwd(), '../uavos/content');

  async processContent() {


    // Собираем все уникальные template из файлов
    const usedTemplates = new Set<string>();
    const categoryStructures: Record<string, any> = {};

    // Обработка всех файлов в корне content
    if (await fs.pathExists(this.contentSrcPath)) {


      await this.processContentRoot(this.contentSrcPath, usedTemplates, categoryStructures);

      // Очищаем только те папки, которые реально используются
      for (const template of usedTemplates) {
        const targetPath = path.join(this.contentDestPath, template);
        await fs.remove(targetPath);

      }

      // Создание структуры для каждого используемого template
      for (const [templateType, categoryStructure] of Object.entries(categoryStructures)) {
        if (Object.keys(categoryStructure).length > 0) {
          const targetBasePath = path.join(this.contentDestPath, templateType);
          await fs.ensureDir(targetBasePath);

          // Создаем корневой meta файл
          const rootMeta = await this.buildCategoryStructure(
            categoryStructure,
            targetBasePath
          );

          const rootMetaPath = path.join(targetBasePath, '_meta.json');
          await fs.writeJson(rootMetaPath, rootMeta, { spaces: 2 });

        }
      }
    } else {

    }


  }

  private async processContentRoot(
    sourcePath: string,
    usedTemplates: Set<string>,
    categoryStructures: Record<string, any>
  ) {
    try {
      const items = await fs.readdir(sourcePath, { withFileTypes: true });

      for (const item of items) {
        const itemPath = path.join(sourcePath, item.name);

        if (item.isDirectory()) {
          // Пропускаем системные папки
          if (item.name.startsWith('.') || item.name === 'images' || item.name === 'common') {
            continue;
          }
          // Рекурсивно обрабатываем подпапки
          await this.processContentRoot(itemPath, usedTemplates, categoryStructures);
        } else if (item.name.endsWith('.mdx')) {
          await this.processMdxFile(itemPath, usedTemplates, categoryStructures);
        }
      }
    } catch (error) {

    }
  }

  private async processMdxFile(
    filePath: string,
    usedTemplates: Set<string>,
    categoryStructures: Record<string, any>
  ) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const { data, content: markdownContent } = matter(content);

      // Определяем тип контента из frontmatter
      const templateType = data.template;
      if (!templateType) {

        return;
      }

      // Добавляем template в список используемых
      usedTemplates.add(templateType);

      // Инициализируем структуру для этого template если еще не существует
      if (!categoryStructures[templateType]) {
        categoryStructures[templateType] = {};
      }

      // Получаем категории
      let categories: string[] = [];
      if (data.category) {
        categories = data.category.split('/').map(cat => cat.trim());
      } else {
        // Если категория не указана, используем путь к файлу
        const relativePath = path.relative(this.contentSrcPath, path.dirname(filePath));
        categories = relativePath.split(path.sep).filter(part => part && part !== '.');
        if (categories.length === 0) {
          categories = ['uncategorized'];
        }
      }

      const title = data.title || path.basename(filePath, '.mdx');
      const folderName = this.slugify(title);

      // Добавляем в соответствующую структуру
      const structure = categoryStructures[templateType];
      let currentLevel = structure;

      // Строим структуру категорий
      for (const category of categories) {
        const categorySlug = this.slugify(category);

        if (!currentLevel[categorySlug]) {
          currentLevel[categorySlug] = {
            displayName: category,
            documents: [],
            subcategories: {}
          };
        }

        currentLevel = currentLevel[categorySlug].subcategories;
      }

      // Добавляем документ в структуру
      let targetLevel = structure;
      for (let i = 0; i < categories.length; i++) {
        const category = categories[i];
        const categorySlug = this.slugify(category);

        if (i === categories.length - 1) {
          // Добавляем документ в последнюю категорию
          const existingDocIndex = targetLevel[categorySlug].documents.findIndex(
            doc => doc.folderName === folderName
          );

          const documentData = {
            title: title,
            content: `---\n${yaml.dump(data)}---\n${markdownContent}`,
            folderName: folderName,
            originalPath: path.dirname(filePath),
            imagesPath: path.join(path.dirname(filePath), 'images')
          };

          if (existingDocIndex === -1) {
            targetLevel[categorySlug].documents.push(documentData);
          } else {
            targetLevel[categorySlug].documents[existingDocIndex] = documentData;
          }
        } else {
          targetLevel = targetLevel[categorySlug].subcategories;
        }
      }

    } catch (error) {
    }
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
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

  private async buildCategoryStructure(
    structure: any,
    basePath: string
  ): Promise<any> {
    const meta: any = {};

    for (const [categorySlug, categoryInfo] of Object.entries(structure) as [string, any][]) {
      const categoryPath = path.join(basePath, categorySlug);
      await fs.ensureDir(categoryPath);

      // Добавляем категорию в meta
      meta[categorySlug] = categoryInfo.displayName;

      const categoryMeta: any = {};

      // Обрабатываем документы в категории - создаем папку для каждого
      for (const document of categoryInfo.documents) {
        const documentFolderName = document.folderName;
        categoryMeta[documentFolderName] = document.title;

        // Создаем папку для документа
        const documentFolderPath = path.join(categoryPath, documentFolderName);
        await fs.ensureDir(documentFolderPath);

        // Создаем index.mdx внутри папки
        const indexFilePath = path.join(documentFolderPath, 'index.mdx');
        await fs.writeFile(indexFilePath, document.content);


        // Копируем изображения если они есть
        if (await fs.pathExists(document.imagesPath)) {
          const imagesTargetPath = path.join(documentFolderPath, 'images');
          await this.copyFolderRecursive(document.imagesPath, imagesTargetPath);

        }
      }

      // Рекурсивно обрабатываем подкатегории
      if (Object.keys(categoryInfo.subcategories).length > 0) {
        const subMeta = await this.buildCategoryStructure(
          categoryInfo.subcategories,
          categoryPath
        );

        // Добавляем подкатегории в meta текущей категории
        Object.assign(categoryMeta, subMeta);
      }

      // Создаем meta файл для категории
      const metaJsonPath = path.join(categoryPath, '_meta.json');
      await fs.writeJson(metaJsonPath, categoryMeta, { spaces: 2 });

    }

    return meta;
  }
}