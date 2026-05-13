/**
 * filterProducts - Reusable utility function for filtering products by search query.
 * Filters by product name, brand, or category name.
 *
 * @param {Array} products - Full list of products
 * @param {string} searchQuery - User's search input
 * @returns {Array|null} - Filtered products if searching, null if query is empty
 */
export const filterProducts = (products, searchQuery) => {
    if (!searchQuery || searchQuery.trim().length === 0) {
        return null; // null means "not searching", show normal home layout
    }

    const q = searchQuery.toLowerCase().trim();

    return products.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        (p.category?.name || (typeof p.category === 'string' ? p.category : '')).toLowerCase().includes(q)
    );
};
