import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, StatusBar, Platform } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api, { resolveImageUrl } from '../../utils/api';
import { ActivityIndicator } from 'react-native';

const { width } = Dimensions.get('window');

const OrderDetailsScreen = ({ navigation, route }) => {
    const insets = useSafeAreaInsets();
    const { orderId } = route.params || {};
    const [order, setOrder] = React.useState(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchOrder = async () => {
            try {
                const { data } = await api.get(`/orders/${orderId}`);
                setOrder(data);
            } catch (error) {
                console.error('Failed to fetch order details:', error);
            } finally {
                setLoading(false);
            }
        };
        if (orderId) fetchOrder();
    }, [orderId]);

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#3E9400" />
                <Text style={{ marginTop: 12, color: '#94A3B8', fontWeight: 'bold' }}>Loading details...</Text>
            </View>
        );
    }

    if (!order) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <MaterialIcons name="error-outline" size={64} color="#EF4444" />
                <Text style={{ marginTop: 12, color: '#94A3B8', fontWeight: 'bold' }}>Order not found</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
                    <Text style={{ color: '#3E9400', fontWeight: 'bold' }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Header */}
            <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back-ios" size={20} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Order Summary</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 + insets.bottom }]} showsVerticalScrollIndicator={false}>
                {/* Order ID & Status */}
                <View style={[styles.orderStatusCard, { borderTopWidth: 1, borderTopColor: '#F1F5F9' }]}>
                    <View style={styles.statusHeader}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.orderIdLabel}>ORDER ID</Text>
                            <Text style={styles.orderIdText}>#{order._id?.toString().length > 12 ? order._id.substring(order._id.length - 8) : order._id}</Text>
                        </View>
                        <View style={[styles.statusBadge, { 
                            backgroundColor: order.status === 'Delivered' ? 'rgba(62, 148, 0, 0.1)' : 'rgba(246, 139, 30, 0.1)',
                            borderColor: order.status === 'Delivered' ? 'rgba(62, 148, 0, 0.2)' : 'rgba(246, 139, 30, 0.2)'
                        }]}>
                            <Text style={[styles.statusBadgeText, { 
                                color: order.status === 'Delivered' ? '#3E9400' : '#F68B1E' 
                            }]}>{order.status?.toUpperCase()}</Text>
                        </View>
                    </View>
                    <View style={styles.dateRow}>
                        <MaterialIcons name="calendar-today" size={14} color="#94A3B8" />
                        <Text style={styles.dateText}>{orderDate}</Text>
                    </View>
                </View>

                {/* Items List */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>ITEMS ({order.orderItems?.length})</Text>

                    {order.orderItems?.map((item, idx) => (
                        <View key={idx} style={styles.itemCard}>
                            <Image
                                source={{ uri: resolveImageUrl(item.image) }}
                                style={styles.itemImage}
                            />
                            <View style={styles.itemInfo}>
                                <Text style={styles.itemName}>{item.name}</Text>
                                <Text style={styles.itemVariant}>Quantity: {item.qty} units</Text>
                                <View style={styles.itemPriceRow}>
                                    <Text style={styles.itemPrice}>₹{item.price * item.qty}</Text>
                                    <Text style={styles.discountTag}>₹{item.price} per unit</Text>
                                </View>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Billing Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>BILLING DETAILS</Text>
                    <View style={styles.billingCard}>
                        <View style={styles.billingRow}>
                            <Text style={styles.billingLabel}>Item Subtotal</Text>
                            <Text style={styles.billingValue}>₹{order.totalPrice}</Text>
                        </View>
                        <View style={styles.billingRow}>
                            <Text style={styles.billingLabel}>Delivery Fee</Text>
                            <Text style={[styles.billingValue, { color: '#3E9400' }]}>FREE</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Grand Total</Text>
                            <Text style={styles.totalValue}>₹{order.totalPrice}</Text>
                        </View>
                    </View>
                </View>

                {/* Shipping & Payment */}
                <View style={styles.section}>
                    <View style={styles.gridRow}>
                        <View style={styles.gridCol}>
                            <Text style={styles.sectionLabel}>SHIPPING ADDRESS</Text>
                            <View style={styles.addressCard}>
                                <View style={styles.addressHeader}>
                                    <MaterialIcons name="location-on" size={18} color="#3E9400" />
                                    <Text style={styles.addressName}>{order.shippingAddress?.city}</Text>
                                </View>
                                <Text style={styles.addressText}>
                                    {order.shippingAddress?.address}, {order.shippingAddress?.city}{"\n"}
                                    Ph: {order.shippingAddress?.phone}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={[styles.gridRow, { marginTop: 20 }]}>
                        <View style={styles.gridCol}>
                            <Text style={styles.sectionLabel}>PAYMENT METHOD</Text>
                            <View style={styles.paymentCard}>
                                <View style={styles.paymentLeft}>
                                    <MaterialIcons 
                                        name={order.paymentMethod?.includes('ONLINE') ? "qr-code-scanner" : "payments"} 
                                        size={20} 
                                        color="#3E9400" 
                                    />
                                    <Text style={styles.paymentText}>
                                        {order.paymentMethod?.includes('ONLINE') ? 'Online Payment' : 'Cash on Delivery'}
                                    </Text>
                                </View>
                                <MaterialIcons name="fact-check" size={18} color="#3E9400" />
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Footer */}
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
                <TouchableOpacity style={styles.downloadBtn}>
                    <MaterialIcons name="download" size={20} color="#fff" />
                    <Text style={styles.downloadBtnText}>Download Invoice</Text>
                </TouchableOpacity>
                <View style={styles.iosBar} />
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0F172A',
    },
    scrollContent: {
        paddingBottom: 24,
    },
    orderStatusCard: {
        backgroundColor: '#fff',
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    statusHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    orderIdLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#94A3B8',
        letterSpacing: 1.5,
        marginBottom: 4,
    },
    orderIdText: {
        fontSize: 20,
        fontWeight: '900',
        color: '#0F172A',
        textTransform: 'uppercase',
        paddingRight: 8,
    },
    statusBadge: {
        backgroundColor: 'rgba(62, 148, 0, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(62, 148, 0, 0.2)',
    },
    statusBadgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#3E9400',
        letterSpacing: 0.5,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 4,
    },
    dateText: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    section: {
        marginTop: 24,
        paddingHorizontal: 16,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#94A3B8',
        letterSpacing: 1.5,
        marginBottom: 12,
        marginLeft: 4,
    },
    itemCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        gap: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    itemImage: {
        width: 80,
        height: 80,
        borderRadius: 12,
        backgroundColor: '#F8F9FA',
    },
    itemInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    itemName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0F172A',
        marginBottom: 4,
    },
    itemVariant: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 12,
    },
    itemPriceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    itemPrice: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#3E9400',
    },
    discountTag: {
        fontSize: 11,
        color: '#94A3B8',
        fontStyle: 'italic',
    },
    billingCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    billingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    billingLabel: {
        fontSize: 14,
        color: '#64748B',
    },
    billingValue: {
        fontSize: 15,
        fontWeight: '600',
        color: '#0F172A',
    },
    wholesaleDiscountLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#3E9400',
    },
    wholesaleDiscountValue: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#3E9400',
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 12,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0F172A',
    },
    totalValue: {
        fontSize: 20,
        fontWeight: '900',
        color: '#F68B1E',
    },
    gridRow: {
        flexDirection: 'row',
        gap: 16,
    },
    gridCol: {
        flex: 1,
    },
    addressCard: {
        backgroundColor: '#F1F5F9',
        borderRadius: 16,
        padding: 16,
    },
    addressHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    addressName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#0F172A',
    },
    addressText: {
        fontSize: 13,
        color: '#64748B',
        lineHeight: 18,
    },
    paymentCard: {
        backgroundColor: '#F1F5F9',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    paymentLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    paymentText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#0F172A',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    downloadBtn: {
        backgroundColor: '#3E9400',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 16,
        gap: 12,
        shadowColor: '#3E9400',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    downloadBtnText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    iosBar: {
        height: 6,
    }
});

export default OrderDetailsScreen;
