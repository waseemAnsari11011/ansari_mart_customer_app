import { formatPrice } from '../../utils/formatPrice';
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import api, { resolveImageUrl } from '../../utils/api';
import { addToCartThunk } from '../../redux/slices/cartSlice';

export default function OfferProductsScreen({ route, navigation }) {
    const { offer, isWholesale = false } = route.params;
    const insets = useSafeAreaInsets();
    const dispatch = useDispatch();
    const cartItems = useSelector(state => state.cart.cartItems);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [adding, setAdding] = useState(null);
    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const ids = [...new Set((offer.productPrices || []).map(item => String(item.product?._id || item.product)))];
            const results = await Promise.all(ids.map(async id => {
                try {
                    const response = await api.get(`/products/${id}`);
                    return response.data.product || response.data;
                } catch (failure) {
                    if (failure.response?.status === 404) { return null; }
                    throw failure;
                }
            }));
            const available = results.filter(product => product && product[isWholesale ? 'businessStatus' : 'retailStatus'] === 'Active');
            setProducts((offer.productPrices || []).flatMap(selected => {
                const product = available.find(item => item._id === String(selected.product?._id || selected.product));
                const tier = product?.[isWholesale ? 'businessPricing' : 'retailPricing']?.[selected.tierIndex];
                return tier && Number(selected.offerPrice) < Number(tier.price)
                    ? [{ product, tier, tierIndex: selected.tierIndex, offerPrice: selected.offerPrice }]
                    : [];
            }));
        } catch {
            setError('Could not load offer products. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [offer, isWholesale]);
    useEffect(() => { load(); }, [load]);

    const add = async item => {
        const key = `${item.product._id}-${item.tierIndex}`;
        setAdding(key);
        try {
            await dispatch(addToCartThunk({ product: item.product, quantity: 1, tierIndex: item.tierIndex, isWholesale })).unwrap();
        } catch (failure) {
            Alert.alert('Could not add product', failure?.message || 'Please try again.');
        } finally {
            setAdding(null);
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <View style={styles.header}>
                <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back" onPress={() => navigation.goBack()} style={styles.back}>
                    <MaterialIcons name="arrow-back" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.title}>{offer.name}</Text>
            </View>
            <View style={styles.info}>
                <Text style={styles.infoTitle}>Special prices on selected products</Text>
                <Text style={styles.terms}>No minimum spend. One unit of one eligible product receives the offer, choosing the biggest saving. Best eligible offer applies at checkout.</Text>
                {offer.firstOrderOnly && <Text style={styles.firstOrder}>First order only (including no previous cancelled orders).</Text>}
            </View>
            {loading ? <ActivityIndicator style={styles.loading} size="large" color="#3E9400" /> : error ? (
                <View style={styles.empty}>
                    <Text style={styles.terms}>{error}</Text>
                    <TouchableOpacity accessibilityRole="button" onPress={load}><Text style={styles.retry}>Retry</Text></TouchableOpacity>
                </View>
            ) : <FlatList data={products} keyExtractor={item => `${item.product._id}-${item.tierIndex}`} contentContainerStyle={styles.list}
                ListEmptyComponent={<Text style={styles.terms}>No products are currently available for this offer.</Text>}
                renderItem={({ item }) => {
                    const key = `${item.product._id}-${item.tierIndex}`;
                    const qty = cartItems.filter(cartItem => (cartItem.product?._id || cartItem.product) === item.product._id && (cartItem.tierIndex || 0) === item.tierIndex && Boolean(cartItem.isWholesale) === isWholesale).reduce((sum, cartItem) => sum + cartItem.quantity, 0);
                    const outOfStock = qty >= (item.tier.stock || 0);
                    return <View style={styles.card}>
                        <TouchableOpacity accessibilityRole="button" onPress={() => navigation.navigate('ProductDetails', { product: item.product, isWholesale })}>
                            <Image source={{ uri: resolveImageUrl(item.product.images?.[0]) }} style={styles.image} />
                        </TouchableOpacity>
                        <View style={styles.productInfo}>
                            <Text style={styles.productName}>{item.product.name}</Text>
                            <Text style={styles.terms}>{item.tier.label || item.tier.unit || `Option ${item.tierIndex + 1}`}</Text>
                            <Text style={styles.price}>₹{formatPrice(item.offerPrice)} <Text style={styles.oldPrice}>₹{formatPrice(item.tier.price)}</Text></Text>
                            <Text style={styles.caption}>Offer price for one eligible unit</Text>
                            <TouchableOpacity accessibilityRole="button" disabled={adding !== null || outOfStock} style={[styles.add, (outOfStock || adding !== null) && styles.disabled]} onPress={() => add(item)}>
                                <Text style={styles.buttonText}>{adding === key ? 'Adding…' : outOfStock ? 'Unavailable' : qty ? `Add more · ${qty} in cart` : 'Add to cart'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>;
                }} />}
            <TouchableOpacity accessibilityRole="button" style={styles.cart} onPress={() => navigation.navigate('Cart', { isWholesale })}>
                <Text style={styles.buttonText}>View cart & checkout</Text>
                <MaterialIcons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F7F8F5' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff' },
    back: { padding: 8, marginRight: 8 },
    title: { flex: 1, fontSize: 18, fontWeight: '800', color: '#1A1A1A' },
    info: { backgroundColor: '#E8F7E9', padding: 16 },
    infoTitle: { fontSize: 16, fontWeight: '700', color: '#255C10', marginBottom: 6 },
    terms: { fontSize: 12, lineHeight: 18, color: '#64748B' },
    firstOrder: { fontSize: 12, color: '#255C10', fontWeight: '700', marginTop: 8 },
    loading: { flex: 1 },
    empty: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
    retry: { color: '#3E9400', fontWeight: '700', padding: 16 },
    list: { padding: 16, flexGrow: 1 },
    card: { flexDirection: 'row', backgroundColor: '#fff', padding: 12, borderRadius: 16, marginBottom: 12 },
    image: { width: 100, height: 110, borderRadius: 12, resizeMode: 'contain' },
    productInfo: { flex: 1, paddingLeft: 12 },
    productName: { fontSize: 15, fontWeight: '700', color: '#1A1A1A', marginBottom: 4 },
    price: { fontSize: 20, fontWeight: '800', color: '#3E9400', marginTop: 6 },
    oldPrice: { fontSize: 13, color: '#94A3B8', textDecorationLine: 'line-through' },
    caption: { fontSize: 10, color: '#64748B', marginTop: 4 },
    add: { backgroundColor: '#3E9400', borderRadius: 8, padding: 10, alignItems: 'center', marginTop: 10 },
    disabled: { opacity: 0.5 },
    buttonText: { color: '#fff', fontWeight: '700', fontSize: 13 },
    cart: { margin: 16, backgroundColor: '#3E9400', padding: 16, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
