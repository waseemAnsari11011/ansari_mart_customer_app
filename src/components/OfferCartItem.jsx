import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { resolveImageUrl } from '../utils/api';
import { formatPrice } from '../utils/formatPrice';

export default function OfferCartItem({ item, tier, offer, onQuantityChange, onRemove }) {
    const regularQuantity = Math.max(0, item.quantity - 1);
    const regularPrice = Math.round(tier.price);
    const row = (quantity, price, discounted) => (
        <View style={[styles.row, discounted && styles.offerRow]}>
            <Image source={{ uri: resolveImageUrl(item.product.images?.[0]) }} style={styles.image} />
            <View style={styles.details}>
                <Text style={styles.name}>{item.product.name}</Text>
                <Text style={styles.pack}>{tier.label || tier.unit || 'Standard'}</Text>
                <Text style={discounted ? styles.offerLabel : styles.regularLabel}>{discounted ? 'OFFER · 1 UNIT ONLY' : 'ADDITIONAL UNITS · REGULAR PRICE'}</Text>
                <Text style={styles.rate}>{quantity} × ₹{formatPrice(price)}{discounted && <Text style={styles.oldPrice}>  ₹{formatPrice(regularPrice)}</Text>}</Text>
                <Text style={styles.price}>₹{formatPrice(quantity * price)}</Text>
            </View>
        </View>
    );
    return <View style={styles.card}>
        {row(1, offer.offerPrice, true)}
        {regularQuantity > 0 && <View style={styles.attached}>{row(regularQuantity, regularPrice, false)}</View>}
        <View style={styles.footer}>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Remove ${item.product.name}`} onPress={onRemove} style={styles.remove}>
                <MaterialIcons name="delete-outline" size={20} color="#64748B" />
            </TouchableOpacity>
            <Text style={styles.quantityLabel}>Total quantity</Text>
            <View style={styles.controls}>
                <TouchableOpacity accessibilityRole="button" accessibilityLabel="Decrease quantity" onPress={() => onQuantityChange(item.quantity - 1)} style={styles.control}>
                    <MaterialIcons name="remove" size={18} color="#3E920C" />
                </TouchableOpacity>
                <Text style={styles.quantity}>{item.quantity}</Text>
                <TouchableOpacity accessibilityRole="button" accessibilityLabel="Increase quantity" disabled={item.quantity >= (tier.stock || 0)} onPress={() => onQuantityChange(item.quantity + 1)} style={[styles.control, item.quantity >= (tier.stock || 0) && styles.disabled]}>
                    <MaterialIcons name="add" size={18} color="#3E920C" />
                </TouchableOpacity>
            </View>
        </View>
        <Text style={styles.note}>Only one unit gets the offer price. Extra units are charged at the regular price.</Text>
    </View>;
}

const styles = StyleSheet.create({
    card: { borderRadius: 16, borderWidth: 1, borderColor: '#C9E8BE', backgroundColor: '#fff', overflow: 'hidden' },
    row: { flexDirection: 'row', gap: 12, padding: 12 },
    offerRow: { backgroundColor: '#EFF9E9' },
    image: { width: 68, height: 76, borderRadius: 10, resizeMode: 'cover', backgroundColor: '#F8FAFC' },
    details: { flex: 1 },
    name: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
    pack: { fontSize: 12, color: '#64748B', marginTop: 3 },
    offerLabel: { fontSize: 10, fontWeight: '800', color: '#3E920C', marginTop: 7 },
    regularLabel: { fontSize: 10, fontWeight: '700', color: '#64748B', marginTop: 7 },
    rate: { fontSize: 13, color: '#334155', marginTop: 5 },
    oldPrice: { fontSize: 12, color: '#94A3B8', textDecorationLine: 'line-through' },
    price: { fontSize: 17, fontWeight: '800', color: '#255C10', marginTop: 4 },
    attached: { borderTopWidth: 1, borderTopColor: '#C9E8BE', borderStyle: 'dashed' },
    footer: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingTop: 8 },
    remove: { padding: 8 },
    quantityLabel: { flex: 1, fontSize: 12, color: '#64748B' },
    controls: { flexDirection: 'row', alignItems: 'center', borderRadius: 8, backgroundColor: '#F8FAFC' },
    control: { padding: 10 },
    quantity: { minWidth: 24, textAlign: 'center', fontSize: 14, fontWeight: '700', color: '#1E293B' },
    disabled: { opacity: 0.35 },
    note: { fontSize: 11, lineHeight: 16, color: '#64748B', paddingHorizontal: 12, paddingVertical: 10 },
});
