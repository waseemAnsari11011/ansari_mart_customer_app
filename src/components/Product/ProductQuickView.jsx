import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, Modal, Animated, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { addBulkToCartThunk, selectCartTotal } from '../../redux/slices/cartSlice';
import { resolveImageUrl } from '../../utils/api';
import { calculateProductPrice } from '../../utils/pricing';

const { width, height } = Dimensions.get('window');

const ProductQuickView = ({ isVisible, onClose, product, isWholesale }) => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const dispatch = useDispatch();
    const { cartItems } = useSelector(state => state.cart);
    const cartTotal = useSelector(selectCartTotal);
    const [quantities, setQuantities] = useState({});

    useEffect(() => {
        if (isVisible && product) {
            // Initialize quantities from cart
            const initialQtys = {};
            cartItems.forEach(item => {
                const itemId = item.product?._id || item.product;
                if (itemId === product?._id && item.isWholesale === isWholesale) {
                    initialQtys[item.tierIndex || 0] = item.quantity;
                }
            });
            setQuantities(initialQtys);
        }
    }, [isVisible, product, cartItems, isWholesale]);

    if (!product) return null;

    const performAddToCart = () => {
        try {
            const itemsToAdd = Object.entries(quantities)
                .filter(([_, qty]) => qty > 0)
                .map(([idx, qty]) => ({
                    productId: product._id,
                    quantity: qty,
                    isWholesale,
                    tierIndex: parseInt(idx)
                }));

            if (itemsToAdd.length > 0) {
                dispatch(addBulkToCartThunk({ items: itemsToAdd }));
            }
        } catch (error) {
            console.error('Failed to add to cart:', error);
        }
    };

    const handleClose = () => {
        performAddToCart();
        onClose();
    };

    const handleViewCart = () => {
        performAddToCart();
        onClose();
        navigation.navigate('Cart', { isWholesale });
    };

    const activePricingArray = isWholesale ? product?.businessPricing : product?.retailPricing;
    const totalAmount = activePricingArray?.reduce((sum, tier, idx) => {
        const qty = quantities[idx] || 0;
        return sum + (tier.price * qty);
    }, 0) || 0;

    const totalSelectedQty = Object.values(quantities).reduce((sum, qty) => sum + qty, 0);

    // Calculate other items in cart (excluding current selection) to show combined total
    const otherItemsInCart = cartItems.filter(item => {
        const itemId = item.product?._id || item.product;
        return !(itemId === product?._id && item.isWholesale === isWholesale);
    });

    const otherItemsQty = otherItemsInCart.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const otherItemsAmount = otherItemsInCart.reduce((sum, item) => {
        if (!item.product) return sum;
        const price = calculateProductPrice(item.product, item.quantity, item.isWholesale, item.tierIndex || 0);
        return sum + (price * item.quantity);
    }, 0);

    return (
        <Modal
            visible={isVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={handleClose}
        >
            <View style={styles.modalContainer}>
                <TouchableOpacity
                    style={styles.backdrop}
                    activeOpacity={1}
                    onPress={handleClose}
                />
                <View style={[styles.content, { maxHeight: height * 0.85, paddingBottom: insets.bottom || 20 }]}>
                    <View style={styles.header}>
                        <View style={styles.headerIndicator} />
                        <TouchableOpacity 
                            style={styles.closeBtn} 
                            onPress={handleClose}
                            activeOpacity={0.6}
                            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                        >
                            <Ionicons name="close" size={20} color="#ffffff" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                        {/* Info Section */}
                        <View style={styles.infoCard}>
                            <View style={styles.brandRow}>
                                <Text style={styles.brandText}>{product?.brand || 'ANSARI MART'}</Text>
                                {!!product?.mrp && (
                                    <Text style={[styles.brandText, { color: '#2563eb', fontWeight: '900' }]}>
                                        MRP: ₹{product.mrp}
                                    </Text>
                                )}
                            </View>
                            <Text style={styles.productTitle}>{product?.name}</Text>

                            {/* Dynamic Pricing Tiers */}
                            {activePricingArray?.length > 0 && (
                                <View style={styles.wholesaleCard}>
                                    <View style={styles.wholesaleHeader}>
                                        <View style={styles.wholesaleTitleRow}>
                                            <MaterialIcons name="sell" size={18} color="#3E9400" />
                                            <Text style={styles.wholesaleTitle}>Bulk Savings Available</Text>
                                        </View>
                                    </View>

                                    <View style={styles.tierTable}>
                                        <View style={styles.tableHeader}>
                                            <Text style={[styles.headerCell, { flex: 1.5 }]}>Unit</Text>
                                            <Text style={[styles.headerCell, { flex: 1, textAlign: 'center' }]}>Price</Text>
                                            <Text style={[styles.headerCell, { flex: 1.2, textAlign: 'right' }]}>Quantity</Text>
                                        </View>

                                        {activePricingArray.map((tier, idx) => {
                                            const qty = quantities[idx] || 0;
                                            const isActive = qty > 0;
                                            return (
                                                <View
                                                    key={idx}
                                                    style={[styles.tableRow, isActive && styles.tableRowActive]}
                                                >
                                                    <View style={[styles.cell, { flex: 1.5 }]}>
                                                        <Text style={styles.tierQty}>
                                                            {tier.unit || (idx === 0 ? 'Loose' : `Opt ${idx + 1}`)}
                                                            {tier.label ? <Text style={styles.tierLabelSub}> ({tier.label})</Text> : null}
                                                        </Text>
                                                    </View>

                                                    <View style={[styles.cell, { flex: 1, alignItems: 'center' }]}>
                                                        <Text style={[styles.tierPrice, isActive && { color: '#3E9400' }]}>₹{tier.price}</Text>
                                                    </View>

                                                    <View style={[styles.cell, { flex: 1.2, alignItems: 'flex-end' }]}>
                                                        <View style={[styles.tierQtySelector, isActive && styles.tierQtySelectorActive]}>
                                                            <TouchableOpacity
                                                                style={styles.tierQtyBtn}
                                                                onPress={() => {
                                                                    const newQty = Math.max(0, qty - 1);
                                                                    setQuantities(prev => ({ ...prev, [idx]: newQty }));
                                                                }}
                                                            >
                                                                <MaterialIcons name="remove" size={14} color={isActive ? "#3E9400" : "#64748b"} />
                                                            </TouchableOpacity>
                                                            <Text style={[styles.tierQtyValue, isActive && { color: '#3E9400', fontWeight: 'bold' }]}>
                                                                {qty}
                                                            </Text>
                                                            <TouchableOpacity
                                                                style={[styles.tierQtyBtn, isActive && styles.tierQtyBtnActive]}
                                                                onPress={() => {
                                                                    const newQty = qty + 1;
                                                                    setQuantities(prev => ({ ...prev, [idx]: newQty }));
                                                                }}
                                                            >
                                                                <MaterialIcons name="add" size={14} color={isActive ? "#fff" : "#64748b"} />
                                                            </TouchableOpacity>
                                                        </View>
                                                    </View>
                                                </View>
                                            );
                                        })}
                                    </View>
                                </View>
                            )}

                            {totalAmount > 0 && (
                                <View style={styles.selectionSummary}>
                                    <Text style={styles.summaryTitle}>Selected Items:</Text>
                                    <View style={styles.summaryChips}>
                                        {Object.entries(quantities)
                                            .filter(([_, qty]) => qty > 0)
                                            .map(([idx, qty]) => {
                                                const tier = activePricingArray?.[parseInt(idx)];
                                                return (
                                                    <View key={idx} style={styles.summaryChip}>
                                                        <Text style={styles.summaryChipText}>
                                                            {qty} × {tier?.unit || 'Units'} = ₹{(qty * (tier?.price || 0)).toLocaleString()}
                                                        </Text>
                                                    </View>
                                                );
                                            })}
                                    </View>
                                </View>
                            )}

                            {/* Cart Summary Card */}
                            <View style={styles.cartSummaryCard}>
                                <View style={styles.cartSummaryHeader}>
                                    <MaterialIcons name="shopping-basket" size={18} color="#3E9400" />
                                    <Text style={styles.cartSummaryTitle}>Your Cart Total</Text>
                                </View>
                                <View style={styles.cartSummaryBody}>
                                    <View style={styles.cartSummaryItem}>
                                        <Text style={styles.cartSummaryLabel}>Total Items:</Text>
                                        <Text style={styles.cartSummaryValue}>
                                            {otherItemsQty + totalSelectedQty}
                                        </Text>
                                    </View>
                                    <View style={styles.cartSummaryItem}>
                                        <Text style={styles.cartSummaryLabel}>Total Price:</Text>
                                        <Text style={[styles.cartSummaryValue, { color: '#3E9400', fontWeight: '900' }]}>
                                            ₹{(otherItemsAmount + totalAmount).toLocaleString()}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.totalRow}>
                                <View>
                                    <Text style={styles.totalLabel}>Total Amount</Text>
                                    <Text style={styles.totalPrice}>₹{totalAmount.toLocaleString()}</Text>
                                </View>
                                <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#F58220' }]} onPress={handleViewCart}>
                                    <Text style={styles.primaryBtnText}>View Cart</Text>
                                    <MaterialIcons name="shopping-cart" size={20} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    content: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        width: '100%',
    },
    header: {
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    headerIndicator: {
        width: 40,
        height: 4,
        backgroundColor: '#E2E8F0',
        borderRadius: 2,
    },
    closeBtn: {
        position: 'absolute',
        right: 16,
        top: 10,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#ef4444',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 16,
    },
    infoCard: {
        paddingBottom: 20,
    },
    brandRow: {
        marginBottom: 4,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    brandText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#3E9400',
        letterSpacing: 1.2,
    },
    productTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 16,
    },
    wholesaleCard: {
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        marginBottom: 20,
    },
    wholesaleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    wholesaleTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    wholesaleTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#3E9400',
    },
    tierTable: {
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#F8FAFC',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    headerCell: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#64748b',
        textTransform: 'uppercase',
    },
    tableRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    tableRowActive: {
        backgroundColor: '#F0FDF4',
    },
    cell: {
        justifyContent: 'center',
    },
    tierQty: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    tierLabelSub: {
        fontSize: 10,
        fontWeight: '600',
        color: '#2563EB',
    },
    tierPrice: {
        fontSize: 14,
        fontWeight: '900',
        color: '#1e293b',
    },
    tierQtySelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F8FAFC',
        borderRadius: 8,
        width: 90,
        height: 32,
        paddingHorizontal: 2,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    tierQtySelectorActive: {
        backgroundColor: '#fff',
        borderColor: '#3E9400',
    },
    tierQtyBtn: {
        width: 28,
        height: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tierQtyBtnActive: {
        backgroundColor: '#3E9400',
        borderRadius: 6,
    },
    tierQtyValue: {
        fontSize: 13,
        color: '#1e293b',
        fontWeight: 'bold',
        minWidth: 15,
        textAlign: 'center',
    },
    selectionSummary: {
        backgroundColor: '#F8FAFC',
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    summaryTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#64748b',
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    summaryChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    summaryChip: {
        backgroundColor: '#fff',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    summaryChipText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1e293b',
    },
    totalRow: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        elevation: 2,
        marginBottom: 20,
    },
    totalLabel: {
        fontSize: 11,
        color: '#94a3b8',
    },
    totalPrice: {
        fontSize: 20,
        fontWeight: '900',
        color: '#3E9400',
    },
    primaryBtn: {
        backgroundColor: '#3E9400',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        gap: 8,
    },
    primaryBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    cartSummaryCard: {
        backgroundColor: '#F0FDF4',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#DCFCE7',
    },
    cartSummaryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#DCFCE7',
        paddingBottom: 8,
    },
    cartSummaryTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#166534',
    },
    cartSummaryBody: {
        gap: 8,
    },
    cartSummaryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cartSummaryLabel: {
        fontSize: 13,
        color: '#166534',
        fontWeight: '500',
    },
    cartSummaryValue: {
        fontSize: 14,
        color: '#166534',
        fontWeight: 'bold',
    },
});

export default ProductQuickView;
