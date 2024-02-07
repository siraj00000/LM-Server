// Extract the public ID from a Cloudinary URL
export function extractPublicIdFromUrl(url: string): string | null {
    const match = /\/upload\/([^/]+)\//.exec(url);
    return match ? match[1] : null;
}