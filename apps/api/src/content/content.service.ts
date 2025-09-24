import * as fsExtra from 'fs-extra';
import * as fs from 'fs';
import * as path from 'path';
import { Injectable } from '@nestjs/common';
import matter from 'gray-matter';
import { ContentFetchDto, ContentObjectDto } from '@uavos/shared-types';

@Injectable()
export class ContentService {
    // Local Content link
    private readonly contentPath = process.env.GIT_REPO_PATH ?? './content';
    
    // Api Host 
    private readonly baseUrl = process.env.API_HOST || 'http://localhost:3003';

    /**
     * Process Image for saving
     * @param content 
     * @returns 
     */
    private processImagePathsForSave(content: string): string {
        return content.replace(/!\[(.*?)\]\((.*?)\)/g, (match, altText, imageUrl) => {
            if (imageUrl.includes('/uploads/tmp/')) {
                const fileName = path.basename(imageUrl);
                return `![${altText}](./images/${fileName})`;
            }
            return match;
        });
    }

    /**
     * Generate folter name from title
     * @param title 
     * @returns 
     */
    private generateFolderName(title: string): string {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .slice(0, 50);
    }

    /**
     * Reg Exp for folder name
     * @param string 
     * @returns 
     */
    private escapeRegExp(string: string): string {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Pushing content to git
     * @param contentData 
     * @returns 
     */
    async pushContent(contentData: any): Promise<ContentObjectDto> {
        try {
            const contentFolder = this.contentPath;
            if (!fs.existsSync(contentFolder)) fs.mkdirSync(contentFolder, { recursive: true });

            let contentTitle = contentData.title;
            const folderName = this.generateFolderName(contentTitle);
            const contentItemFolder = path.join(contentFolder, folderName);

            if (fs.existsSync(contentItemFolder)) {
                throw new Error(`Content folder already exists: ${folderName}`);
            }

            fs.mkdirSync(contentItemFolder, { recursive: true });

            const imagesFolder = path.join(contentItemFolder, 'images');
            fs.mkdirSync(imagesFolder, { recursive: true });

            const fileMap: { [key: string]: string } = {};

            if (contentData.images && contentData.images.length > 0) {
                for (const image of contentData.images) {
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

            const indexPath = path.join(contentItemFolder, 'index.mdx');
            let content = this.processImagePathsForSave(contentData.content);
            for (const [tempUrl, localPath] of Object.entries(fileMap)) {
                const regex = new RegExp(this.escapeRegExp(tempUrl), 'g');
                content = content.replace(regex, localPath);
            }

            fs.writeFileSync(indexPath, content);

            return {
                success: true,
                message: `Content saved in content/${folderName}`,
                folderPath: `content/${folderName}`
            };
        } catch (err) {
            console.error('Error creating content:', err);
            throw new Error(`Failed to save content: ${err.message}`);
        }
    }

    /**
     * Generate Folter Title 
     * @param slug 
     * @returns 
     */
    private generateTitleFromSlug(slug: string): string {
        return slug
            .replace(/-/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase())
            .trim();
    }

    /**
     * Parse mdx Content
     * @param filePath 
     * @param folderPath 
     * @returns
     */
    private parseContentFile(filePath: string, folderPath: string): ContentFetchDto {
        const content = fs.readFileSync(filePath, 'utf-8');
        const parsed = matter(content);
        const metadata = parsed.data;

        const pathParts = folderPath.split('/');
        const slug = pathParts.pop();
        
        if (!slug) {
            throw new Error(`Invalid folderPath: ${folderPath}`);
        }

        const contentText = this.processImagePaths(parsed.content, folderPath);
        const frontmatterText = this.convertMetadataToFrontmatter(metadata);
        return {
            id: slug,
            slug: slug,
            title: this.generateTitleFromSlug(folderPath),
            content: frontmatterText + contentText,
            folderPath: `content/${folderPath}`,
            metadata: metadata
        };
    }

    /**
     * Process Image Paths
     * @param content 
     * @param folderPath 
     * @returns 
     */
    private processImagePaths(content: string, folderPath: string): string {
        return content.replace(
            /\.\/images\/([^)\s]+)/g,
            `${this.baseUrl}/content/${folderPath}/images/$1`
        );
    }

    /**
     * Get All content from work folter
     * @returns 
     */
    async getAllContent(): Promise<ContentFetchDto[]> {
        const contentFolder = this.contentPath;
        if (!fs.existsSync(contentFolder)) return [];

        const contentItems: ContentFetchDto[] = [];

        const findContentRecursive = (currentPath: string, relativePath: string = '') => {
            const items = fs.readdirSync(currentPath, { withFileTypes: true });

            for (const item of items) {
                if (item.isDirectory()) {
                    const itemPath = path.join(currentPath, item.name);
                    const newRelativePath = relativePath ? `${relativePath}/${item.name}` : item.name;

                    const indexPath = path.join(itemPath, 'index.mdx');
                    if (fs.existsSync(indexPath)) {
                        try {
                            const contentItem: ContentFetchDto = this.parseContentFile(indexPath, newRelativePath);
                            contentItems.push(contentItem);
                        } catch (error) {
                            console.warn(`Error parsing content in folder ${newRelativePath}:`, error.message);
                        }
                    } else {
                        findContentRecursive(itemPath, newRelativePath);
                    }
                }
            }
        };

        findContentRecursive(contentFolder);

        return contentItems;
    }

    /**
     * Find file by slug and parse
     * @param slug 
     * @returns 
     */
    async getContentBySlug(slug: string): Promise<ContentFetchDto> {
        const contentFolder = this.contentPath;
        const fullPath = path.join(contentFolder, slug, 'index.mdx');

        if (!fs.existsSync(fullPath)) {
            throw new Error(`Content not found: ${slug}`);
        }

        return this.parseContentFile(fullPath, slug);
    }

    /**
     * 
     * @param metadata 
     * @returns 
     */
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

    /**
     * Delete content from foler
     * @param slug 
     * @returns 
     */
    async deleteContent(slug: string): Promise<ContentObjectDto> {
        try {
            const contentFolder = this.contentPath;
            const fullPath = path.join(contentFolder, slug);
            if (!fs.existsSync(fullPath)) {
                return { success: false, message: `Content not found: ${slug}` };
            }
            fsExtra.removeSync(fullPath);

            return {
                success: true,
                message: `Content "${slug}" has been deleted successfully.`,
                folderPath: `content/${slug}`,
            };
        } catch (error) {
            console.error(`Error deleting content ${slug}:`, error);
            throw new Error(`Failed to delete content: ${error.message}`);
        }
    }

    /**
     * Upate content in folder
     * @param slug 
     * @param contentData 
     * @returns 
     */
    async updateContent(
        slug: string,
        contentData: any
    ): Promise<ContentObjectDto> {
        try {
            const contentFolder = this.contentPath;
            const oldContentFolder = path.join(contentFolder, slug);

            if (!fs.existsSync(oldContentFolder)) {
                throw new Error(`Content folder not found for slug: ${slug}`);
            }
            let contentTitle = contentData.title || slug;
            const newFolderName = this.generateFolderName(contentTitle);
            const newContentFolder = path.join(contentFolder, newFolderName);
            if (oldContentFolder !== newContentFolder) {
                if (fs.existsSync(newContentFolder)) {
                    throw new Error(`Target content folder already exists: ${newFolderName}`);
                }
                fsExtra.moveSync(oldContentFolder, newContentFolder, { overwrite: true });
            }

            const imagesFolder = path.join(newContentFolder, 'images');
            fs.mkdirSync(imagesFolder, { recursive: true });
 
            const fileMap: { [key: string]: string } = {};
            if (contentData.images && contentData.images.length > 0) {
                const tempFolder = path.join(process.cwd(), 'uploads/tmp');

                for (const image of contentData.images) {
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

            let content = this.normalizeAllImagePaths(contentData.content);

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
            const indexPath = path.join(newContentFolder, 'index.mdx');
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
                message: `Content "${slug}" updated successfully.`,
                folderPath: `content/${newFolderName}`,
            };

        } catch (error) {
            console.error(`Error updating content ${slug}:`, error);
            throw new Error(`Failed to update content: ${error.message}`);
        }
    }

    /**
     * Replace image paths
     * @param content 
     * @returns 
     */
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