export const calculateProductPrice = (product, quantity, isWholesale = false, tierIndex = 0) => {
    if (!product) return 0;

    const pricingTiers = isWholesale ? product.businessPricing : product.retailPricing;

    // If no tiers exist, return 0 (price must come from tiers)
    if (!pricingTiers || !Array.isArray(pricingTiers) || pricingTiers.length === 0) {
        return 0;
    }

    // Return price based on tierIndex
    const applicableTier = pricingTiers[tierIndex] || pricingTiers[0];
    return applicableTier.price;
};

/**
 * Gets the display price for a product (usually the first tier price)
 * @param {Object} product 
 * @param {boolean} isWholesale 
 * @returns {number}
 */
export const getBasePrice = (product, isWholesale = false) => {
    return calculateProductPrice(product, 1, isWholesale);
};
