import crypto from 'crypto';

export interface StorageResult {
  url: string;
  key: string;
}

export interface FileStorageProvider {
  upload(fileBuffer: Buffer, fileName: string, mimeType: string): Promise<StorageResult>;
  delete(key: string): Promise<boolean>;
}

/**
 * Storage Service Abstraction
 * - In cloud production: can use S3/Cloudflare R2/Google Cloud Storage/Render Persistent Storage.
 * - Supports CDN URL prefixes, Data URIs, or persistent local directory mounts.
 */
class StorageService {
  private cdnBaseUrl: string;

  constructor() {
    this.cdnBaseUrl = process.env.CDN_BASE_URL || '';
  }

  /**
   * Resolves an asset URL for public delivery.
   * If a full HTTPS URL or data URL is provided, returns it as-is.
   * Otherwise attaches CDN prefix if configured.
   */
  resolveUrl(assetPath: string): string {
    if (!assetPath) return '';
    if (assetPath.startsWith('http://') || assetPath.startsWith('https://') || assetPath.startsWith('data:')) {
      return assetPath;
    }
    if (this.cdnBaseUrl) {
      return `${this.cdnBaseUrl.replace(/\/$/, '')}/${assetPath.replace(/^\//, '')}`;
    }
    return assetPath;
  }
}

export const storageService = new StorageService();
