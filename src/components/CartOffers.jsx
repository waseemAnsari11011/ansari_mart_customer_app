import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { formatPrice } from '../utils/formatPrice';
import { customerText } from '../utils/customerLabels';

export default function CartOffers({ quote, error, onRetry, navigation, isWholesale }) {
    return <View style={styles.section}>
        <View style={styles.heading}>
            <MaterialIcons name="local-offer" size={20} color="#3E9400" />
            <Text style={styles.title}>Offers for your cart</Text>
        </View>
        {!quote && <Text style={styles.terms}>{error || 'Checking your eligible offers…'}</Text>}
        {!!error && <TouchableOpacity accessibilityRole="button" onPress={onRetry}><Text style={styles.link}>Retry</Text></TouchableOpacity>}
        {quote && !quote.offers?.length && <Text style={styles.terms}>No offers are currently available for this cart.</Text>}
        {quote?.offers?.map((offer, index) => {
            const best = offer.status === 'eligible' && offer.name === quote.discountName && offer.saving === quote.discountAmount;
            return <View key={`${offer.name}-${index}`} style={[styles.card, best && styles.best]}>
                <Text style={styles.name}>{customerText(offer.name)}</Text>
                <Text style={styles.amount}>{offer.discountType === 'product_price' ? 'Product price offer' : offer.discountType === 'percentage' ? `${offer.value}% OFF` : `₹${formatPrice(offer.value)} OFF`}</Text>
                <Text style={styles.status}>{best ? `Best offer · Save ₹${formatPrice(offer.saving)}` : offer.status === 'eligible' ? `Eligible · Save ₹${formatPrice(offer.saving)}` : offer.status === 'spend_more' ? `Add ₹${formatPrice(offer.extraSpend)} more to unlock this offer` : offer.status === 'first_order_only' ? 'Not eligible: this offer is for your first order only' : 'Select an eligible pack to receive this offer'}</Text>
                {offer.discountType === 'product_price' && <>
                    <Text style={styles.terms}>One unit of one eligible product gets the discount. No minimum spend.</Text>
                    <TouchableOpacity accessibilityRole="button" onPress={() => navigation.navigate('OfferProducts', { offer, isWholesale })}><Text style={styles.link}>View offer products ›</Text></TouchableOpacity>
                </>}
                {offer.discountType !== 'product_price' && <Text style={styles.terms}>Items total must exceed ₹{formatPrice(offer.threshold)}.</Text>}
                {offer.firstOrderOnly && offer.status !== 'first_order_only' && <Text style={styles.terms}>First order only.</Text>}
            </View>;
        })}
        {!!quote?.offers?.length && <Text style={styles.terms}>No code needed. Only the offer with the largest saving applies; offers cannot be combined.</Text>}
    </View>;
}

const styles = StyleSheet.create({
    section: { marginBottom: 16 },
    heading: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    title: { fontSize: 17, fontWeight: '800', color: '#1E293B' },
    card: { backgroundColor: '#fff', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 10 },
    best: { backgroundColor: '#E8F7E9', borderColor: '#3E9400' },
    name: { fontSize: 13, fontWeight: '600', color: '#334155' },
    amount: { fontSize: 18, fontWeight: '800', color: '#255C10', marginTop: 6 },
    status: { fontSize: 13, fontWeight: '700', color: '#255C10', marginVertical: 8 },
    terms: { fontSize: 12, lineHeight: 18, color: '#64748B' },
    link: { fontSize: 13, fontWeight: '700', color: '#3E9400', paddingVertical: 8 },
});
