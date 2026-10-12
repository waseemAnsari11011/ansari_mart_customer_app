import { formatPrice } from '../utils/formatPrice';
import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const money = value => `₹${formatPrice(Number(value))}`;
const threshold = rule => Number(rule.threshold ?? rule.maxSubtotal ?? rule.minSubtotal ?? 0);
const headline = rule => rule.discountType === 'product_price'
    ? 'PRODUCT DEAL'
    : `${rule.discountType === 'percentage' ? `${rule.value}%` : money(rule.value)} OFF`;
const condition = rule => rule.discountType === 'product_price'
    ? 'On selected product options'
    : `On items total above ${money(threshold(rule))}`;

export default function CouponsOffers({ rules, isWholesale = false }) {
    const navigation = useNavigation();
    const [selected, setSelected] = useState(null);
    if (!rules.length) { return null; }
    const accent = isWholesale ? '#C46515' : '#3E9400';
    const tint = isWholesale ? '#FFF2E5' : '#E8F7E9';

    return (
        <View style={styles.section}>
            <Text style={styles.title}>Coupons & Offers</Text>
            <Text style={styles.subtitle}>Save more with automatic discounts</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cards}>
                {rules.map((rule, index) => (
                    <TouchableOpacity key={`${rule.name}-${index}`} activeOpacity={0.8}
                        style={[styles.card, { backgroundColor: tint }]}
                        accessibilityRole="button" accessibilityLabel={`${rule.name}. ${headline(rule)}. ${condition(rule)}.${rule.firstOrderOnly ? ' First order only.' : ''} ${rule.discountType === 'product_price' ? 'Shop offer products' : 'View offer details'}.`}
                        onPress={() => rule.discountType === 'product_price'
                            ? navigation.navigate('OfferProducts', { offer: rule, isWholesale })
                            : setSelected(rule)}>
                        <View style={[styles.badge, { backgroundColor: accent }]}>
                            <MaterialIcons name="local-offer" size={19} color="#fff" />
                        </View>
                        <Text style={styles.eyebrow}>{rule.discountType === 'fixed' ? 'FLAT' : 'SPECIAL OFFER'}</Text>
                        <Text style={styles.amount}>{headline(rule)}</Text>
                        <View style={styles.condition}><Text style={styles.conditionText}>{condition(rule)}</Text></View>
                        <Text style={styles.name} numberOfLines={2}>{rule.name}</Text>
                        {rule.firstOrderOnly && <Text style={[styles.firstOrder, { color: accent }]}>First order only</Text>}
                        <Text style={[styles.details, { color: accent }]}>{rule.discountType === 'product_price' ? 'Shop products ›' : 'View details ›'}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
            <Text style={styles.note}>No code needed · Best eligible offer applies at checkout</Text>
            <Modal visible={!!selected} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
                <View style={styles.backdrop}>
                    <View style={styles.dialog} accessibilityViewIsModal>
                        <View style={styles.dialogHeader}>
                            <Text style={styles.dialogTitle}>{selected?.name}</Text>
                            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Close offer details" style={styles.close} onPress={() => setSelected(null)}>
                                <MaterialIcons name="close" size={24} color="#1A1A1A" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView>
                        {selected && <>
                            <Text style={[styles.dialogAmount, { color: accent }]}>{headline(selected)}</Text>
                            <Text style={styles.terms}>{condition(selected)}.</Text>
                            {selected.discountType === 'product_price' && <Text style={styles.terms}>No minimum order value. Discounts one eligible unit per order.</Text>}
                            {selected.discountType === 'product_price' && selected.productPrices?.map((item, index) => (
                                <Text key={index} style={styles.terms}>Selected option {index + 1}: {money(item.offerPrice)}</Text>
                            ))}
                            {selected.firstOrderOnly && <Text style={styles.terms}>For your first order only. Previous orders, including cancelled orders, count.</Text>}
                            <Text style={styles.terms}>Applied automatically at checkout when eligible. Only the offer with the largest savings applies; offers cannot be combined.</Text>
                        </>}
                        </ScrollView>
                        <TouchableOpacity accessibilityRole="button" style={[styles.done, { backgroundColor: accent }]} onPress={() => setSelected(null)}>
                            <Text style={styles.doneText}>Got it</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    section: { marginTop: 8, marginBottom: 22 },
    title: { paddingHorizontal: 16, fontSize: 20, fontWeight: '800', color: '#1A1A1A' },
    subtitle: { paddingHorizontal: 16, marginTop: 4, fontSize: 12, color: '#64748B' },
    cards: { paddingHorizontal: 16, paddingTop: 22, gap: 12, paddingBottom: 8 },
    card: { width: 160, borderRadius: 18, padding: 12, paddingTop: 26, alignItems: 'center' },
    badge: { position: 'absolute', top: -14, width: 32, height: 32, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff' },
    eyebrow: { fontSize: 11, letterSpacing: 1, color: '#334155', fontWeight: '600' },
    amount: { fontSize: 20, fontWeight: '900', color: '#142519', marginTop: 4, textAlign: 'center' },
    condition: { backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 7, marginTop: 10, width: '100%' },
    conditionText: { fontSize: 12, textAlign: 'center', color: '#334155' },
    name: { fontSize: 12, lineHeight: 17, color: '#334155', textAlign: 'center', marginTop: 9 },
    firstOrder: { fontSize: 11, fontWeight: '700', marginTop: 6 },
    details: { fontSize: 12, fontWeight: '700', marginTop: 10 },
    note: { paddingHorizontal: 16, fontSize: 11, color: '#64748B', marginTop: 5 },
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 24 },
    dialog: { backgroundColor: '#fff', borderRadius: 22, padding: 20, maxHeight: '85%' },
    dialogHeader: { flexDirection: 'row', alignItems: 'center' },
    dialogTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: '#1A1A1A' },
    close: { padding: 8 },
    dialogAmount: { fontSize: 26, fontWeight: '900', marginVertical: 12 },
    terms: { fontSize: 14, lineHeight: 21, color: '#475569', marginBottom: 10 },
    done: { padding: 14, alignItems: 'center', borderRadius: 12, marginTop: 8 },
    doneText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});
