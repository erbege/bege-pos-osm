/**
 * Format a number to Indonesian Rupiah currency format.
 * @param {number} amount
 * @returns {string} e.g. "Rp 15.000"
 */
export function formatRupiah(amount) {
    if (amount == null || isNaN(amount)) return 'Rp 0';
    return 'Rp ' + Number(amount).toLocaleString('id-ID');
}

/**
 * Format a date string to Indonesian locale.
 * @param {string} dateStr - ISO date string
 * @returns {string} e.g. "3 Maret 2026"
 */
export function formatDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

/**
 * Format a datetime string to Indonesian locale with time.
 * @param {string} dateStr - ISO datetime string
 * @returns {string} e.g. "3 Maret 2026, 14:30"
 */
export function formatDateTime(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}
