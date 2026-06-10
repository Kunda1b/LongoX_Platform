export interface TemplateStorage { upload(key: string, data: Buffer): Promise<string>; download(key: string): Promise<Buffer>; delete(key: string): Promise<void>; }
