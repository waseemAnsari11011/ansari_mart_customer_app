import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import api from '../../utils/api';
import { formatPrice } from '../../utils/formatPrice';

export default function ProductOffers({ product, isWholesale }) {
    const navigation = useNavigation();
    const [offers, setOffers] = useState([]);
    useFocusEffect(useCallback(() => {
        let active = true;
        setOffers([]);
        api.get('/settings').then(({ data }) => {
            const customerType = isWholesale ? 'Business' : 'Retail';
            const tiers = product?.[isWholesale ? 'businessPricing' : 'retailPricing'] || [];
            const matching = (data.discountRules || []).filter(rule =>
                rule.active && rule.discountType === 'product_price' &&
                (rule.customerType === 'All' || rule.customerType === customerType)
            ).map(rule => ({
                rule,
                options: (rule.productPrices || []).filter(option =>
                    String(option.product?._id || option.product) === String(product?._id) &&
                    tiers[option.tierIndex] && Number(option.offerPrice) < Number(tiers[option.tierIndex].price)
                ).map(option => ({ ...option, tier: tiers[option.tierIndex] })),
            })).filter(offer => offer.options.length);
            if (active) { setOffers(matching); }
        }).catch(() => {
            // Product details remain usable if offer information cannot be loaded.
            if (active) { setOffers([]); }
        });
        return () => { active = false; };
    }, [product, isWholesale]));

    if (!offers.length) { return null; }
    return (
        <View style={styles.container}>
            <View style={styles.heading}>
                <MaterialIcons name="local-offer" color="#3E9400" size={20} />
                <Text style={styles.title}>Offers on this product</Text>
            </View>
            {offers.map(({ rule, options }, index) => (
                <TouchableOpacity key={`${rule.name}-${index}`} accessibilityRole="button"
                    accessibilityLabel={`${rule.name}. View offer products`}
                    style={styles.offer} onPress={() => navigation.navigate('OfferProducts', { offer: rule, isWholesale })}>
                    <Text style={styles.name}>{rule.name}</Text>
                    {options.map(option => (
                        <View key={option.tierIndex} style={styles.option}>
                            <Text style={styles.pack}>{option.tier.label || option.tier.unit || `Option ${option.tierIndex + 1}`}</Text>
                            <Text style={styles.price}>Offer ₹{formatPrice(option.offerPrice)} <Text style={styles.original}>₹{formatPrice(option.tier.price)}</Text></Text>
                            <Text style={styles.saving}>Save ₹{formatPrice(option.tier.price - option.offerPrice)} on one eligible unit</Text>
                            {!(option.tier.stock > 0) && <Text style={styles.stock}>Currently out of stock</Text>}
                        </View>
                    ))}
                    {rule.firstOrderOnly && <Text style={styles.firstOrder}>First order only — no previous orders, including cancelled orders.</Text>}
                    <Text style={styles.link}>View offer products ›</Text>
                </TouchableOpacity>
            ))}
            <Text style={styles.terms}>No minimum spend. One unit of one eligible product gets the offer, choosing the biggest saving. Applied automatically at checkout; a better eligible offer may apply instead. Offers cannot be combined.</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { backgroundColor: '#E8F7E9', borderRadius: 14, padding: 14, marginTop: 14, marginBottom: 16 },
    heading: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    title: { fontSize: 16, fontWeight: '800', color: '#255C10' },
    offer: { backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 10 },
    name: { fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 8 },
    option: { marginBottom: 8 },
    pack: { fontSize: 12, color: '#64748B', marginBottom: 3 },
    price: { fontSize: 18, fontWeight: '800', color: '#3E9400' },
    original: { fontSize: 12, fontWeight: '400', color: '#94A3B8', textDecorationLine: 'line-through' },
    saving: { fontSize: 12, color: '#255C10', marginTop: 3 },
    stock: { fontSize: 12, color: '#B45309', marginTop: 4 },
    firstOrder: { fontSize: 12, fontWeight: '600', color: '#255C10', marginBottom: 6 },
    link: { fontSize: 12, fontWeight: '700', color: '#3E9400' },
    terms: { fontSize: 11, lineHeight: 17, color: '#475569' },
});
