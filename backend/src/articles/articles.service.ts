import * as fsExtra from 'fs-extra';
import * as fs from 'fs';
import * as path from 'path';
import { Injectable } from '@nestjs/common';
import matter from 'gray-matter';

@Injectable()
export class ArticlesService {
    private readonly repoPath = process.env.GIT_REPO_PATH ?? './content';
    private readonly contentPath = this.repoPath;
    private readonly baseUrl = process.env.BASE_URL || 'http://localhost:3003';





    private processImagePathsForSave(content: string): string {
        return content.replace(/!\[(.*?)\]\((.*?)\)/g, (match, altText, imageUrl) => {
            if (imageUrl.includes('/uploads/tmp/')) {
                const fileName = path.basename(imageUrl);
                return `![${altText}](./images/${fileName})`;
            }
            return match;
        });
    }



    // private generateArticleContent(article: any, images: { [key: string]: string }): string {
    //     let content = article.content || '';
    //     content = this.processImagePathsForSave(content);
    //     for (const img of Object.keys(images)) {
    //         const localPath = images[img];
    //         const regex = new RegExp(this.escapeRegExp(img), 'g');
    //         content = content.replace(regex, localPath);
    //     }

    //     return content;
    // }

    private generateFolderName(title: string): string {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .slice(0, 50);
    }



    private escapeRegExp(string: string): string {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    async pushArticle(article: any): Promise<{ success: boolean; message: string; folderPath: string }> {
        try {
            const articlesFolder = path.join(this.contentPath, 'articles');
            if (!fs.existsSync(articlesFolder)) fs.mkdirSync(articlesFolder, { recursive: true });

            let articleTitle = article.title;
            const folderName = this.generateFolderName(articleTitle);
            const articleFolder = path.join(articlesFolder, folderName);

            if (fs.existsSync(articleFolder)) {
                throw new Error(`Article folder already exists: ${folderName}`);
            }

            fs.mkdirSync(articleFolder, { recursive: true });

            const imagesFolder = path.join(articleFolder, 'images');
            fs.mkdirSync(imagesFolder, { recursive: true });

            const fileMap: { [key: string]: string } = {};

            if (article.images && article.images.length > 0) {
                for (const image of article.images) {
                    const tempUrl = image.url;
                    const fileName = path.basename(tempUrl);
                    const destPath = path.join(imagesFolder, fileName);

                    const tempPath = path.join(process.cwd(), 'uploads', 'tmp', fileName);
                    if (fs.existsSync(tempPath)) {
                        fsExtra.copySync(tempPath, destPath);
                        fileMap[tempUrl] = `./images/${fileName}`;
                    } else {
                        console.warn(`Temporary file not found: ${tempPath}`);
                    }
                }

                const tempFolder = path.join(process.cwd(), 'uploads', 'tmp');
                if (fs.existsSync(tempFolder)) {
                    fsExtra.emptyDirSync(tempFolder);
                }
            }

            const indexPath = path.join(articleFolder, 'index.mdx');
            let content = this.processImagePathsForSave(article.content);
            for (const [tempUrl, localPath] of Object.entries(fileMap)) {
                const regex = new RegExp(this.escapeRegExp(tempUrl), 'g');
                content = content.replace(regex, localPath);
            }

            fs.writeFileSync(indexPath, content);

            return {
                success: true,
                message: `Article saved in content/articles/${folderName}`,
                folderPath: `content/articles/${folderName}`
            };
        } catch (err) {
            console.error('Error creating article:', err);
            throw new Error(`Failed to save article: ${err.message}`);
        }
    }


    private generateTitleFromSlug(slug: string): string {
        return slug
            .replace(/-/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase())
            .trim();
    }

    private parseArticleFile(filePath: string, folderPath: string): any {
        const content = fs.readFileSync(filePath, 'utf-8');
        const parsed = matter(content);
        const metadata = parsed.data;

        const pathParts = folderPath.split('/');
        const slug = pathParts.pop();

        const articleContent = this.processImagePaths(parsed.content, folderPath);
        const frontmatterText = this.convertMetadataToFrontmatter(metadata);
        return {
            id: slug,
            slug: slug,
            title: this.generateTitleFromSlug(folderPath),
            content: frontmatterText + articleContent,
            folderPath: `content/articles/${folderPath}`,
            metadata: metadata
        };
    }

    private processImagePaths(content: string, folderPath: string): string {
        return content.replace(
            /\.\/images\/([^)\s]+)/g,
            `${this.baseUrl}/content/articles/${folderPath}/images/$1`
        );
    }

    async getAllArticles(): Promise<any[]> {
        const articlesFolder = path.join(this.contentPath, 'articles');
        if (!fs.existsSync(articlesFolder)) return [];

        const articles: any[] = [];

        const findArticlesRecursive = (currentPath: string, relativePath: string = '') => {
            const items = fs.readdirSync(currentPath, { withFileTypes: true });

            for (const item of items) {
                if (item.isDirectory()) {
                    const itemPath = path.join(currentPath, item.name);
                    const newRelativePath = relativePath ? `${relativePath}/${item.name}` : item.name;

                    const indexPath = path.join(itemPath, 'index.mdx');
                    if (fs.existsSync(indexPath)) {
                        try {
                            const articleContent = this.parseArticleFile(indexPath, newRelativePath);
                            articles.push(articleContent);
                        } catch (error) {
                            console.warn(`Error parsing article in folder ${newRelativePath}:`, error.message);
                        }
                    } else {
                        findArticlesRecursive(itemPath, newRelativePath);
                    }
                }
            }
        };

        findArticlesRecursive(articlesFolder);

        return articles;
    }

