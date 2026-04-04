import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, Animated, StatusBar, SafeAreaView } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const OrderTrackingScreen = ({ navigation, route }) => {
    const insets = useSafeAreaInsets();
    const { orderId } = route.params || { orderId: 'AM-98234120' };

    const pulseAnim = useRef(new Animated.Value(1)).current;
    const sheetAnim = useRef(new Animated.Value(height * 0.5)).current;
    const [isSheetExpanded, setIsSheetExpanded] = useState(true);

    const toggleSheet = () => {
        const toValue = isSheetExpanded ? 400 : 0;
        Animated.spring(sheetAnim, {
            toValue,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
        }).start();
        setIsSheetExpanded(!isSheetExpanded);
    };


    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.5,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                })
            ])
        ).start();

        Animated.spring(sheetAnim, {
            toValue: 0,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
        }).start();
    }, []);

    return (
        <View style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

            {/* Map Simulation */}
            <View style={styles.mapBackground}>
                <View style={styles.roadNetwork}>
                    {/* Mock roads and paths */}
                    <View style={[styles.road, { width: '120%', top: '20%', transform: [{ rotate: '5deg' }] }]} />
                    <View style={[styles.road, { width: 40, height: '100%', left: '40%' }]} />
                    <View style={[styles.road, { width: 30, height: '100%', left: '70%', opacity: 0.3 }]} />
                    <View style={[styles.road, { width: '100%', top: '55%', transform: [{ rotate: '-2deg' }] }]} />
                </View>

                {/* Markers */}
                <View style={[styles.marker, { top: '25%', left: '35%' }]}>
                    <View style={styles.warehouseMarker}>
                        <MaterialIcons name="warehouse" size={20} color="#fff" />
                    </View>
                    <View style={styles.markerLabelContainer}>
                        <Text style={styles.markerLabel}>JAMIA MILLIA</Text>
                    </View>
                </View>

                <View style={[styles.marker, { top: '40%', left: '55%' }]}>
                    <Animated.View style={[styles.driverPulse, { transform: [{ scale: pulseAnim }] }]} />
                    <View style={styles.driverMarker}>
                        <MaterialIcons name="local-shipping" size={24} color="#fff" />
                    </View>
                    <View style={[styles.markerLabelContainer, { top: 40 }]}>
                        <Text style={[styles.markerLabel, { color: '#3E9400' }]}>3 MINS AWAY</Text>
                    </View>
                </View>

                <View style={[styles.marker, { top: '55%', left: '75%' }]}>
                    <View style={styles.homeMarker}>
                        <MaterialIcons name="home" size={20} color="#fff" />
                    </View>
                    <View style={styles.markerLabelContainer}>
                        <Text style={styles.markerLabel}>APOLLO HOSPITAL</Text>
                    </View>
                </View>
            </View>

            {/* Floating UI Elements */}
            <SafeAreaView style={styles.floatingHeader}>
                <View style={[styles.headerTop, { paddingTop: Math.max(insets.top, 16) }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <MaterialIcons name="arrow-back" size={20} color="#0F172A" />
                    </TouchableOpacity>
                    <View style={styles.trackingStatus}>
                        <View style={styles.liveIndicator}>
                            <View style={styles.redDot} />
                            <Text style={styles.liveText}>LIVE TRACKING</Text>
                        </View>
                        <View style={styles.accuracyBadge}>
                            <View style={styles.greenPulse} />
                            <Text style={styles.accuracyText}>HIGH ACCURACY</Text>
                        </View>
                    </View>
                </View>
            </SafeAreaView>

            {/* Bottom Sheet */}
            <Animated.View style={[styles.bottomSheet, { transform: [{ translateY: sheetAnim }] }]}>
                <TouchableOpacity onPress={toggleSheet} activeOpacity={0.7} style={styles.dragHandleArea}>
                    <View style={styles.dragIndicator} />
                </TouchableOpacity>
                <ScrollView contentContainerStyle={[styles.sheetScroll, { paddingBottom: 40 + insets.bottom }]} showsVerticalScrollIndicator={false}>
                    <View style={styles.sheetHeader}>
                        <View>
                            <Text style={styles.arrivingTitle}>Arriving in 3 Mins</Text>
                            <Text style={styles.orderMeta}>Order #{orderId?.toString().length > 12 ? orderId.substring(orderId.length - 8) : orderId} • 2.4km remaining</Text>
                            <View style={styles.itemsBadge}>
                                <MaterialIcons name="inventory" size={14} color="#F68B1E" />
                                <Text style={styles.itemsText}>12 items in this shipment</Text>
                            </View>
                        </View>
                        <View style={styles.statusBadge}>
                            <Text style={styles.statusText}>IN TRANSIT</Text>
                        </View>
                    </View>

                    <View style={styles.addressCard}>
                        <View style={styles.addressIconBg}>
                            <MaterialIcons name="location-on" size={20} color="#F68B1E" />
                        </View>
                        <View>
                            <Text style={styles.addressKey}>Delivery Address</Text>
                            <Text style={styles.addressValue}>Apollo Hospital, Sarita Vihar, Delhi</Text>
                        </View>
                    </View>

                    {/* Stepper */}
                    <View style={styles.stepperSection}>
                        <View style={styles.stepItem}>
                            <View style={[styles.stepLine, styles.stepLineActive]} />
                            <View style={styles.stepCircleActive}>
                                <View style={styles.pingDot} />
                            </View>
                            <View style={styles.stepContent}>
                                <View style={styles.stepHeaderRow}>
                                    <Text style={[styles.stepTitle, { color: '#3E9400' }]}>Live Update</Text>
                                    <View style={styles.newBadge}><Text style={styles.newBadgeText}>NEW</Text></View>
                                </View>
                                <Text style={styles.stepDescItalic}>"Passed Okhla flyover at 10:45 AM"</Text>
                            </View>
                        </View>

                        <View style={styles.stepItem}>
                            <View style={[styles.stepLine, styles.stepLineActive]} />
                            <View style={styles.stepCircleCompleted}>
                                <MaterialIcons name="check" size={16} color="#fff" />
                            </View>
                            <View style={styles.stepContent}>
                                <View style={styles.stepHeaderRow}>
                                    <Text style={styles.stepTitle}>Order Processed</Text>
                                    <Text style={styles.stepTimeText}>10:30 AM</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.stepItem}>
                            <View style={styles.stepCircleEmpty}>
                                <MaterialIcons name="schedule" size={18} color="#94A3B8" />
                            </View>
                            <View style={styles.stepContent}>
                                <View style={styles.stepHeaderRow}>
                                    <Text style={[styles.stepTitle, { color: '#94A3B8' }]}>Delivered</Text>
                                    <Text style={styles.stepTimeText}>Expected 02:00 PM</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Driver Card */}
                    <View style={styles.driverCard}>
                        <Image
                            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDY1-mAyw85Um5ZQ_BiCVS6veThpgP2p9ZGC9Mvc8PdDOhRNnsSrWRTmHKlfOCx7HQRkjjkhW0Hf-JES7BHIS8brd8n9Wgw9EOaxfWAzZYVspbTYIMOMAPhfzJrhB9BLbsac4Zy4xaSq2kzM_i21fvOqSi0nK__A4o_SdczP1fLhhBUn1jFDqbX-ZJXamoX9gwfuE2NM4h9zqDn86griA4GvzMVU5KHf4tgsH0PM0O9xsJCSgbIJaEjbU3iRIbnWbkXOjhrZ6p7jF4' }}
                            style={styles.driverImg}
                        />
                        <View style={styles.driverInfo}>
                            <Text style={styles.partnerText}>ANSARI MART PARTNER</Text>
                            <Text style={styles.driverName}>Ramesh Kumar</Text>
                            <View style={styles.ratingBox}>
                                <MaterialIcons name="star" size={14} color="#FBBF24" />
                                <Text style={styles.ratingVal}>4.8</Text>
                            </View>
                        </View>
                        <View style={styles.driverActions}>
                            <TouchableOpacity style={styles.callAct}>
                                <MaterialIcons name="call" size={22} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.chatAct}>
                                <MaterialIcons name="chat" size={22} color="#1E293B" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Bottom Actions */}
                    <View style={styles.footerActions}>
                        <TouchableOpacity style={styles.secondaryAct}>
                            <MaterialIcons name="receipt" size={20} color="#1E293B" />
                            <Text style={styles.secondaryActText}>Order Details</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.supportAct}>
                            <MaterialIcons name="support-agent" size={20} color="#F68B1E" />
                            <Text style={styles.supportActText}>Contact Support</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F1F3F4',
    },
    mapBackground: {
        flex: 1,
        backgroundColor: '#F1F3F4',
    },
    roadNetwork: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        opacity: 0.2,
    },
    road: {
        position: 'absolute',
        backgroundColor: '#fff',
        height: 60,
    },
    marker: {
        position: 'absolute',
        alignItems: 'center',
    },
    warehouseMarker: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#1E293B',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    homeMarker: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F68B1E',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    driverMarker: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#3E9400',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#fff',
        elevation: 6,
    },
    driverPulse: {
        position: 'absolute',
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(62, 148, 0, 0.2)',
    },
    markerLabelContainer: {
        marginTop: 4,
        backgroundColor: 'rgba(255,255,255,0.9)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    markerLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: '#1E293B',
    },
    floatingHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    trackingStatus: {
        alignItems: 'flex-end',
        gap: 6,
    },
    liveIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    redDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#EF4444',
    },
    liveText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 1,
    },
    accuracyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.95)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    greenPulse: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#3E9400',
    },
    accuracyText: {
        fontSize: 9,
        fontWeight: '800',
        color: '#3E9400',
    },
    bottomSheet: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
        paddingTop: 8,
        maxHeight: height * 0.7,
    },
    dragHandleArea: {
        width: '100%',
        paddingVertical: 12,
        alignItems: 'center',
    },
    dragIndicator: {
        width: 40,
        height: 4,
        backgroundColor: '#E2E8F0',
        borderRadius: 2,
    },
    sheetScroll: {
        paddingHorizontal: 20,
    },
    sheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    arrivingTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#0F172A',
    },
    orderMeta: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
        marginTop: 4,
    },
    itemsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 8,
    },
    itemsText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#475569',
    },
    statusBadge: {
        backgroundColor: 'rgba(62, 148, 0, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '900',
        color: '#3E9400',
    },
    addressCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        marginBottom: 24,
    },
    addressIconBg: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(246, 139, 30, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addressKey: {
        fontSize: 11,
        fontWeight: '800',
        color: '#94A3B8',
        textTransform: 'uppercase',
    },
    addressValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1E293B',
    },
    stepperSection: {
        marginBottom: 24,
    },
    stepItem: {
        flexDirection: 'row',
        gap: 16,
        minHeight: 64,
        position: 'relative',
    },
    stepLine: {
        position: 'absolute',
        left: 15.5,
        top: 32,
        bottom: -8,
        width: 2,
        backgroundColor: '#E2E8F0',
    },
    stepLineActive: {
        backgroundColor: '#3E9400',
    },
    stepCircleActive: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#fff',
        borderWidth: 3,
        borderColor: '#3E9400',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
    },
    pingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#3E9400',
    },
    stepCircleCompleted: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#3E9400',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
        opacity: 0.6,
    },
    stepCircleEmpty: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
    },
    stepContent: {
        flex: 1,
        paddingBottom: 24,
    },
    stepHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    stepTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1E293B',
    },
    newBadge: {
        backgroundColor: 'rgba(62, 148, 0, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    newBadgeText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#3E9400',
    },
    stepTimeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#94A3B8',
    },
    stepDescItalic: {
        fontSize: 14,
        color: '#475569',
        fontStyle: 'italic',
        fontWeight: '500',
        marginTop: 4,
    },
    driverCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        marginBottom: 24,
    },
    driverImg: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: '#fff',
    },
    driverInfo: {
        flex: 1,
        marginLeft: 12,
    },
    partnerText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#F68B1E',
        letterSpacing: 0.5,
    },
    driverName: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1E293B',
    },
    ratingBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    ratingVal: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1E293B',
    },
    driverActions: {
        flexDirection: 'row',
        gap: 12,
    },
    callAct: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#3E9400',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
    },
    chatAct: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    footerActions: {
        flexDirection: 'row',
        gap: 12,
    },
    secondaryAct: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#fff',
        paddingVertical: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    secondaryActText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#1E293B',
    },
    supportAct: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: 'rgba(246, 139, 30, 0.1)',
        paddingVertical: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(246, 139, 30, 0.2)',
    },
    supportActText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#F68B1E',
    },
});

export default OrderTrackingScreen;
