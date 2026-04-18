import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, TextInput, Dimensions, StatusBar, ActivityIndicator, RefreshControl } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { setCategories, setProducts, setBanners } from '../../redux/slices/productSlice';
import { addToCartThunk } from '../../redux/slices/cartSlice';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import BottomTab from '../../components/BottomTab';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

import api, { resolveImageUrl } from '../../utils/api';
import { getBasePrice } from '../../utils/pricing';

const RetailHomeScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { categories, products, banners = [], pagination } = useSelector(state => state.products);
    const { addresses } = useSelector(state => state.address);
    const { cartItems } = useSelector(state => state.cart);
    const [activeBanner, setActiveBanner] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const scrollRef = useRef(null);
    const dispatch = useDispatch();

    const fetchWithRetry = async (fn, retries = 3) => {
        for (let i = 0; i < retries; i++) {
            try {
                return await fn();
            } catch (err) {
                if (i === retries - 1) throw err;
                await new Promise(r => setTimeout(r, 1000 * (i + 1))); // exponential backoff
            }
        }
    };

    const fetchData = async (page = 1) => {
        if (page === 1) {
            try {
                // Load categories and settings independently on initial load
                const [catRes, settingsRes] = await Promise.all([
                    fetchWithRetry(() => api.get('/categories')),
                    fetchWithRetry(() => api.get('/settings')),
                ]);
                dispatch(setCategories(catRes.data));
                const activeBanners = settingsRes.data?.banners?.filter(b => b.status === 'ACTIVE') || [];
                dispatch(setBanners(activeBanners));
            } catch (error) {
                console.error('Error loading static home data:', error);
            }
        }

        try {
            const prodRes = await fetchWithRetry(() => api.get(`/products?userType=retail&page=${page}&limit=20`));
            dispatch(setProducts(prodRes.data));
        } catch (error) {
            console.error('Error loading products:', error);
        }
    };

    const loadMore = async () => {
        if (loadingMore || !pagination.hasMore) return;
        setLoadingMore(true);
        await fetchData(pagination.page + 1);
        setLoadingMore(false);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchData(1);
        setRefreshing(false);
    };

    const handleAddToCart = async (item) => {
        try {
            await dispatch(addToCartThunk({ product: item, quantity: 1, isWholesale: false })).unwrap();
        } catch (err) {
            console.error('Failed to add to cart:', err);
            alert('Failed to add item to cart. Please check your connection.');
        }
    };

    const combinedData = useMemo(() => {
        const data = [];
        if (banners.length > 0) data.push({ type: 'BANNERS', id: 'banners' });
        if (categories.length > 0) data.push({ type: 'CATEGORIES', id: 'categories' });
        
        if (products.length === 0 && !loadingMore) {
            data.push({ type: 'LOADING', id: 'loading' });
        } else {
            // Group products by category (Showing only first 4 per category)
            categories.forEach(cat => {
                const categoryProducts = products.filter(p => 
                    p.category === cat.name || 
                    p.category === cat._id || 
                    p.category?._id === cat._id || 
                    p.category?.name === cat.name
                );
                if (categoryProducts.length > 0) {
                    data.push({ 
                        type: 'SECTION_HEADER', 
                        id: `header-${cat._id}`, 
                        title: cat.name, 
                        categoryName: cat.name 
                    });
                    
                    const displayProducts = categoryProducts.slice(0, 4);
                    for (let i = 0; i < displayProducts.length; i += 2) {
                        data.push({ 
                            type: 'PRODUCT_ROW', 
                            id: `row-${cat._id}-${i}`, 
                            items: displayProducts.slice(i, i + 2) 
                        });
                    }
                }
            });

            // Handle products with no category
            const catIds = categories.map(c => c._id);
            const otherProducts = products.filter(p => {
                const pCat = p.category?._id || p.category;
                return !catIds.includes(pCat);
            });
            if (otherProducts.length > 0) {
                data.push({ type: 'SECTION_HEADER', id: 'header-others', title: 'Others' });
                for (let i = 0; i < otherProducts.length; i += 2) {
                    data.push({ 
                        type: 'PRODUCT_ROW', 
                        id: `row-others-${i}`, 
                        items: otherProducts.slice(i, i + 2) 
                    });
                }
            }

            // All Products Section (Showing All with Infinite Scroll)
            data.push({ type: 'SECTION_HEADER', id: 'header-all', title: 'All Products' });
            for (let i = 0; i < products.length; i += 2) {
                data.push({ 
                    type: 'PRODUCT_ROW', 
                    id: `row-all-${i}`, 
                    items: products.slice(i, i + 2) 
                });
            }
        }
        return data;
    }, [banners, categories, products, loadingMore]);

    const renderItem = useCallback(({ item }) => {
        switch (item.type) {
            case 'BANNERS':
                return (
                    <View style={styles.bannerWrapper}>
                        <FlatList
                            ref={scrollRef}
                            data={banners}
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(b, idx) => b._id || idx.toString()}
                            onScroll={(e) => {
                                const x = e.nativeEvent.contentOffset.x;
                                const index = Math.round(x / (width - 32));
                                if (index !== activeBanner) setActiveBanner(index);
                            }}
                            scrollEventThrottle={16}
                            renderItem={({ item: banner }) => (
                                <TouchableOpacity activeOpacity={0.9} style={{ width: width - 32, paddingRight: 4 }}>
                                    <Image source={banner.localImage ? banner.localImage : { uri: resolveImageUrl(banner.image) }} style={styles.bannerImg} resizeMode="cover" />
                                </TouchableOpacity>
                            )}
                            getItemLayout={(data, index) => ({
                                length: width - 32,
                                offset: (width - 32) * index,
                                index,
                            })}
                        />
                        <View style={styles.bannerIndicators}>
                            {banners.map((_, index) => (
                                <View key={index} style={[styles.indicator, activeBanner === index && styles.activeIndicator]} />
                            ))}
                        </View>
                    </View>
                );
            case 'CATEGORIES':
                return (
                    <>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Shop by Category</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('CategoryListing', { isWholesale: false })}>
                                <Text style={styles.viewAll}>View All</Text>
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.categoryList}
                            data={categories}
                            keyExtractor={(c, idx) => c._id || idx.toString()}
                            renderItem={({ item: cat }) => (
                                <TouchableOpacity style={styles.categoryItem} onPress={() => navigation.navigate('ProductListing', { categoryName: cat.name, isWholesale: false })}>
                                    <View style={[styles.categoryIcon, { backgroundColor: '#F0FDF4' }]}>
                                        {cat.image ? (
                                            <Image source={{ uri: resolveImageUrl(cat.image) }} style={styles.catImage} />
                                        ) : (
                                            <MaterialIcons name="category" size={28} color="#16A34A" />
                                        )}
                                    </View>
                                    <Text style={styles.categoryLabel}>{cat.name}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </>
                );
            case 'SECTION_HEADER':
                return (
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>{item.title}</Text>
                        <TouchableOpacity 
                            onPress={() => navigation.navigate('ProductListing', { 
                                categoryName: item.categoryName || 'All Products', 
                                isWholesale: false 
                            })}
                        >
                            <Text style={styles.viewAll}>View All</Text>
                        </TouchableOpacity>
                    </View>
                );
            case 'LOADING':
                return (
                    <View style={styles.centerBox}>
                        <ActivityIndicator size="large" color="#3e9400" />
                        <Text style={styles.loadingText}>Fetching products...</Text>
                    </View>
                );
            case 'PRODUCT_ROW':
                return (
                    <View style={styles.productRow}>
                        {item.items.map((product) => (
                            <TouchableOpacity 
                                key={product._id} 
                                style={styles.productCard} 
                                onPress={() => navigation.navigate('ProductDetails', { product, isWholesale: false })}
                            >
                                <View style={styles.productImgContainer}>
                                    <Image source={{ uri: resolveImageUrl(product.images?.[0]) || 'https://via.placeholder.com/150' }} style={styles.productImg} />
                                    <TouchableOpacity style={styles.favBtn}>
                                        <MaterialIcons name="favorite-border" size={16} color="#94A3B8" />
                                    </TouchableOpacity>
                                    {!!product.isHot && <View style={[styles.productBadge, { backgroundColor: '#F68B1E' }]}><Text style={styles.badgeText}>HOT</Text></View>}
                                    {!!product.isCombo && <View style={[styles.productBadge, { backgroundColor: '#3B82F6' }]}><Text style={styles.badgeText}>COMBO</Text></View>}
                                </View>
                                <View style={styles.productInfo}>
                                    <Text style={styles.productBrand}>{product.brand || 'ANSARI MART'}</Text>
                                    <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                                    <Text style={styles.productWeight}>
                                        {product.weight || (product.retailPricing && product.retailPricing.length > 0 ? `1 ${product.retailPricing[0].unit}` : '')}
                                    </Text>
                                    <View style={styles.productFooter}>
                                        <View>
                                            <Text style={styles.productPrice}>₹{getBasePrice(product, false)}</Text>
                                            {!!product.oldPrice && <Text style={styles.productOldPrice}>₹{product.oldPrice}</Text>}
                                        </View>
                                        <TouchableOpacity 
                                            style={styles.addBtn}
                                            onPress={() => handleAddToCart(product)}
                                        >
                                            <MaterialIcons name="add" size={20} color="#fff" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                );
            default:
                return null;
        }
    }, [banners, categories, activeBanner, width, navigation, handleAddToCart]);

    useEffect(() => {
        if (!banners || banners.length === 0) return;
        const interval = setInterval(() => {
            const nextIndex = (activeBanner + 1) % banners.length;
            scrollRef.current?.scrollToOffset({ offset: nextIndex * (width - 32), animated: true });
            setActiveBanner(nextIndex);
        }, 3000);
        return () => clearInterval(interval);
    }, [activeBanner, banners]);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" translucent />

            <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
                <View style={styles.headerTop}>
                    <View style={styles.logoRow}>
                        <Image source={require('../../assets/images/logo.png')} style={styles.logoImg} />
                        <View style={styles.logoText}>
                            <Text style={styles.ansari}>Ansari</Text>
                            <Text style={styles.mart}>Mart</Text>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.locationPicker} onPress={() => navigation.navigate('ManageAddress')}>
                        <View style={styles.locationLabelRow}>
                            <MaterialIcons name="location-on" size={14} color="#3e9400" />
                            <Text style={styles.deliverToText}>Deliver to</Text>
                        </View>
                        <View style={styles.locationValueRow}>
                            <Text style={styles.locationText} numberOfLines={1}>
                                {addresses.find(a => a.isDefault)?.city || 'Select Location'}, 
                                {addresses.find(a => a.isDefault)?.pincode || ''}
                            </Text>
                            <MaterialIcons name="keyboard-arrow-down" size={20} color="#3e9400" />
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={styles.searchBar}>
                    <MaterialIcons name="search" size={22} color="#94A3B8" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search groceries, staples and more..."
                        placeholderTextColor="#94A3B8"
                    />
                </View>
            </View>

            <FlatList
                data={combinedData}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                initialNumToRender={6}
                maxToRenderPerBatch={10}
                windowSize={5}
                removeClippedSubviews={true}
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={() => loadingMore ? (
                    <View style={{ paddingVertical: 20 }}>
                        <ActivityIndicator size="small" color="#3e9400" />
                    </View>
                ) : null}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3e9400']} />
                }
            />

            <BottomTab activeTab="Home" isWholesale={false} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F7F8F5' },
    scrollContent: { paddingBottom: 100 },
    header: { backgroundColor: '#fff', paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    logoImg: { width: 32, height: 32, borderRadius: 8 },
    logoText: { flexDirection: 'row' },
    ansari: { fontSize: 20, fontWeight: '900', color: '#4a9214' },
    mart: { fontSize: 20, fontWeight: '900', color: '#f1811e' },
    locationPicker: { alignItems: 'flex-end' },
    locationLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
    deliverToText: { fontSize: 10, fontWeight: '800', color: '#64748B', textTransform: 'uppercase' },
    locationValueRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#F1F5F9' },
    locationText: { fontSize: 13, fontWeight: '800', color: '#1A1A1A' },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 16, height: 48 },
    searchInput: { flex: 1, marginLeft: 12, fontSize: 15, color: '#1A1A1A', fontWeight: '500' },
    bannerWrapper: { margin: 16, borderRadius: 12, overflow: 'hidden', position: 'relative' },
    bannerImg: { width: '100%', height: (width - 32) * 0.5, borderRadius: 12 },
    bannerIndicators: { position: 'absolute', bottom: 12, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
    indicator: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
    activeIndicator: { width: 16, backgroundColor: '#fff' },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginTop: 8, marginBottom: 16 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A1A' },
    viewAll: { fontSize: 14, color: '#3e9400', fontWeight: '700' },
    categoryList: { paddingLeft: 16, paddingRight: 8, marginBottom: 16 },
    categoryItem: { alignItems: 'center', marginRight: 24, width: 64 },
    categoryIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 8, overflow: 'hidden' },
    catImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    categoryLabel: { fontSize: 11, fontWeight: '600', color: '#1A1A1A', textAlign: 'center' },
    retailTag: { backgroundColor: 'rgba(62, 148, 0, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    retailTagText: { color: '#3e9400', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
    productGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12 },
    productRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, marginBottom: 4 },
    productCard: { width: '48%', backgroundColor: '#fff', borderRadius: 10, padding: 6, borderWidth: 1, borderColor: '#F1F5F9', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
    productImgContainer: { width: '100%', aspectRatio: 1.1, borderRadius: 8, backgroundColor: '#F8FAFC', overflow: 'hidden', marginBottom: 6 },
    productImg: { width: '100%', height: '100%', resizeMode: 'cover' },
    favBtn: { position: 'absolute', top: 5, right: 5, backgroundColor: 'rgba(255,255,255,0.8)', width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
    productBadge: { position: 'absolute', top: 5, left: 5, paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3 },
    badgeText: { color: '#fff', fontSize: 9, fontWeight: '900' },
    productInfo: { flex: 1 },
    productBrand: { fontSize: 8, fontWeight: '800', color: '#94A3B8', marginBottom: 1, letterSpacing: 0.5 },
    productName: { fontSize: 11, fontWeight: '800', color: '#1A1A1A', marginBottom: 1, height: 32 },
    productWeight: { fontSize: 9, color: '#64748B', marginBottom: 4 },
    productFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 2 },
    productPrice: { fontSize: 13, fontWeight: '900', color: '#1A1A1A' },
    productOldPrice: { fontSize: 9, color: '#94A3B8', textDecorationLine: 'line-through' },
    addBtn: { backgroundColor: '#3e9400', width: 26, height: 26, borderRadius: 6, justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#3e9400', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
    centerBox: { width: '100%', height: 200, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, fontSize: 14, color: '#64748B', fontWeight: '600' },
});

export default RetailHomeScreen;
