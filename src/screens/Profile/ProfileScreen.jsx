import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, StatusBar, Platform, Alert } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import BottomTab from '../../components/BottomTab';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { resolveImageUrl } from '../../utils/api';
import { useDispatch, useSelector } from 'react-redux';
import { logout, updateUser } from '../../redux/slices/authSlice';

const { width } = Dimensions.get('window');

const ProfileScreen = ({ navigation, route }) => {
    const insets = useSafeAreaInsets();
    const dispatch = useDispatch();
    const user = useSelector(state => state.auth.user);
    const isWholesale = user?.type === 'Business';
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Fetch latest profile when screen is focused
    useFocusEffect(
        useCallback(() => {
            const fetchProfile = async () => {
                try {
                    const response = await api.get('/users/profile');
                    if (response.data) {
                        dispatch(updateUser(response.data));
                    }
                } catch (error) {
                    console.error('Error fetching profile in ProfileScreen:', error);
                }
            };
            fetchProfile();
        }, [])
    );

    const handleLogout = async () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to logout?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Logout", 
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await AsyncStorage.removeItem('userToken');
                            await AsyncStorage.removeItem('userInfo');
                            dispatch(logout());
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'RoleSelection' }],
                            });
                        } catch (error) {
                            console.error('Logout error:', error);
                        }
                    }
                }
            ]
        );
    };

    const sections = [
        {
            title: 'Shopping',
            items: [
                { title: 'My Orders', icon: 'inventory', color: '#3B82F6', bg: '#EFF6FF', route: 'OrderHistory' },
                { title: 'Wishlist', icon: 'favorite', color: '#F43F5E', bg: '#FFF1F2', route: '#' },
                { title: 'Saved Addresses', icon: 'location-on', color: '#F59E0B', bg: '#FFFBEB', route: 'ManageAddress' },
            ]
        },
        ...(isWholesale ? [{
            title: 'Business',
            items: [
                {
                    title: 'Business KYC',
                    icon: 'business-center',
                    color: '#10B981',
                    bg: '#ECFDF5',
                    route: 'BusinessKYC',
                    badge: user?.businessDetails?.verificationStatus || 'Pending'
                },
            ]
        }] : []),
        {
            title: 'Support',
            items: [
                { title: 'Help & Support', icon: 'contact-support', color: '#0D9488', bg: '#F0FDFA', route: 'HelpSupport' },
            ]
        }
    ];

    return (
        <View style={[styles.container, isDarkMode && styles.darkContainer]}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={isDarkMode ? "#0F172A" : "#f8f9fa"} />

            {/* Header */}
            <View style={[styles.header, isDarkMode && styles.darkHeader, { paddingTop: Math.max(insets.top, 16) }]}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity
                        style={[styles.headerBtn, isDarkMode && styles.darkBtn]}
                        onPress={() => navigation.goBack()}
                    >
                        <MaterialIcons name="arrow-back-ios" size={18} color={isDarkMode ? "#F1F5F9" : "#111"} style={{ marginLeft: 6 }} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, isDarkMode && styles.darkText]}>Business Profile</Text>
                </View>
                {/* Theme toggle removed */}
            </View>

            <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: 80 + insets.bottom }]} showsVerticalScrollIndicator={false}>
                {/* Profile Card */}
                <TouchableOpacity 
                    style={[styles.profileCard, isDarkMode && styles.darkCard]}
                    onPress={() => navigation.navigate('EditProfile')}
                    activeOpacity={0.7}
                >
                    <View style={styles.avatarWrapper}>
                        <View style={[styles.avatarContainer, isDarkMode && styles.darkAvatar]}>
                            <Image
                                source={{ uri: resolveImageUrl(user?.profilePhoto) || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=2E7D32&color=fff&size=120` }}
                                style={styles.avatar}
                            />
                        </View>
                        <TouchableOpacity
                            style={styles.cameraBtn}
                            onPress={() => { }}
                        >
                            <MaterialIcons name="camera-alt" size={16} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.userNameRow}>
                        <Text style={[styles.userName, isDarkMode && styles.darkText]}>
                            {user?.name || (isWholesale ? 'Business User' : 'Customer')}
                        </Text>
                    </View>

                    <View style={styles.contactInfo}>
                        <View style={styles.infoRow}>
                            <MaterialIcons name="call" size={16} color="#94A3B8" />
                            <Text style={styles.infoText}>{user?.phone || 'No phone number'}</Text>
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Sections */}
                {sections.map((section, sIndex) => (
                    <View key={sIndex} style={styles.section}>
                        <Text style={styles.sectionLabel}>{section.title}</Text>
                        <View style={[styles.menuList, isDarkMode && styles.darkCard]}>
                            {section.items.map((item, iIndex) => (
                                <TouchableOpacity
                                    key={iIndex}
                                    style={[
                                        styles.menuItem,
                                        iIndex !== section.items.length - 1 && styles.menuItemBorder,
                                        isDarkMode && styles.darkBorder
                                    ]}
                                    onPress={() => item.route !== '#' && navigation.navigate(item.route)}
                                >
                                    <View style={[styles.iconBox, { backgroundColor: isDarkMode ? `${item.color}20` : item.bg }]}>
                                        <MaterialIcons name={item.icon || 'star'} size={22} color={item.color} />
                                    </View>
                                    <View style={styles.menuContent}>
                                        <Text style={[styles.menuTitle, isDarkMode && styles.darkText]}>{item.title}</Text>
                                        {item.badge && (
                                            <View style={[
                                                styles.badge,
                                                item.badge === 'Approved' && styles.successBadge,
                                                item.badge === 'Rejected' && styles.errorBadge
                                            ]}>
                                                <Text style={[
                                                    styles.badgeText,
                                                    item.badge === 'Approved' && styles.successBadgeText,
                                                    item.badge === 'Rejected' && styles.errorBadgeText
                                                ]}>{item.badge}</Text>
                                            </View>
                                        )}
                                    </View>
                                    <MaterialIcons name="chevron-right" size={20} color="#CBD5E1" />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                ))}

                {/* Logout */}
                <View style={styles.footerActions}>
                    <TouchableOpacity
                        style={[styles.logoutBtn, isDarkMode && styles.darkLogoutBtn]}
                        onPress={handleLogout}
                    >
                        <MaterialIcons name="logout" size={20} color="#F43F5E" />
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>
                    <Text style={styles.versionText}>Version 2.4.1</Text>
                </View>
            </ScrollView>

            {/* Bottom Nav */}
            <BottomTab activeTab="Profile" isWholesale={isWholesale} isDarkMode={isDarkMode} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    darkContainer: {
        backgroundColor: '#0F172A',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 16,
        backgroundColor: 'rgba(248, 249, 250, 0.8)',
    },
    darkHeader: {
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerBtn: {
        width: 40,
        height: 40,
        backgroundColor: '#fff',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.05,
                shadowRadius: 10,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    darkBtn: {
        backgroundColor: '#1E293B',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#0F172A',
    },
    darkText: {
        color: '#F1F5F9',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    profileCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        marginBottom: 24,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.04,
                shadowRadius: 20,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    darkCard: {
        backgroundColor: '#1E293B',
        borderWidth: 1,
        borderColor: 'rgba(51, 65, 85, 0.5)',
    },
    avatarWrapper: {
        position: 'relative',
        marginBottom: 16,
    },
    avatarContainer: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: '#F1F5F9',
        padding: 4,
    },
    darkAvatar: {
        backgroundColor: '#334155',
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 44,
    },
    cameraBtn: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        backgroundColor: '#449d01',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#f8f9fa',
    },
    userNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0F172A',
    },
    editBtn: {
        padding: 6,
        borderRadius: 12,
    },
    darkEdit: {
        backgroundColor: 'rgba(51, 65, 85, 0.5)',
    },
    contactInfo: {
        gap: 8,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    infoText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#64748B',
    },
    section: {
        marginBottom: 24,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    menuList: {
        backgroundColor: '#fff',
        borderRadius: 20,
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.04,
                shadowRadius: 20,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 16,
    },
    menuItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#F8FAFC',
    },
    darkBorder: {
        borderBottomColor: 'rgba(51, 65, 85, 0.4)',
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuContent: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    menuTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E293B',
    },
    badge: {
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#B45309',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    successBadge: {
        backgroundColor: '#DCFCE7',
        borderColor: '#BBF7D0',
    },
    successBadgeText: {
        color: '#15803D',
    },
    errorBadge: {
        backgroundColor: '#FEE2E2',
        borderColor: '#FECACA',
    },
    errorBadgeText: {
        color: '#B91C1C',
    },
    footerActions: {
        paddingTop: 12,
        alignItems: 'center',
    },
    logoutBtn: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 16,
        borderRadius: 16,
        gap: 8,
        borderWidth: 1,
        borderColor: '#FFE4E6',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.04,
                shadowRadius: 20,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    darkLogoutBtn: {
        backgroundColor: '#1E293B',
        borderColor: 'rgba(244, 63, 94, 0.2)',
    },
    logoutText: {
        color: '#F43F5E',
        fontWeight: 'bold',
        fontSize: 16,
    },
    versionText: {
        marginTop: 24,
        fontSize: 12,
        fontWeight: '600',
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
});

export default ProfileScreen;
