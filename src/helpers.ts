export function fixupUrl(url: string) {
    if (url.startsWith("//")) return `https:${url}`;
    return url;
}