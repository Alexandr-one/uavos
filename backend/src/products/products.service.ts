import * as fsExtra from 'fs-extra';
import * as fs from 'fs';
import * as path from 'path';
import { Injectable } from '@nestjs/common';
import matter from 'gray-matter';

@Injectable()
export class ProductsService {
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



    // private generateProductsContent(Products: any, images: { [key: string]: string }): string {
    //     let content = Products.content || '';
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

    async pushProduct(Products: any): Promise<{ success: boolean; message: string; folderPath: string }> {
        try {
            const productsFolder = path.join(this.contentPath, 'products');
            if (!fs.existsSync(productsFolder)) fs.mkdirSync(productsFolder, { recursive: true });

            let ProductsTitle = Products.title;
            const folderName = this.generateFolderName(ProductsTitle);
            const ProductsFolder = path.join(productsFolder, folderName);

            if (fs.existsSync(ProductsFolder)) {
                throw new Error(`Products folder already exists: ${folderName}`);
            }

            fs.mkdirSync(ProductsFolder, { recursive: true });

            const imagesFolder = path.join(ProductsFolder, 'images');
            fs.mkdirSync(imagesFolder, { recursive: true });

            const fileMap: { [key: string]: string } = {};

            if (Products.images && Products.images.length > 0) {
                for (const image of Products.images) {
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

            const indexPath = path.join(ProductsFolder, 'index.mdx');
            let content = this.processImagePathsForSave(Products.content);
            for (const [tempUrl, localPath] of Object.entries(fileMap)) {
                const regex = new RegExp(this.escapeRegExp(tempUrl), 'g');
                content = content.replace(regex, localPath);
            }

            fs.writeFileSync(indexPath, content);

            return {
                success: true,
                message: `Products saved in content/products/${folderName}`,
                folderPath: `content/products/${folderName}`
            };
        } catch (err) {
            console.error('Error creating Products:', err);
            throw new Error(`Failed to save Products: ${err.message}`);
        }
    }


    private generateTitleFromSlug(slug: string): string {
        return slug
            .replace(/-/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase())
            .trim();
    }

    private parseProductsFile(filePath: string, folderPath: string): any {
        const content = fs.readFileSync(filePath, 'utf-8');
        const parsed = matter(content);
        const metadata = parsed.data;

        const pathParts = folderPath.split('/');
        const slug = pathParts.pop();

        const ProductsContent = this.processImagePaths(parsed.content, folderPath);
        const frontmatterText = this.convertMetadataToFrontmatter(metadata);
        return {
            id: slug,
            slug: slug,
            title: this.generateTitleFromSlug(folderPath),
            content: frontmatterText + ProductsContent,
            folderPath: `content/products/${folderPath}`,
            metadata: metadata
        };
    }

    private processImagePaths(content: string, folderPath: string): string {
        return content.replace(
            /\.\/images\/([^)\s]+)/g,
            `${this.baseUrl}/content/products/${folderPath}/images/$1`
        );
    }

    async getAllProducts(): Promise<any[]> {
        const productsFolder = path.join(this.contentPath, 'products');
        if (!fs.existsSync(productsFolder)) return [];

        const products: any[] = [];

        const findproductsRecursive = (currentPath: string, relativePath: string = '') => {
            const items = fs.readdirSync(currentPath, { withFileTypes: true });

            for (const item of items) {
                if (item.isDirectory()) {
                    const itemPath = path.join(currentPath, item.name);
                    const newRelativePath = relativePath ? `${relativePath}/${item.name}` : item.name;

                    const indexPath = path.join(itemPath, 'index.mdx');
                    if (fs.existsSync(indexPath)) {
                        try {
                            const ProductsContent = this.parseProductsFile(indexPath, newRelativePath);
                            products.push(ProductsContent);
                        } catch (error) {
                            console.warn(`Error parsing Products in folder ${newRelativePath}:`, error.message);
                        }
                    } else {
                        findproductsRecursive(itemPath, newRelativePath);
                    }
                }
            }
        };

        findproductsRecursive(productsFolder);

        return products;
    }

    async getProductBySlug(slug: string): Promise<any> {
        const productsFolder = path.join(this.contentPath, 'products');
        const fullPath = path.join(productsFolder, slug, 'index.mdx');

        if (!fs.existsSync(fullPath)) {
            throw new Error(`Products not found: ${slug}`);
        }

        return this.parseProductsFile(fullPath, slug);
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


    async deleteProduct(slug: string): Promise<{ success: boolean; message: string; deletedPath?: string }> {
        try {
            const productsFolder = path.join(this.contentPath, 'products');
            const fullPath = path.join(productsFolder, slug);
            if (!fs.existsSync(fullPath)) {
                return { success: false, message: `Products not found: ${slug}` };
            }
            fsExtra.removeSync(fullPath);

            return {
                success: true,
                message: `Products "${slug}" has been deleted successfully.`,
                deletedPath: `content/products/${slug}`,
            };
        } catch (error) {
            console.error(`Error deleting Products ${slug}:`, error);
            throw new Error(`Failed to delete Products: ${error.message}`);
        }
    }



    async updateProduct(
        slug: string,
        ProductsData: any
    ): Promise<{ success: boolean; message: string; folderPath: string }> {
        try {
            const productsFolder = path.join(this.contentPath, 'products');
            const oldProductsFolder = path.join(productsFolder, slug);

            if (!fs.existsSync(oldProductsFolder)) {
                throw new Error(`Products folder not found for slug: ${slug}`);
            }
            let ProductsTitle = ProductsData.title || slug;
            const newFolderName = this.generateFolderName(ProductsTitle);
            const newProductsFolder = path.join(productsFolder, newFolderName);
            if (oldProductsFolder !== newProductsFolder) {
                if (fs.existsSync(newProductsFolder)) {
                    throw new Error(`Target Products folder already exists: ${newFolderName}`);
                }
                fsExtra.moveSync(oldProductsFolder, newProductsFolder, { overwrite: true });
            }

            const imagesFolder = path.join(newProductsFolder, 'images');
            fs.mkdirSync(imagesFolder, { recursive: true });

            const fileMap: { [key: string]: string } = {};
            if (ProductsData.images && ProductsData.images.length > 0) {
                const tempFolder = path.join(process.cwd(), 'uploads/tmp');

                for (const image of ProductsData.images) {
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

            let content = this.normalizeAllImagePaths(ProductsData.content);

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
            const indexPath = path.join(newProductsFolder, 'index.mdx');
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
                message: `Products "${slug}" updated successfully.`,
                folderPath: `content/products/${newFolderName}`,
            };

        } catch (error) {
            console.error(`Error updating Products ${slug}:`, error);
            throw new Error(`Failed to update Products: ${error.message}`);
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