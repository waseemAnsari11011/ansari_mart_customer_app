import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, StatusBar, Alert, ActivityIndicator, TextInput } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { fetchAddresses } from '../../redux/slices/addressSlice';
import { clearCartThunk } from '../../redux/slices/cartSlice';
import { clearOrders } from '../../redux/slices/orderSlice';
import api, { resolveImageUrl } from '../../utils/api';
import { calculateProductPrice } from '../../utils/pricing';

const { width } = Dimensions.get('window');

const CheckoutScreen = ({ navigation, route }) => {
    const dispatch = useDispatch();
    const insets = useSafeAreaInsets();
    const [paymentMethod, setPaymentMethod] = useState('ONLINE');
    const [upiMethod, setUpiMethod] = useState('PhonePe');
    const [upiId, setUpiId] = useState('');
    const [loading, setLoading] = useState(false);

    // Redux State
    const { cartItems } = useSelector((state) => state.cart);
    const { user } = useSelector((state) => state.auth);
    const { addresses, loading: addressLoading } = useSelector((state) => state.address);
    const isWholesale = route?.params?.isWholesale ?? (user?.type === 'Business');

    // Get selected address (default to first default address if none selected manually)
    const selectedAddress = addresses.find(addr => addr.isDefault) || addresses[0];

    useEffect(() => {
        dispatch(fetchAddresses());
    }, [dispatch]);

    // Calculate Totals
    const subtotal = cartItems.filter(i => i.product).reduce((total, item) => {
        const unitPrice = calculateProductPrice(item.product, item.quantity, isWholesale, item.tierIndex || 0);
        return total + unitPrice * item.quantity;
    }, 0);

    const deliveryFee = 0; // Can be dynamic based on subtotal or address
    const taxRate = 0;
    const taxAmount = 0;
    const orderTotal = subtotal + deliveryFee;

    const handlePlaceOrder = async () => {
        if (!selectedAddress) {
            Alert.alert('Error', 'Please select a delivery address');
            return;
        }

        if (paymentMethod === 'ONLINE' && upiMethod === 'UPI_ID' && !upiId.trim()) {
            Alert.alert('Error', 'Please enter a valid UPI ID');
            return;
        }

        try {
            setLoading(true);

            // 1. Delivery Area Validation
            if (selectedAddress?.latitude && selectedAddress?.longitude) {
                try {
                    const checkRes = await api.post('/delivery-zones/check', {
                        latitude: selectedAddress.latitude,
                        longitude: selectedAddress.longitude
                    });

                    if (checkRes.data && checkRes.data.serviceable === false) {
                        setLoading(false);
                        Alert.alert(
                            'Delivery Restricted',
                            'Sorry, we do not deliver to this location yet. Please select a different address.'
                        );
                        return;
                    }
                } catch (checkErr) {
                    console.log('[CHECKOUT] Location check failed:', checkErr);
                    // We continue if check fails to avoid blocking orders due to network issues
                }
            }

            const finalPaymentMethod = paymentMethod === 'ONLINE'
                ? (upiMethod === 'UPI_ID' ? `ONLINE (UPI: ${upiId})` : `ONLINE (${upiMethod})`)
                : 'COD';

            const orderData = {
                orderItems: cartItems.filter(item => item.product).map(item => {
                    const pricingArray = isWholesale ? item.product?.businessPricing : item.product?.retailPricing;
                    const tier = pricingArray?.[item.tierIndex || 0];
                    const unitLabel = tier?.unit ? ` (${tier.unit})` : '';
                    
                    return {
                        product: item.product?._id,
                        name: (item.product?.name || 'Product') + unitLabel,
                        qty: item.quantity,
                        image: item.product?.images?.[0] || '',
                        price: calculateProductPrice(item.product, item.quantity, isWholesale, item.tierIndex || 0),
                        tierIndex: item.tierIndex || 0
                    };
                }),
                shippingAddress: {
                    name: selectedAddress.name || user?.name || 'Customer',
                    address: selectedAddress.address,
                    city: selectedAddress.city,
                    pincode: selectedAddress.pincode,
                    state: selectedAddress.state,
                    phone: selectedAddress.phone || user?.phone,
                    latitude: selectedAddress.latitude,
                    longitude: selectedAddress.longitude
                },
                paymentMethod: finalPaymentMethod,
                totalPrice: orderTotal,
                adminId: user?._id, // Mapping user to admin field as per backend schema
                type: isWholesale ? 'Business' : 'Retail'
            };

            const response = await api.post('/orders', orderData);

            if (response.data) {
                dispatch(clearCartThunk());
                dispatch(clearOrders()); // Force re-fetch on next Order History visit
                navigation.navigate('OrderSuccess', {
                    isWholesale,
                    orderId: response.data._id
                });
            }
        } catch (error) {
            console.error('Order placement failed:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to place order. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Header */}
            <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <MaterialIcons name="arrow-back-ios" size={20} color="#1E293B" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Checkout</Text>
                    {isWholesale && (
                        <View style={styles.wholesaleBadge}>
                            <Text style={styles.wholesaleBadgeText}>WHOLESALE</Text>
                        </View>
                    )}
                    {!isWholesale && <View style={{ width: 40 }} />}
                </View>
            </View>

            <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: 160 + insets.bottom }]} showsVerticalScrollIndicator={false}>
                {/* Stepper */}
                <View style={styles.stepperContainer}>
                    <View style={styles.stepWrapper}>
                        <View style={[styles.stepCircle, styles.stepActive]}>
                            <Text style={styles.stepText}>1</Text>
                        </View>
                        <Text style={[styles.stepLabel, styles.stepLabelActive]}>Address</Text>
                    </View>
                    <View style={[styles.stepLine, styles.stepLineActive]} />
                    <View style={styles.stepWrapper}>
                        <View style={[styles.stepCircle, styles.stepActive]}>
                            <Text style={styles.stepText}>2</Text>
                        </View>
                        <Text style={[styles.stepLabel, styles.stepLabelActive]}>Payment</Text>
                    </View>
                    <View style={styles.stepLine} />
                    <View style={styles.stepWrapper}>
                        <View style={styles.stepCircle}>
                            <Text style={[styles.stepText, { color: '#94A3B8' }]}>3</Text>
                        </View>
                        <Text style={styles.stepLabel}>Summary</Text>
                    </View>
                </View>

                {/* Delivery Address */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>DELIVERY ADDRESS</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('ManageAddress')}>
                            <Text style={styles.editBtnText}>{addresses.length > 0 ? 'Change' : 'Add'}</Text>
                        </TouchableOpacity>
                    </View>
                    {selectedAddress ? (
                        <View style={styles.addressCard}>
                            <View style={styles.addressIconContainer}>
                                <MaterialIcons
                                    name={selectedAddress.label === 'Office' || isWholesale ? "business" : "home"}
                                    size={22}
                                    color="#2563EB"
                                />
                            </View>
                            <View style={styles.addressInfo}>
                                <Text style={styles.addressName}>{selectedAddress.name || user?.name || 'Ansari General Store'}</Text>
                                <Text style={styles.addressText} numberOfLines={2}>
                                    {`${selectedAddress.address}, ${selectedAddress.city}, ${selectedAddress.state} - ${selectedAddress.pincode}`}
                                </Text>
                                <Text style={styles.contactText}>+91 {(selectedAddress.phone || user?.phone)?.toString().replace(/^\+91\s?|^91\s?/, '')}</Text>
                            </View>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={styles.addAddressPlaceholder}
                            activeOpacity={0.7}
                            onPress={() => navigation.navigate('ManageAddress')}
                        >
                            <View style={styles.addAddressIcon}>
                                <MaterialIcons name="add-location-alt" size={24} color="#64748B" />
                            </View>
                            <Text style={styles.addAddressText}>No address selected. Tap to add or select one.</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Order Items */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>ORDER ITEMS</Text>
                        <View style={styles.itemCountBadge}>
                            <Text style={styles.itemCountText}>{cartItems.filter(i => i.product).length} Items</Text>
                        </View>
                    </View>
                    <View style={styles.itemsList}>
                        {cartItems.filter(item => item.product).map((item, index) => {
                            const pricingArray = isWholesale ? item.product?.businessPricing : item.product?.retailPricing;
                            const tier = pricingArray?.[item.tierIndex || 0];
                            const unitPrice = calculateProductPrice(item.product, item.quantity, isWholesale, item.tierIndex || 0);
                            const itemTotal = unitPrice * item.quantity;

                            return (
                                <View key={`${item.product?._id}-${item.tierIndex || 0}`} style={styles.productItem}>
                                    <View style={styles.productImageContainer}>
                                        <Image
                                            source={{ uri: resolveImageUrl(item.product?.images?.[0]) }}
                                            style={styles.productImage}
                                        />
                                    </View>
                                    <View style={styles.productDetails}>
                                        <View>
                                            <Text style={styles.productName} numberOfLines={1}>{item.product?.name}</Text>
                                            <Text style={styles.wholesaleRate}>
                                                {isWholesale ? 'Wholesale' : 'Retail'}: ₹{unitPrice}/unit
                                                {tier?.unit ? ` (${tier.unit})` : ''}
                                            </Text>
                                        </View>
                                        <View style={styles.productPriceRow}>
                                            <Text style={styles.productPrice}>₹{itemTotal.toLocaleString('en-IN')}</Text>
                                            <View style={styles.qtyBadge}>
                                                <Text style={styles.qtyText}>Qty: {item.quantity}</Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* Payment Methods */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>PAYMENT METHOD</Text>
                    </View>
                    <View style={styles.paymentList}>

                        {/* Online Payment (UPI/Card) */}
                        <TouchableOpacity
                            activeOpacity={0.8}
                            style={[
                                styles.paymentCard,
                                paymentMethod === 'ONLINE' && styles.paymentCardActive
                            ]}
                            onPress={() => {
                                setPaymentMethod('ONLINE');
                                setUpiMethod('PhonePe');
                            }}
                        >
                            <View style={styles.paymentCardContent}>
                                <View style={styles.paymentIconInfo}>
                                    <View style={[styles.paymentIconContainer, { backgroundColor: paymentMethod === 'ONLINE' ? '#F0FDF4' : '#F8FAFC' }]}>
                                        <MaterialIcons
                                            name="qr-code-scanner"
                                            size={22}
                                            color={paymentMethod === 'ONLINE' ? '#3E9400' : '#94A3B8'}
                                        />
                                    </View>
                                    <View>
                                        <Text style={styles.paymentTitle}>Online Payment (UPI/Card)</Text>
                                        <Text style={styles.paymentSubtitle}>Secure payment via PhonePe/UPI</Text>
                                    </View>
                                </View>
                                <View style={[styles.radioOuter, paymentMethod === 'ONLINE' && styles.radioOuterActive]}>
                                    {paymentMethod === 'ONLINE' && <View style={styles.radioInner} />}
                                </View>
                            </View>
                        </TouchableOpacity>

                        {/* Cash on Delivery */}
                        <TouchableOpacity
                            activeOpacity={0.8}
                            style={[
                                styles.paymentCard,
                                paymentMethod === 'COD' && styles.paymentCardActive
                            ]}
                            onPress={() => setPaymentMethod('COD')}
                        >
                            <View style={styles.paymentCardContent}>
                                <View style={styles.paymentIconInfo}>
                                    <View style={[styles.paymentIconContainer, { backgroundColor: paymentMethod === 'COD' ? '#F0FDF4' : '#F8FAFC' }]}>
                                        <MaterialIcons
                                            name="payments"
                                            size={22}
                                            color={paymentMethod === 'COD' ? '#3E9400' : '#94A3B8'}
                                        />
                                    </View>
                                    <View>
                                        <Text style={styles.paymentTitle}>Cash on Delivery</Text>
                                        <Text style={styles.paymentSubtitle}>Pay when your order arrives</Text>
                                    </View>
                                </View>
                                <View style={[styles.radioOuter, paymentMethod === 'COD' && styles.radioOuterActive]}>
                                    {paymentMethod === 'COD' && <View style={styles.radioInner} />}
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Order Summary */}
                <View style={styles.summarySection}>
                    <Text style={styles.sectionTitle}>ORDER SUMMARY</Text>
                    <View style={styles.summaryCardBody}>
                        <View style={styles.summaryItemRow}>
                            <Text style={styles.summaryItemLabel}>Items Total ({cartItems.filter(i => i.product).length})</Text>
                            <Text style={styles.summaryItemValue}>₹{subtotal.toLocaleString('en-IN')}</Text>
                        </View>
                        <View style={styles.summaryItemRow}>
                            <Text style={styles.summaryItemLabel}>Delivery Charges</Text>
                            <Text style={[styles.summaryItemValue, { color: '#3E9400', fontWeight: 'bold' }]}>FREE</Text>
                        </View>
                        <View style={styles.finalTotalRow}>
                            <Text style={styles.finalTotalLabel}>Total Amount</Text>
                            <Text style={styles.finalTotalValue}>₹{orderTotal.toLocaleString('en-IN')}</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Button */}
            <View style={[styles.footerBar, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                <TouchableOpacity
                    style={[styles.mainPlaceOrderBtn, (loading || cartItems.length === 0) && styles.placeOrderBtnDisabled]}
                    onPress={handlePlaceOrder}
                    disabled={loading || cartItems.length === 0}
                    activeOpacity={0.9}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <View style={styles.btnContent}>
                            <MaterialIcons name="task-alt" size={22} color="#fff" style={styles.btnIcon} />
                            <Text style={styles.mainPlaceOrderText}>Confirm & Place Order</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        backgroundColor: 'rgba(255,255,255,0.8)',
        paddingBottom: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0F172A',
        flex: 1,
        textAlign: 'center',
        marginLeft: 8,
    },
    backButton: {
        padding: 4,
    },
    wholesaleBadge: {
        backgroundColor: '#FFF7ED',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FFEDD5',
    },
    wholesaleBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#F68B1E',
        letterSpacing: 0.5,
    },
    scrollContent: {
        padding: 16,
    },
    stepperContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        paddingHorizontal: 12,
    },
    stepWrapper: {
        alignItems: 'center',
        gap: 8,
    },
    stepCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepActive: {
        backgroundColor: '#3E9400',
        borderColor: '#3E9400',
    },
    stepText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#fff',
    },
    stepLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: '#94A3B8',
    },
    stepLabelActive: {
        color: '#3E9400',
    },
    stepLine: {
        flex: 1,
        height: 2,
        backgroundColor: '#E2E8F0',
        marginHorizontal: -8,
        marginTop: -18,
    },
    stepLineActive: {
        backgroundColor: '#3E9400',
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#64748B',
        letterSpacing: 1,
    },
    editBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#F68B1E',
    },
    addressCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        gap: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    addressIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
    },
    addressInfo: {
        flex: 1,
    },
    addressName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 8,
    },
    addressText: {
        fontSize: 14,
        color: '#64748B',
        lineHeight: 20,
        marginBottom: 8,
    },
    contactText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#334155',
    },
    itemCountBadge: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    itemCountText: {
        fontSize: 12,
        color: '#475569',
        fontWeight: '600',
    },
    itemsList: {
        gap: 12,
    },
    productItem: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        flexDirection: 'row',
        gap: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    productImageContainer: {
        width: 72,
        height: 72,
        borderRadius: 8,
        backgroundColor: '#F8F9FA',
        overflow: 'hidden',
    },
    productImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    productDetails: {
        flex: 1,
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    productName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E293B',
    },
    wholesaleRate: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 4,
    },
    productPriceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    productPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#3E9400',
    },
    qtyBadge: {
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    qtyText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#475569',
    },
    paymentList: {
        gap: 8,
    },
    paymentCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        marginBottom: 8,
    },
    paymentCardActive: {
        borderColor: '#3E9400',
        backgroundColor: '#fff',
        borderWidth: 2,
        shadowColor: '#3E9400',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 2,
    },
    paymentCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    paymentIconInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    paymentIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    paymentTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    paymentSubtitle: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 2,
    },
    radioOuter: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioOuterActive: {
        borderColor: '#3E9400',
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#3E9400',
    },
    summaryCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    summaryLabel: {
        fontSize: 14,
        color: '#64748B',
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E293B',
    },
    savingsLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#3E9400',
        fontStyle: 'italic',
    },
    savingsValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#3E9400',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        paddingTop: 16,
        marginTop: 8,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0F172A',
    },
    totalValue: {
        fontSize: 20,
        fontWeight: '900',
        color: '#3E9400',
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(255,255,255,0.95)',
        paddingHorizontal: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    securityInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    securityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    securityText: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
    },
    placeOrderBtn: {
        backgroundColor: '#3E9400',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 16,
        gap: 8,
        shadowColor: '#3E9400',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    placeOrderText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    placeOrderBtnDisabled: {
        backgroundColor: '#94A3B8',
        shadowOpacity: 0,
        elevation: 0,
    },
    addAddressPlaceholder: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#F1F5F9',
        borderStyle: 'dashed',
        gap: 12,
    },
    addAddressText: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
        textAlign: 'center',
    },
    paymentTextContent: {
        flex: 1,
        marginLeft: 12,
    },
    paymentTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    paymentTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
    },
    limitBadge: {
        backgroundColor: '#DCFCE7',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    limitBadgeText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#16A34A',
    },
    upiOptionsWrapper: {
        marginTop: 16,
    },
    upiOptionsDivider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginBottom: 16,
    },
    upiOptionsHeader: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#94A3B8',
        letterSpacing: 0.5,
        marginTop: 16,
        marginBottom: 8,
    },
    upiOptionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        borderRadius: 12,
        marginBottom: 8,
        backgroundColor: '#fff',
    },
    upiOptionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    upiIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    upiOptionName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
    },
    upiInputArea: {
        marginTop: 12,
        paddingBottom: 16,
    },
    upiInputField: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        color: '#1E293B',
    },
    summarySection: {
        marginTop: 8,
        marginBottom: 24,
    },
    summaryCardBody: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    summaryItemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    summaryItemLabel: {
        fontSize: 15,
        color: '#64748B',
        fontWeight: '500',
    },
    summaryItemValue: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1E293B',
    },
    finalTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        paddingTop: 16,
        marginTop: 12,
    },
    finalTotalLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0F172A',
    },
    finalTotalValue: {
        fontSize: 22,
        fontWeight: '900',
        color: '#3E9400',
    },
    footerBar: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    mainPlaceOrderBtn: {
        backgroundColor: '#3E9400',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    mainPlaceOrderText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    btnIcon: {
        marginTop: 2,
    },
});

export default CheckoutScreen;
