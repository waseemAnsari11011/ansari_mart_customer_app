// Presentation labels only; API customer types remain Retail and Business.
export const customerText = value => String(value ?? '').replace(/\bretail\b/gi, 'Customer');
