// Display amounts as whole rupees; keep calculation and stored values precise.
export const formatPrice = value => {
    const amount = Number(value ?? 0);
    return Number.isFinite(amount)
        ? Math.round(amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })
        : '0';
};
