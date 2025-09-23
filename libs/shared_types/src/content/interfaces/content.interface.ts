export interface ImageData {
    url: string;
    path?: string;
    filename?: string;
    originalName: string;
}

export interface Content {
    title: string;
    content: string;
    images?: ImageData[];
}
