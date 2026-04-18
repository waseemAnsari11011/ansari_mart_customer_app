import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateCartQtyThunk, removeFromCartThunk, selectCartTotal } from '../../redux/slices/cartSlice';
import { calculateProductPrice } from '../../utils/pricing';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, Platform } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import BottomTab from '../../components/BottomTab';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { resolveImageUrl } from '../../utils/api';

const { width } = Dimensions.get('window');

const CartScreen = ({ navigation, route }) => {
    const dispatch = useDispatch();
    const cartItems = useSelector(state => state.cart.cartItems);
    const cartTotal = useSelector(selectCartTotal);
    const insets = useSafeAreaInsets();
    const user = useSelector(state => state.auth.user);
    const isWholesale = route?.params?.isWholesale ?? (user?.type === 'Business');

    const updateQty = async (productId, quantity, tierIndex) => {
        try {
            if (quantity <= 0) {
                await dispatch(removeFromCartThunk({ productId, tierIndex })).unwrap();
            } else {
                await dispatch(updateCartQtyThunk({ productId, quantity, tierIndex })).unwrap();
            }
        } catch (error) {
            console.error('Failed to update cart quantity:', error);
            alert('Failed to update quantity. Please check your connection.');
        }
    };

    const handleRemove = async (productId, tierIndex) => {
        try {
            await dispatch(removeFromCartThunk({ productId, tierIndex })).unwrap();
        } catch (error) {
            console.error('Failed to remove item from cart:', error);
            alert('Failed to remove item. Please check your connection.');
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <MaterialIcons name="arrow-back-ios" size={20} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{isWholesale ? 'Business Cart' : 'My Shopping Cart'}</Text>
                </View>
                {isWholesale && (
                    <View style={styles.modeTag}>
                        <Text style={styles.modeText}>WHOLESALE MODE</Text>
                    </View>
                )}
            </View>

            <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: 220 + insets.bottom }]}>
                {/* Alerts - Only for Wholesale */}
                {isWholesale ? (
                    <>
                        <View style={[styles.alertBox, styles.successAlert]}>
                            <View style={styles.alertIconBg}>
                                <MaterialIcons name="trending-down" size={18} color="#fff" />
                            </View>
                            <View>
                                <Text style={styles.successTitle}>Bulk Savings Applied!</Text>
                                <Text style={styles.successDesc}>You are saving ₹500 on this order!</Text>
                            </View>
                        </View>

                        <View style={[styles.alertBox, styles.warningAlert]}>
                            <MaterialIcons name="info" size={24} color="#F57C00" />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.warningTitle}>Minimum Order Quantity Not Met</Text>
                                <Text style={styles.warningDesc}>Add 2 more packs of "Premium Basmati Rice" to qualify.</Text>
                            </View>
                        </View>
                    </>
                ) : null}

                {/* Cart Items */}
                <View style={styles.itemsContainer}>
                    {cartItems.length === 0 ? (
                        <View style={styles.emptyCart}>
                            <MaterialIcons name="shopping-cart" size={64} color="#cbd5e1" />
                            <Text style={styles.emptyText}>Your cart is empty</Text>
                        </View>
                    ) : (
                        cartItems.map((item, index) => {
                            const pricingArray = item.isWholesale ? item.product?.businessPricing : item.product?.retailPricing;
                            const tier = pricingArray?.[item.tierIndex || 0];
                            const unitPrice = calculateProductPrice(item.product, item.quantity, item.isWholesale, item.tierIndex || 0);
                            
                            return (
                                <View key={`${item.product._id}-${item.tierIndex || 0}`} style={styles.cartItem}>
                                    <View style={styles.imagePlaceholder}>
                                        <Image source={{ uri: resolveImageUrl(item.product.images?.[0]) }} style={styles.itemThumb} />
                                    </View>
                                    <View style={styles.itemContent}>
                                        <View style={styles.itemHeader}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.itemName} numberOfLines={2}>{item.product.name}</Text>
                                                {tier && (
                                                    <Text style={[styles.unitPrice, { color: '#3E920C', fontWeight: '600' }]}>
                                                        Unit: {tier.unit || 'Standard'}
                                                    </Text>
                                                )}
                                            </View>
                                            <TouchableOpacity onPress={() => handleRemove(item.product._id, item.tierIndex || 0)}>
                                                <MaterialIcons name="delete-outline" size={20} color="#94A3B8" />
                                            </TouchableOpacity>
                                        </View>
                                        <Text style={styles.unitPrice}>
                                            Price: ₹{unitPrice} {tier?.unit ? `/ ${tier.unit}` : ''}
                                        </Text>
                                        
                                        <View style={styles.itemFooter}>
                                            <Text style={styles.totalPrice}>₹{(unitPrice * item.quantity).toLocaleString()}</Text>
                                            <View style={styles.qtyControl}>
                                                <TouchableOpacity onPress={() => updateQty(item.product._id, item.quantity - 1, item.tierIndex || 0)}>
                                                    <MaterialIcons name="remove" size={16} color="#3E920C" />
                                                </TouchableOpacity>
                                                <Text style={styles.qtyText}>{item.quantity}</Text>
                                                <TouchableOpacity onPress={() => updateQty(item.product._id, item.quantity + 1, item.tierIndex || 0)}>
                                                    <MaterialIcons name="add" size={16} color="#3E920C" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            );
                        })
                    )}
                </View>

                <TouchableOpacity style={styles.addMoreBtn} onPress={() => navigation.navigate(isWholesale ? 'BusinessHome' : 'RetailHome')}>
                    <MaterialIcons name="add-circle-outline" size={18} color="#3E920C" />
                    <Text style={styles.addMoreText}>Add More Items</Text>
                </TouchableOpacity>

            </ScrollView>

            {/* Footer Summary */}
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom + 60, 100) }]}>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Subtotal ({cartItems.reduce((a, b) => a + b.quantity, 0)} items)</Text>
                    <Text style={styles.summaryValue}>₹{cartTotal.toLocaleString()}</Text>
                </View>


                <View style={styles.totalDivider} />

                <View style={styles.summaryRow}>
                    <Text style={styles.totalLabel}>{isWholesale ? 'Order Total' : 'Grand Total'}</Text>
                    <Text style={styles.totalAmount}>₹{cartTotal.toLocaleString()}</Text>
                </View>

                <TouchableOpacity
                    style={styles.checkoutBtn}
                    onPress={() => navigation.navigate('Checkout', { isWholesale })}
                >
                    <MaterialIcons name="shopping-bag" size={20} color="#fff" />
                    <Text style={styles.checkoutText}>{isWholesale ? 'Proceed to Wholesale Checkout' : 'Proceed to Checkout'}</Text>
                </TouchableOpacity>
            </View>
            <BottomTab activeTab="Cart" isWholesale={isWholesale} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        padding: 4,
        marginRight: 8
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1E293B'
    },
    modeTag: {
        backgroundColor: 'rgba(245, 130, 32, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12
    },
    modeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#F58220'
    },
    scrollContent: {
        padding: 16,
    },
    alertBox: {
        flexDirection: 'row',
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
        alignItems: 'center',
        gap: 12
    },
    successAlert: {
        backgroundColor: 'rgba(62, 146, 12, 0.05)',
        borderColor: 'rgba(62, 146, 12, 0.2)',
        borderWidth: 1
    },
    alertIconBg: {
        backgroundColor: '#3E920C',
        padding: 6,
        borderRadius: 20
    },
    successTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#3E920C'
    },
    successDesc: {
        fontSize: 12,
        color: '#3E920C'
    },
    warningAlert: {
        backgroundColor: '#FFFBEB',
        borderWidth: 1,
        borderColor: '#FEF3C7',
        alignItems: 'flex-start'
    },
    warningTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#B45309'
    },
    warningDesc: {
        fontSize: 12,
        color: '#D97706',
        marginTop: 2
    },

    itemsContainer: {
        gap: 16,
        marginBottom: 20
    },
    cartItem: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 16,
        flexDirection: 'row',
        gap: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9'
    },
    imagePlaceholder: {
        width: 80,
        height: 80,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        overflow: 'hidden'
    },
    itemThumb: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover'
    },
    itemContent: {
        flex: 1,
        justifyContent: 'space-between'
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
    },
    itemName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1E293B',
        flex: 1,
        marginRight: 8
    },
    unitPrice: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2
    },
    itemFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8
    },
    totalPrice: {
        fontSize: 16,
        fontWeight: '900',
        color: '#3E920C'
    },
    qtyControl: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: '#F1F5F9'
    },
    qtyText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1E293B',
        minWidth: 24,
        textAlign: 'center'
    },
    moqWarning: {
        fontSize: 12,
        color: '#EF4444',
        fontWeight: 'bold',
        marginTop: 4
    },
    addMoreBtn: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginTop: 8
    },
    addMoreText: {
        color: '#3E920C',
        fontWeight: 'bold',
        fontSize: 14
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        padding: 16,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 20
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8
    },
    summaryLabel: {
        fontSize: 14,
        color: '#64748B'
    },
    summaryValue: {
        fontSize: 14,
        color: '#1E293B',
        fontWeight: '600'
    },
    savingsText: {
        color: '#3E920C'
    },
    totalDivider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 12
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1E293B'
    },
    totalAmount: {
        fontSize: 18,
        fontWeight: '900',
        color: '#3E920C'
    },
    checkoutBtn: {
        backgroundColor: '#3E920C',
        borderRadius: 12,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 16,
        shadowColor: '#3E920C',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6
    },
    checkoutText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16
    },
    emptyCart: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        gap: 12
    },
    emptyText: {
        fontSize: 16,
        color: '#94a3b8',
        fontWeight: '600'
    }
});

export default CartScreen;
