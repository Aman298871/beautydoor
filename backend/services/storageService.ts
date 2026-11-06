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
 * Storage Service Abstraction for BeautyDoor
 * 
 * ARCHITECTURE STATUS:
 * - Current Application State: BeautyDoor utilizes curated, externally hosted HTTPS CDN/Unsplash URLs
 *   and bundled public SVGs for all services, packages, and banners. No user file uploads are exposed
 *   in the customer storefront or admin dashboard.
 * - Ephemeral Filesystem Policy: Render's ephemeral filesystem is NEVER used for persistent binary uploads.
 * - Future Upload Path: If customer before/after photos or admin file uploads are added, use an S3-compatible
 *   object storage provider (such as Cloudflare R2 or AWS S3) via @aws-sdk/client-s3 rather than local disk.
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
