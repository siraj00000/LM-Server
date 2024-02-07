export function customSlugify(input) {
    // Remove leading and trailing spaces
    let slug = input.trim().toLowerCase();
    // Replace spaces with hyphens
    slug = slug.replace(/\s+/g, '-');
    // Remove special characters
    slug = slug.replace(/[^\w-]+/g, '');
    return slug;
}
//# sourceMappingURL=slugify.js.map