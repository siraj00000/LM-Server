export function customSlugify(input: string) {
    // Remove leading and trailing spaces
    let slug = input.trim().toLowerCase();

    // Replace spaces with hyphens
    slug = slug.replace(/\s+/g, '-');

    // Remove special characters
    slug = slug.replace(/[^\w-]+/g, '');

    return slug;
}
