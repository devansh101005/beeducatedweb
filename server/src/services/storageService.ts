// Storage Service
// Handles file uploads and downloads with Supabase Storage

import { getSupabase } from '../config/supabase.js';

// Storage bucket names
export const BUCKETS = {
  COURSE_CONTENT: 'course-content',
  THUMBNAILS: 'thumbnails',
  ANNOUNCEMENTS: 'announcements',
  AVATARS: 'avatars',
} as const;

export type BucketName = (typeof BUCKETS)[keyof typeof BUCKETS];

export interface UploadOptions {
  bucket: BucketName;
  path: string;
  file: Buffer;
  contentType: string;
  upsert?: boolean;
}

export interface UploadResult {
  path: string;
  fullPath: string;
  size: number;
}

export interface SignedUrlOptions {
  bucket: BucketName;
  path: string;
  expiresIn?: number; // seconds, default 1 hour
  download?: boolean;
  fileName?: string;
}

// Allowed MIME types for uploads
const ALLOWED_MIME_TYPES = new Set([
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  // Video
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',
  // Audio
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/mp4',
  // Archives
  'application/zip',
]);

class StorageService {
  private supabase = getSupabase();

  /**
   * Upload a file to Supabase Storage
   */
  async upload(options: UploadOptions): Promise<UploadResult> {
    const { bucket, path, file, contentType, upsert = false } = options;

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.has(contentType)) {
      throw new Error(`File type not allowed: ${contentType}`);
    }

    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(path, file, {
        contentType,
        upsert,
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    return {
      path: data.path,
      fullPath: `${bucket}/${data.path}`,
      size: file.length,
    };
  }

  /**
   * Generate a signed URL for private file access
   */
  async getSignedUrl(options: SignedUrlOptions): Promise<string> {
    const { bucket, path, expiresIn = 3600, download = false, fileName } = options;

    const downloadOptions = download
      ? { download: fileName || true }
      : undefined;

    const { data, error } = await this.supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn, downloadOptions);

    if (error) {
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }

    return data.signedUrl;
  }

  /**
   * Get public URL for files in public buckets (thumbnails, avatars)
   */
  getPublicUrl(bucket: BucketName, path: string): string {
    const { data } = this.supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  /**
   * Delete a file from storage
   */
  async delete(bucket: BucketName, path: string): Promise<void> {
    const { error } = await this.supabase.storage.from(bucket).remove([path]);

    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  }

  /**
   * Delete multiple files
   */
  async deleteMany(bucket: BucketName, paths: string[]): Promise<void> {
    const { error } = await this.supabase.storage.from(bucket).remove(paths);

    if (error) {
      throw new Error(`Bulk delete failed: ${error.message}`);
    }
  }

  /**
   * Move/rename a file
   */
  async move(bucket: BucketName, fromPath: string, toPath: string): Promise<void> {
    const { error } = await this.supabase.storage.from(bucket).move(fromPath, toPath);

    if (error) {
      throw new Error(`Move failed: ${error.message}`);
    }
  }

  /**
   * Copy a file
   */
  async copy(bucket: BucketName, fromPath: string, toPath: string): Promise<void> {
    const { error } = await this.supabase.storage.from(bucket).copy(fromPath, toPath);

    if (error) {
      throw new Error(`Copy failed: ${error.message}`);
    }
  }

  /**
   * List files in a folder
   */
  async list(
    bucket: BucketName,
    folderPath: string,
    options?: { limit?: number; offset?: number }
  ): Promise<{ name: string; metadata: Record<string, unknown> }[]> {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .list(folderPath, {
        limit: options?.limit || 100,
        offset: options?.offset || 0,
      });

    if (error) {
      throw new Error(`List failed: ${error.message}`);
    }

    return data.map((file) => ({
      name: file.name,
      metadata: file.metadata || {},
    }));
  }

  /**
   * Generate a unique file path for uploads
   */
  generatePath(options: {
    folder: string;
    fileName: string;
    addTimestamp?: boolean;
  }): string {
    const { folder, fileName, addTimestamp = true } = options;
    const ext = fileName.split('.').pop() || '';
    const baseName = fileName.replace(/\.[^/.]+$/, '');
    const sanitized = baseName.replace(/[^a-zA-Z0-9-_]/g, '_').toLowerCase();

    if (addTimestamp) {
      const timestamp = Date.now();
      return `${folder}/${sanitized}-${timestamp}.${ext}`;
    }

    return `${folder}/${sanitized}.${ext}`;
  }

  /**
   * Get file metadata
   */
  async getMetadata(bucket: BucketName, path: string): Promise<{
    size: number;
    mimetype: string;
    lastModified: string;
  } | null> {
    // List the specific file to get its metadata
    const folderPath = path.substring(0, path.lastIndexOf('/'));
    const fileName = path.substring(path.lastIndexOf('/') + 1);

    const { data, error } = await this.supabase.storage
      .from(bucket)
      .list(folderPath, { search: fileName });

    if (error || !data || data.length === 0) {
      return null;
    }

    const file = data.find((f) => f.name === fileName);
    if (!file || !file.metadata) {
      return null;
    }

    return {
      size: file.metadata.size as number,
      mimetype: file.metadata.mimetype as string,
      lastModified: file.updated_at || file.created_at || new Date().toISOString(),
    };
  }

  /**
   * Check if a file exists
   */
  async exists(bucket: BucketName, path: string): Promise<boolean> {
    const metadata = await this.getMetadata(bucket, path);
    return metadata !== null;
  }

  /**
   * Upload from URL (download and re-upload)
   */
  async uploadFromUrl(options: {
    url: string;
    bucket: BucketName;
    path: string;
  }): Promise<UploadResult> {
    const { url, bucket, path } = options;

    // Fetch the file
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch file from URL: ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    return this.upload({
      bucket,
      path,
      file: buffer,
      contentType,
    });
  }

  /**
   * Generate upload URL for client-side uploads (presigned URL)
   */
  async getUploadUrl(options: {
    bucket: BucketName;
    path: string;
  }): Promise<{ signedUrl: string; path: string }> {
    const { bucket, path } = options;

    const { data, error } = await this.supabase.storage
      .from(bucket)
      .createSignedUploadUrl(path);

    if (error) {
      throw new Error(`Failed to generate upload URL: ${error.message}`);
    }

    return {
      signedUrl: data.signedUrl,
      path: data.path,
    };
  }
}

// Export singleton instance
export const storageService = new StorageService();
