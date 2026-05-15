import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, StatusBar, Linking, ActivityIndicator } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../utils/api';

const HelpSupportScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [expandedFaq, setExpandedFaq] = useState(null);
    const [supportData, setSupportData] = useState({
        mobile: '',
        email: ''
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSupport = async () => {
            try {
                const { data } = await api.get('/help-support');
                if (data) {
                    setSupportData({
                        mobile: data.mobile || '',
                        email: data.email || ''
                    });
                }
            } catch (error) {
                console.error('Error fetching support data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSupport();
    }, []);

    const faqs = [];

    return (
        <View style={[styles.container, isDarkMode && styles.darkContainer]}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />
            
            <View style={[styles.header, isDarkMode && styles.darkHeader, { paddingTop: Math.max(insets.top, 16) }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back-ios" size={20} color={isDarkMode ? "#fff" : "#111"} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, isDarkMode && styles.darkText]}>Help & Support</Text>
                {/* Theme toggle removed */}
            </View>

            <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 + insets.bottom }]} showsVerticalScrollIndicator={false}>
                {loading ? (
                    <View style={{ py: 40, alignItems: 'center' }}>
                        <ActivityIndicator size="large" color="#2E7D32" />
                        <Text style={{ marginTop: 12, color: '#64748B', fontWeight: '600' }}>Loading contact details...</Text>
                    </View>
                ) : (
                    <View style={styles.contactCards}>
                        <TouchableOpacity 
                            style={[styles.contactCard, isDarkMode && styles.darkCard]} 
                            onPress={() => Linking.openURL(`tel:${supportData.mobile}`)}
                        >
                            <View style={[styles.iconBox, { backgroundColor: 'rgba(46, 125, 50, 0.1)' }]}>
                                <MaterialIcons name="phone-in-talk" size={24} color="#2E7D32" />
                            </View>
                            <View style={styles.cardInfo}>
                                <Text style={[styles.cardTitle, isDarkMode && styles.darkText]}>Call Us</Text>
                                <Text style={styles.cardSub}>{supportData.mobile}</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.contactCard, isDarkMode && styles.darkCard]} 
                            onPress={() => Linking.openURL(`mailto:${supportData.email}`)}
                        >
                            <View style={[styles.iconBox, { backgroundColor: 'rgba(37, 99, 235, 0.1)' }]}>
                                <MaterialIcons name="mail-outline" size={24} color="#2563EB" />
                            </View>
                            <View style={styles.cardInfo}>
                                <Text style={[styles.cardTitle, isDarkMode && styles.darkText]}>Email Support</Text>
                                <Text style={styles.cardSub}>{supportData.email}</Text>
                            </View>
                        </TouchableOpacity>

                    </View>
                )}

                {faqs.length > 0 && (
                    <>
                        <View style={[styles.divider, isDarkMode && styles.darkDivider]} />
                        <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>Frequently Asked Questions</Text>
                        <View style={styles.faqList}>
                    {faqs.map((faq) => (
                        <TouchableOpacity
                            key={faq.id}
                            style={[styles.faqItem, isDarkMode && styles.darkFaqItem]}
                            onPress={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.faqHeader}>
                                <Text style={[styles.faqQ, isDarkMode && styles.darkText]}>{faq.q}</Text>
                                <MaterialIcons 
                                    name={expandedFaq === faq.id ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                                    size={24} 
                                    color={isDarkMode ? "#94A3B8" : "#64748B"} 
                                />
                            </View>
                            {expandedFaq === faq.id && (
                                <Text style={[styles.faqA, isDarkMode && styles.darkSubText]}>{faq.a}</Text>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            </>
        )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    darkContainer: { backgroundColor: '#0F172A' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', zIndex: 10 },
    darkHeader: { backgroundColor: '#1E293B', borderBottomColor: '#334155' },
    backButton: { padding: 8, marginLeft: -8 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0F172A', flex: 1, marginLeft: 12 },
    darkModeButton: { padding: 8, backgroundColor: '#F1F5F9', borderRadius: 8 },
    darkButtonBg: { backgroundColor: '#334155' },
    darkText: { color: '#F8FAFC' },
    darkSubText: { color: '#94A3B8' },
    scrollContent: { padding: 20 },
    contactCards: { gap: 16 },
    contactCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
    darkCard: { backgroundColor: '#1E293B', borderColor: '#334155' },
    iconBox: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    cardInfo: { flex: 1 },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', marginBottom: 4 },
    cardSub: { fontSize: 14, color: '#64748B' },
    divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 32 },
    darkDivider: { backgroundColor: '#334155' },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginBottom: 16 },
    faqList: { gap: 12 },
    faqItem: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
    darkFaqItem: { backgroundColor: '#1E293B', borderColor: '#334155' },
    faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    faqQ: { fontSize: 15, fontWeight: 'bold', color: '#1E293B', flex: 1, paddingRight: 16 },
    faqA: { fontSize: 14, color: '#64748B', lineHeight: 22, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
});

export default HelpSupportScreen;
