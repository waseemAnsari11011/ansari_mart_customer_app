import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, StatusBar, ScrollView } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../utils/api';

const { width } = Dimensions.get('window');

const OrderSuccessScreen = ({ navigation, route }) => {
    const insets = useSafeAreaInsets();
    const isWholesale = route.params?.isWholesale ?? true;
    const orderId = route.params?.orderId;
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(!!orderId);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Combine animations for the success icon
    const combinedScale = Animated.multiply(scaleAnim, pulseAnim);

    useEffect(() => {
        const fetchOrder = async () => {
            if (!orderId) return;
            try {
                const response = await api.get(`/orders/${orderId}`);
                setOrder(response.data);
            } catch (error) {
                console.error('Failed to fetch order:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();

        const animation = Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 4,
                tension: 40,
                useNativeDriver: true,
            })
        ]);

        animation.start(() => {
            // Start pulsing animation after initial entrance
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    })
                ])
            ).start();
        });

        return () => {
            animation.stop();
            pulseAnim.stopAnimation();
        };
    }, [fadeAnim, slideAnim, scaleAnim, pulseAnim, orderId]);

    const shippingAddress = order?.shippingAddress;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />

            <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 + insets.bottom }]} showsVerticalScrollIndicator={false}>
                <View style={styles.content}>
                    {/* Success Icon */}
                    <Animated.View style={[
                        styles.successWrapper,
                        {
                            transform: [
                                { scale: combinedScale }
                            ]
                        }
                    ]}>
                        <View style={styles.checkmarkWrapper}>
                            <MaterialIcons name="check" size={60} color="#fff" />
                        </View>
                        <Animated.View style={[
                            styles.successPulse,
                            {
                                opacity: scaleAnim,
                                transform: [{ scale: pulseAnim }]
                            }
                        ]} />
                    </Animated.View>

                    {/* Titling */}
                    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], alignItems: 'center' }}>
                        <Text style={styles.title}>Order Placed Successfully!</Text>
                        <Text style={styles.subtitle}>
                            Thank you for your business. Your order is being processed.
                        </Text>
                    </Animated.View>

                    {/* Order Info Card */}
                    <Animated.View style={[styles.successCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                        <View style={styles.cardHeader}>
                            <View>
                                <Text style={styles.cardLabel}>ORDER ID</Text>
                                <Text style={styles.cardValue}>#{orderId ? orderId.substring(orderId.length - 8) : 'SUCCESS'}</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={styles.cardLabel}>ESTIMATED DELIVERY</Text>
                                <Text style={[styles.cardValue, { color: '#3E9400' }]}>Within 2-3 Days</Text>
                            </View>
                        </View>

                        <View style={styles.deliverySection}>
                            <View style={styles.iconCircle}>
                                <MaterialIcons name={isWholesale ? "business" : "home"} size={20} color="#94A3B8" />
                            </View>
                            <View style={styles.deliveryTextWrapper}>
                                <Text style={styles.deliveryLabel}>DELIVERY TO</Text>
                                <Text style={styles.storeName}>{order?.shippingAddress?.name || order?.admin?.name || 'Customer'}</Text>
                                <Text style={styles.addressText}>
                                    {shippingAddress 
                                        ? `${shippingAddress.address}, ${shippingAddress.city}, ${shippingAddress.state || ''} ${shippingAddress.pincode ? '- ' + shippingAddress.pincode : ''}`
                                        : 'Address details available in order history'}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.invoiceRow}>
                            <View style={styles.invoiceLeft}>
                                <MaterialIcons name="receipt" size={20} color="#F68B1E" />
                                <Text style={styles.invoiceText}>Order invoice generated</Text>
                            </View>
                            <TouchableOpacity style={styles.downloadBtn}>
                                <Text style={styles.downloadBtnText}>View Details</Text>
                                <MaterialIcons name="chevron-right" size={16} color="#3E9400" />
                            </TouchableOpacity>
                        </View>
                    </Animated.View>

                    {/* Main Actions */}
                    <View style={styles.actionSection}>
                        <TouchableOpacity
                            style={styles.continueBtn}
                            onPress={() => navigation.navigate(isWholesale ? 'BusinessHome' : 'RetailHome')}
                        >
                            <Text style={styles.continueBtnText}>Continue Shopping</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            {/* Footer */}
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                <View style={styles.homeIndicator} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    content: {
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 40,
    },
    successWrapper: {
        width: 120,
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
    },
    checkmarkWrapper: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: '#3E9400',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        elevation: 10,
        shadowColor: '#3E9400',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
    },
    successPulse: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(62, 148, 0, 0.15)',
    },
    title: {
        fontSize: 30,
        fontWeight: '900',
        color: '#0F172A',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
        paddingHorizontal: 20,
    },
    successCard: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 32,
        padding: 24,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#F8FAFC',
        paddingBottom: 16,
        marginBottom: 16,
    },
    cardLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#94A3B8',
        letterSpacing: 1,
        marginBottom: 4,
    },
    cardValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0F172A',
    },
    deliverySection: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    iconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 2,
    },
    deliveryTextWrapper: {
        flex: 1,
    },
    deliveryLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#94A3B8',
        letterSpacing: 1,
        marginBottom: 4,
    },
    storeName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 4,
    },
    addressText: {
        fontSize: 12,
        color: '#64748B',
        lineHeight: 18,
    },
    divider: {
        height: 1,
        backgroundColor: '#F8FAFC',
        marginBottom: 16,
    },
    invoiceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    invoiceLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    invoiceText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#475569',
    },
    downloadBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    downloadBtnText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#3E9400',
    },
    actionSection: {
        width: '100%',
        marginTop: 40,
        gap: 16,
    },
    continueBtn: {
        width: '100%',
        paddingVertical: 18,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#E2E8F0',
        alignItems: 'center',
    },
    continueBtnText: {
        color: '#64748B',
        fontSize: 16,
        fontWeight: '700',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    homeIndicator: {
        width: 120,
        height: 5,
        backgroundColor: '#E2E8F0',
        borderRadius: 3,
    },
});

export default OrderSuccessScreen;
