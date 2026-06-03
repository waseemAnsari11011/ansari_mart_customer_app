import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Platform,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

const PoliciesScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const user = useSelector(state => state.auth.user);

    const isWholesale = user?.type === 'Business';

    const policies = [
        {
            title: 'Privacy Policy',
            icon: 'privacy-tip',
            route: 'PrivacyPolicy',
        },
        // {
        //     title: 'Terms & Conditions',
        //     icon: 'description',
        //     route: 'TermsConditions',
        // },
        // {
        //     title: 'Refund Policy',
        //     icon: 'payments',
        //     route: 'RefundPolicy',
        // },
        // {
        //     title: 'Cancellation Policy',
        //     icon: 'cancel',
        //     route: 'CancellationPolicy',
        // },
        // {
        //     title: 'Shipping Policy',
        //     icon: 'local-shipping',
        //     route: 'ShippingPolicy',
        // },
        // {
        //     title: 'Return & Exchange Policy',
        //     icon: 'swap-horiz',
        //     route: 'ReturnExchangePolicy',
        // }
    ];

    return (
        <View style={styles.container}>
            <StatusBar
                barStyle="dark-content"
                backgroundColor="#F8FAFC"
            />

            {/* Header */}
            <View
                style={[
                    styles.header,
                    { paddingTop: Math.max(insets.top, 16) },
                ]}
            >
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => navigation.goBack()}
                >
                    <MaterialIcons
                        name="arrow-back-ios"
                        size={18}
                        color="#111827"
                        style={{ marginLeft: 5 }}
                    />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>Policies</Text>

                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.card}>
                    {policies.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.policyItem,
                                index !== policies.length - 1 &&
                                styles.borderBottom,
                            ]}
                            onPress={() =>
                                navigation.navigate(item.route)
                            }
                            activeOpacity={0.7}
                        >
                            <View style={styles.leftSection}>
                                <View style={styles.iconContainer}>
                                    <MaterialIcons
                                        name={item.icon}
                                        size={22}
                                        color="#449D01"
                                    />
                                </View>

                                <Text style={styles.policyTitle}>
                                    {item.title}
                                </Text>
                            </View>

                            <MaterialIcons
                                name="chevron-right"
                                size={24}
                                color="#94A3B8"
                            />
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.footerText}>
                    Please review our policies carefully before
                    using our services.
                </Text>
            </ScrollView>
        </View>
    );
};

export default PoliciesScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 16,
    },

    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',

        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: {
                    width: 0,
                    height: 4,
                },
                shadowOpacity: 0.08,
                shadowRadius: 8,
            },
            android: {
                elevation: 3,
            },
        }),
    },

    headerTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#0F172A',
    },

    scrollContent: {
        padding: 20,
    },

    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,

        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: {
                    width: 0,
                    height: 6,
                },
                shadowOpacity: 0.06,
                shadowRadius: 12,
            },
            android: {
                elevation: 4,
            },
        }),
    },

    policyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 18,
    },

    borderBottom: {
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },

    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },

    iconContainer: {
        width: 46,
        height: 46,
        borderRadius: 14,
        backgroundColor: '#F0FDF4',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },

    policyTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E293B',
        flex: 1,
    },

    footerText: {
        textAlign: 'center',
        marginTop: 24,
        color: '#94A3B8',
        fontSize: 13,
        lineHeight: 20,
        paddingHorizontal: 20,
    },
});