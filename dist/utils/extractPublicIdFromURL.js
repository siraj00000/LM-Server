// Extract the public ID from a Cloudinary URL
export function extractPublicIdFromUrl(url) {
    const match = /\/upload\/([^/]+)\//.exec(url);
    return match ? match[1] : null;
}
//# sourceMappingURL=extractPublicIdFromURL.js.map