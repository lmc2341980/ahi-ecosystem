export function classNames(...values) {
    return values.filter(Boolean).join(' ');
}
export function formatDate(date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (Number.isNaN(d.getTime()))
        return '';
    return d.toISOString().split('T')[0] ?? '';
}
export function formatDateTime(date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (Number.isNaN(d.getTime()))
        return '';
    return d.toISOString().replace('T', ' ').slice(0, 19);
}
export function slugify(value) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
export function truncate(value, maxLength) {
    if (value.length <= maxLength)
        return value;
    return value.slice(0, maxLength - 1) + '…';
}
export function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
export function isUuid(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
//# sourceMappingURL=index.js.map