    async getArticleBySlug(slug: string): Promise<any> {
        const articlesFolder = path.join(this.contentPath, 'articles');
        const fullPath = path.join(articlesFolder, slug, 'index.mdx');

        if (!fs.existsSync(fullPath)) {
            throw new Error(`Article not found: ${slug}`);
        }

        return this.parseArticleFile(fullPath, slug);
    }

    private convertMetadataToFrontmatter(metadata: any): string {
        let frontmatter = '---\n';
        
        for (const [key, value] of Object.entries(metadata)) {
            if (value !== undefined && value !== null) {
                frontmatter += `${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}\n`;
            }
        }
        
        frontmatter += '---\n\n';
        return frontmatter;
    }


    async deleteArticle(slug: string): Promise<{ success: boolean; message: string; deletedPath?: string }> {
        try {
            const articlesFolder = path.join(this.contentPath, 'articles');
            const fullPath = path.join(articlesFolder, slug);
            if (!fs.existsSync(fullPath)) {
                return { success: false, message: `Article not found: ${slug}` };
            }
            fsExtra.removeSync(fullPath);

            return {
                success: true,
                message: `Article "${slug}" has been deleted successfully.`,
                deletedPath: `content/articles/${slug}`,
            };
        } catch (error) {
            console.error(`Error deleting article ${slug}:`, error);
            throw new Error(`Failed to delete article: ${error.message}`);
        }
    }



    async updateArticle(
        slug: string,
        articleData: any
    ): Promise<{ success: boolean; message: string; folderPath: string }> {
        try {
            const articlesFolder = path.join(this.contentPath, 'articles');
            const oldArticleFolder = path.join(articlesFolder, slug);

            if (!fs.existsSync(oldArticleFolder)) {
                throw new Error(`Article folder not found for slug: ${slug}`);
            }
            let articleTitle = articleData.title || slug;
            const newFolderName = this.generateFolderName(articleTitle);
            const newArticleFolder = path.join(articlesFolder, newFolderName);
            if (oldArticleFolder !== newArticleFolder) {
                if (fs.existsSync(newArticleFolder)) {
                    throw new Error(`Target article folder already exists: ${newFolderName}`);
                }
                fsExtra.moveSync(oldArticleFolder, newArticleFolder, { overwrite: true });
            }

            const imagesFolder = path.join(newArticleFolder, 'images');
            fs.mkdirSync(imagesFolder, { recursive: true });

            const fileMap: { [key: string]: string } = {};
            if (articleData.images && articleData.images.length > 0) {
                const tempFolder = path.join(process.cwd(), 'uploads/tmp');

                for (const image of articleData.images) {
                    try {
                        const tempFileName = path.basename(image.url);
                        const tempPath = path.join(tempFolder, tempFileName);
                        if (!fs.existsSync(tempPath)) {
                            console.warn(`Temporary file not found: ${tempPath}`);
                            continue;
                        }
                        const destFileName = tempFileName;
                        const destPath = path.join(imagesFolder, destFileName);
                        fsExtra.copySync(tempPath, destPath, { overwrite: true });
                        fileMap[image.url] = `./images/${destFileName}`;
                        console.log(`Copied image: ${tempFileName}`);
                    } catch (error) {
                        console.error(`Error copying image ${image.url}:`, error);
                    }
                }
            }

            let content = this.normalizeAllImagePaths(articleData.content);

            for (const [tempUrl, localPath] of Object.entries(fileMap)) {
                const regex = new RegExp(this.escapeRegExp(tempUrl), 'g');
                content = content.replace(regex, localPath);
            }

            const existingFiles = fs.readdirSync(imagesFolder);
            for (const fileName of existingFiles) {
                const filePath = path.join(imagesFolder, fileName);
                const imagePattern = `./images/${fileName}`;
                if (!content.includes(imagePattern)) {
                    try {
                        fsExtra.removeSync(filePath);
                        console.log(`Removed unused image: ${fileName}`);
                    } catch (error) {
                        console.error(`Error removing image ${fileName}:`, error);
                    }
                }
            }
            const indexPath = path.join(newArticleFolder, 'index.mdx');
            fs.writeFileSync(indexPath, content);
            const tempFolder = path.join(process.cwd(), 'uploads/tmp');
            if (fs.existsSync(tempFolder)) {
                try {
                    fsExtra.emptyDirSync(tempFolder);
                    console.log('Cleared temp folder');
                } catch (error) {
                    console.warn('Failed to clear temp folder:', error);
                }
            }

            return {
                success: true,
                message: `Article "${slug}" updated successfully.`,
                folderPath: `content/articles/${newFolderName}`,
            };

        } catch (error) {
            console.error(`Error updating article ${slug}:`, error);
            throw new Error(`Failed to update article: ${error.message}`);
        }
    }

    private normalizeAllImagePaths(content: string): string {
        return content.replace(
            /!\[([^\]]*)\]\(([^)]+)\)/g,
            (match, altText, imageUrl) => {
                if (imageUrl.startsWith('./images/')) {
                    return match;
                }
                if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
                    const fileName = path.basename(imageUrl);
                    return `![${altText}](./images/${fileName})`;
                }
                if (imageUrl.includes('uploads/tmp')) {
                    const fileName = path.basename(imageUrl);
                    return `![${altText}](./images/${fileName})`;
                }
                return match;
            }
        );
    }
}