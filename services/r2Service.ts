// Cloudflare Worker R2 Storage Service
// Change this URL after deploying the worker

// @ts-ignore
const WORKER_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_WORKER_URL) || 'https://thamdinhap.trungthanh-quoccuong2025.workers.dev';

export interface UploadedFile {
    key: string;
    url: string;
    name: string;
    size: number;
    type: string;
}

export const r2Service = {
    /**
     * Upload a file to R2 storage
     */
    async uploadFile(file: File): Promise<UploadedFile> {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${WORKER_URL}/upload`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Upload failed');
        }

        const result = await response.json();
        return {
            key: result.key,
            url: `${WORKER_URL}${result.url}`,
            name: result.name,
            size: result.size,
            type: result.type,
        };
    },

    /**
     * Delete a file from R2 storage
     */
    async deleteFile(key: string): Promise<void> {
        const response = await fetch(`${WORKER_URL}/file/${encodeURIComponent(key)}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Delete failed');
        }
    },

    /**
     * Get download URL for a file
     */
    getDownloadUrl(key: string): string {
        return `${WORKER_URL}/file/${encodeURIComponent(key)}`;
    },

    /**
     * List all files in the bucket
     */
    async listFiles(): Promise<{ key: string; size: number; uploaded: string }[]> {
        const response = await fetch(`${WORKER_URL}/list`);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'List failed');
        }

        const result = await response.json();
        return result.files;
    },
};
