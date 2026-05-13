import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addToCartThunk } from '../../redux/slices/cartSlice';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, TextInput, StatusBar, ActivityIndicator, FlatList } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import ProductQuickView from '../../components/Product/ProductQuickView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api, { resolveImageUrl } from '../../utils/api';
import { getBasePrice } from '../../utils/pricing';

const { width } = Dimensions.get('window');

const ProductListingScreen = ({ navigation, route }) => {
    const dispatch = useDispatch();
    const { cartItems } = useSelector(state => state.cart);
    const insets = useSafeAreaInsets();
    const user = useSelector(state => state.auth.user);
    const isWholesaleRoute = route?.params?.isWholesale ?? (user?.type === 'Business');
    const [isDarkMode, setIsDarkMode] = useState(false);
    const categoryName = route?.params?.categoryName || 'All Products';
    
    // Pagination State
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [quickViewVisible, setQuickViewVisible] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    const fetchProducts = async (pageNumber = 1) => {
        try {
            let url = `/products?userType=${isWholesaleRoute ? 'business' : 'retail'}`;
            if (categoryName && categoryName !== 'All Products') {
                url += `&category=${encodeURIComponent(categoryName)}`;
            }
            url += `&page=${pageNumber}&limit=20`;

            const response = await api.get(url);
            const { products: fetchedProducts, pages } = response.data;

            if (pageNumber === 1) {
                setProducts(fetchedProducts);
            } else {
                setProducts(prev => [...prev, ...fetchedProducts]);
            }
            
            setPage(pageNumber);
            setHasMore(pageNumber < pages);
        } catch (error) {
            console.error("Error fetching products: ", error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchProducts(1);
    }, [categoryName]);

    const handleLoadMore = () => {
        if (!loadingMore && hasMore) {
            setLoadingMore(true);
            fetchProducts(page + 1);
        }
    };

    const renderProduct = ({ item, index }) => {
        const quantityInCart = cartItems
            .filter(c => (c.product?._id || c.product) === item._id)
            .reduce((sum, c) => sum + (c.quantity || 0), 0);
        
        return (
        <TouchableOpacity
            key={item._id || index}
            style={[styles.productCard, isDarkMode && styles.darkCard]}
            onPress={() => navigation.navigate('ProductDetails', { 
                product: item, 
                isWholesale: isWholesaleRoute 
            })}
        >
            <View style={[styles.productImgContainer, isDarkMode && styles.darkImgBg]}>
                <Image source={{ uri: resolveImageUrl(item.images && item.images.length > 0 ? item.images[0] : 'https://via.placeholder.com/150') }} style={styles.productImg} />
                <TouchableOpacity style={styles.favBtn}>
                    <MaterialIcons name="favorite-border" size={16} color="#94A3B8" />
                </TouchableOpacity>
            </View>

            <View style={styles.productInfo}>
                <Text style={styles.productBrand}>{item.brand || 'ANSARI MART'}</Text>
                <Text style={[styles.productName, isDarkMode && styles.darkText]} numberOfLines={1}>{item.name}</Text>
                <View style={styles.mrpTag}>
                    <Text style={styles.mrpText}>MRP: ₹{item.mrp || '0'}</Text>
                </View>

                <View style={styles.productFooter}>
                    <View>
                        <Text style={[styles.productPrice, isDarkMode && styles.darkText]}>
                            ₹{getBasePrice(item, isWholesaleRoute)}
                            {(() => {
                                const pricingArr = isWholesaleRoute ? item.businessPricing : item.retailPricing;
                                const unitToDisplay = pricingArr && pricingArr.length > 0 ? pricingArr[0].unit : null;
                                return unitToDisplay ? <Text style={styles.unitText}> / {unitToDisplay}</Text> : null;
                            })()}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={styles.addBtn}
                        onPress={() => {
                            setSelectedProduct(item);
                            setQuickViewVisible(true);
                        }}
                    >
                        <MaterialIcons name="add" size={20} color="#fff" />
                        {quantityInCart > 0 && (
                            <View style={styles.qtyBadge}>
                                <Text style={styles.qtyBadgeText}>{quantityInCart}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
};

    return (
        <View style={[styles.container, isDarkMode && styles.darkContainer]}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />
            
            <View style={[styles.header, isDarkMode && styles.darkHeader, { paddingTop: Math.max(insets.top, 16) }]}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <MaterialIcons name="arrow-back-ios" size={20} color={isDarkMode ? "#fff" : "#111"} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, isDarkMode && styles.darkText]} numberOfLines={1}>{categoryName}</Text>
                    <View style={{ width: 40 }} />
                </View>

                <View style={styles.searchBar}>
                    <MaterialIcons name="search" size={20} color="#94A3B8" />
                    <TextInput
                        style={[styles.searchInput, isDarkMode && styles.darkText]}
                        placeholder={`Search in ${categoryName}...`}
                        placeholderTextColor="#94A3B8"
                    />
                    <TouchableOpacity style={styles.filterBtn}>
                        <MaterialIcons name="tune" size={20} color="#2E7D32" />
                    </TouchableOpacity>
                </View>

                <View style={{ height: 40 }}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subCatScroll}>
                        {['All', 'Premium', 'Organic', 'Combo Offers', 'Value Packs'].map((tag, idx) => (
                            <TouchableOpacity key={idx} style={[styles.subCatBtn, idx === 0 && styles.subCatBtnActive, isDarkMode && idx !== 0 && styles.darkSubCat]}>
                                <Text style={[styles.subCatText, idx === 0 && styles.subCatTextActive, isDarkMode && idx !== 0 && styles.darkText]}>{tag}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </View>

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#2E7D32" />
                </View>
            ) : (
                <FlatList
                    data={products}
                    renderItem={renderProduct}
                    keyExtractor={(item) => item._id}
                    numColumns={2}
                    columnWrapperStyle={styles.productRow}
                    contentContainerStyle={styles.scrollContent}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    ListEmptyComponent={
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 }}>
                            <Text style={[isDarkMode && styles.darkText, { fontSize: 16, color: '#64748B' }]}>No products found.</Text>
                        </View>
                    }
                    ListFooterComponent={
                        loadingMore ? (
                            <View style={{ paddingVertical: 20 }}>
                                <ActivityIndicator size="small" color="#2E7D32" />
                            </View>
                        ) : <View style={{ height: 20 }} />
                    }
                />
            )}

            <ProductQuickView 
                isVisible={quickViewVisible} 
                onClose={() => setQuickViewVisible(false)} 
                product={selectedProduct} 
                isWholesale={isWholesaleRoute} 
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    darkContainer: { backgroundColor: '#0F172A' },
    header: { backgroundColor: '#fff', paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', zIndex: 10 },
    darkHeader: { backgroundColor: '#1E293B', borderBottomColor: '#334155' },
    headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    backButton: { padding: 8, marginLeft: -8 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#0F172A', flex: 1, marginLeft: 12 },
    darkText: { color: '#F8FAFC' },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 12, paddingHorizontal: 12, height: 44, marginBottom: 16 },
    searchInput: { flex: 1, paddingHorizontal: 8, fontSize: 14, color: '#0F172A' },
    filterBtn: { padding: 4 },
    subCatScroll: { paddingBottom: 4, gap: 8 },
    subCatBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#fff' },
    subCatBtnActive: { backgroundColor: 'rgba(46, 125, 50, 0.1)', borderColor: '#2E7D32' },
    subCatText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
    subCatTextActive: { color: '#2E7D32' },
    darkSubCat: { backgroundColor: '#1E293B', borderColor: '#334155' },
    scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
    productRow: { justifyContent: 'space-between', paddingHorizontal: 0 },
    productGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    productCard: { width: '48%', backgroundColor: '#fff', borderRadius: 16, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#F1F5F9', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
    darkCard: { backgroundColor: '#1E293B', borderColor: '#334155' },
    productImgContainer: { width: '100%', aspectRatio: 1, borderRadius: 12, backgroundColor: '#F8FAFC', marginBottom: 12, position: 'relative', overflow: 'hidden' },
    darkImgBg: { backgroundColor: '#0F172A' },
    productImg: { width: '100%', height: '100%', resizeMode: 'cover' },
    favBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(255,255,255,0.9)', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    badge: { position: 'absolute', top: 8, left: 8, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    badgeText: { color: '#fff', fontSize: 9, fontWeight: '900' },
    productInfo: { flex: 1 },
    productBrand: { fontSize: 10, fontWeight: 'bold', color: '#94A3B8', marginBottom: 4, letterSpacing: 0.5 },
    productName: { fontSize: 14, fontWeight: 'bold', color: '#1E293B', marginBottom: 4 },
    mrpTag: { backgroundColor: '#F1F5F9', alignSelf: 'flex-start', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3, marginBottom: 8 },
    mrpText: { fontSize: 11, color: '#000000', fontWeight: '900' },
    productFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' },
    productPrice: { fontSize: 16, fontWeight: '900', color: '#000000' },
    unitText: { fontSize: 10, fontWeight: '600', color: '#64748B' },
    productOldPrice: { fontSize: 12, color: '#94A3B8', textDecorationLine: 'line-through', marginTop: 2 },
    addBtn: { backgroundColor: '#2E7D32', width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', position: 'relative' },
    qtyBadge: { position: 'absolute', top: -10, right: -10, backgroundColor: '#EF4444', minWidth: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#fff' },
    qtyBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
});

export default ProductListingScreen;
