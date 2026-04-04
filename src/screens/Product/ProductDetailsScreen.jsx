import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addToCartThunk, addBulkToCartThunk } from '../../redux/slices/cartSlice';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, Share, StatusBar } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { calculateProductPrice, getBasePrice } from '../../utils/pricing';
import api, { resolveImageUrl } from '../../utils/api';

const { width } = Dimensions.get('window');

const ProductDetailsScreen = ({ navigation, route }) => {
    const dispatch = useDispatch();
    const { cartItems } = useSelector(state => state.cart);
    const insets = useSafeAreaInsets();
    const isWholesale = route?.params?.isWholesale ?? false; 
    const product = route?.params?.product;
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [quantities, setQuantities] = useState({}); // { tierIndex: qty }
    const [isFavorite, setIsFavorite] = useState(true);

    const [relatedProducts, setRelatedProducts] = useState([]);
    const [loadingRelated, setLoadingRelated] = useState(false);

    useEffect(() => {
        const fetchRelated = async () => {
            if (!product?.category) return;
            try {
                setLoadingRelated(true);
                // The category might be an object { _id, name } or just a name depending on populated status
                const categoryParam = typeof product.category === 'object' ? product.category.name : product.category;
                const userType = isWholesale ? 'business' : 'retail';
                
                const response = await api.get(`/products?category=${encodeURIComponent(categoryParam)}&userType=${userType}`);
                
                // Filter out current product
                const filtered = response.data.filter(p => p._id !== product._id);
                setRelatedProducts(filtered.slice(0, 6)); // Show top 6
            } catch (error) {
                console.error('Error fetching related products:', error);
            } finally {
                setLoadingRelated(false);
            }
        };

        fetchRelated();
        // Reset quantities when product changes
        setQuantities({});
    }, [product?._id]);

    const handleAddToCart = async () => {
        try {
            const itemsToAdd = Object.entries(quantities)
                .filter(([_, qty]) => qty > 0)
                .map(([idx, qty]) => ({
                    productId: product._id,
                    quantity: qty,
                    isWholesale,
                    tierIndex: parseInt(idx)
                }));
            
            if (itemsToAdd.length === 0) {
                alert('Please select at least one unit quantity');
                return;
            }

            await dispatch(addBulkToCartThunk({ items: itemsToAdd })).unwrap();
            alert('Items added to cart');
        } catch (error) {
            console.error('Failed to add to cart:', error);
            alert('Failed to add items. Please try again.');
        }
    };

    const handleBuyNow = async () => {
        const itemsToAdd = Object.entries(quantities).filter(([_, qty]) => qty > 0);
        if (itemsToAdd.length === 0) {
            alert('Please select at least one unit quantity');
            return;
        }
        await handleAddToCart();
        navigation.navigate('Cart', { isWholesale });
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Check out ${product?.name || 'this product'} on AnsariMart!`,
            });
        } catch (error) {
            console.log(error);
        }
    };

    const activePricingArray = isWholesale ? product?.businessPricing : product?.retailPricing;
    const basePrice = getBasePrice(product, isWholesale);
    
    const totalAmount = activePricingArray?.reduce((sum, tier, idx) => {
        const qty = quantities[idx] || 0;
        return sum + (tier.price * qty);
    }, 0) || 0;

    return (
        <View style={[styles.container, isDarkMode && styles.darkContainer]}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />

            {/* Sticky Header */}
            <View style={[styles.header, isDarkMode && styles.darkHeader, { paddingTop: Math.max(insets.top, 16) }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBtn}>
                    <MaterialIcons name="arrow-back" size={24} color={isDarkMode ? "#fff" : "#334155"} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, isDarkMode && styles.darkText]}>Product Details</Text>
                <View style={styles.headerActions}>
                    <TouchableOpacity onPress={handleShare} style={styles.headerActionBtn}>
                        <MaterialIcons name="share" size={22} color={isDarkMode ? "#cbd5e1" : "#475569"} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setIsFavorite(!isFavorite)} style={styles.headerActionBtn}>
                        <MaterialIcons
                            name={isFavorite ? "favorite" : "favorite-border"}
                            size={22}
                            color={isFavorite ? "#ef4444" : (isDarkMode ? "#cbd5e1" : "#475569")}
                        />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: 80 + insets.bottom }]} bounces={false}>
                {/* Product Images Section */}
                <View style={[styles.imageSection, isDarkMode && styles.darkSection]}>
                    <Image
                        source={{ uri: resolveImageUrl(product?.images?.[0]) || 'https://via.placeholder.com/400' }}
                        style={styles.mainImage}
                    />
                    <View style={styles.pricingTag}>
                        <Text style={styles.pricingTagText}>{isWholesale ? 'WHOLESALE EXCLUSIVE' : 'RETAIL PRICING'}</Text>
                    </View>
                </View>

                {/* Info Section */}
                <View style={[styles.infoCard, isDarkMode && styles.darkCard]}>
                    <View style={styles.brandRow}>
                        <Text style={styles.brandText}>{product?.brand || 'ANSARI MART'}</Text>
                    </View>
                    <Text style={[styles.productTitle, isDarkMode && styles.darkText]}>
                        {product?.name}
                    </Text>



                    {/* Dynamic Pricing Tiers */}
                    {(isWholesale ? product?.businessPricing : product?.retailPricing)?.length > 0 && (
                        <View style={[styles.wholesaleCard, isDarkMode && styles.darkWholesaleCard]}>
                            <View style={styles.wholesaleHeader}>
                                <View style={styles.wholesaleTitleRow}>
                                    <MaterialIcons name="sell" size={18} color="#3E9400" />
                                    <Text style={styles.wholesaleTitle}>Bulk Savings Available</Text>
                                </View>

                            </View>

                            <View style={styles.tierTable}>
                                <View style={styles.tableHeader}>
                                    <Text style={[styles.headerCell, { flex: 1.5 }]}>Unit</Text>
                                    <Text style={[styles.headerCell, { flex: 1, textAlign: 'center' }]}>Price</Text>
                                    <Text style={[styles.headerCell, { flex: 1.2, textAlign: 'right' }]}>Quantity</Text>
                                </View>

                                {(isWholesale ? product?.businessPricing : product?.retailPricing)?.map((tier, idx) => {
                                    const qty = quantities[idx] || 0;
                                    const isActive = qty > 0;
                                    return (
                                        <View 
                                            key={idx} 
                                            style={[styles.tableRow, isActive && styles.tableRowActive, isDarkMode && styles.darkRow]}
                                        >
                                            <View style={[styles.cell, { flex: 1.5 }]}>
                                                <Text style={[styles.tierQty, isDarkMode && styles.darkText]}>
                                                    {tier.unit || (idx === 0 ? 'Loose' : `Opt ${idx + 1}`)}
                                                    {tier.label ? <Text style={styles.tierLabelSub}> ({tier.label})</Text> : null}
                                                </Text>
                                            </View>

                                            <View style={[styles.cell, { flex: 1, alignItems: 'center' }]}>
                                                <Text style={[styles.tierPrice, isDarkMode && styles.darkText, isActive && { color: '#3E9400' }]}>₹{tier.price}</Text>
                                            </View>
                                            
                                            <View style={[styles.cell, { flex: 1.2, alignItems: 'flex-end' }]}>
                                                <View style={[styles.tierQtySelector, isActive && styles.tierQtySelectorActive]}>
                                                    <TouchableOpacity 
                                                        style={styles.tierQtyBtn}
                                                        onPress={() => {
                                                            const newQty = Math.max(0, qty - 1);
                                                            setQuantities(prev => ({...prev, [idx]: newQty}));
                                                        }}
                                                    >
                                                        <MaterialIcons name="remove" size={14} color={isActive ? "#3E9400" : "#64748b"} />
                                                    </TouchableOpacity>
                                                    <Text style={[styles.tierQtyValue, isActive && { color: '#3E9400', fontWeight: 'bold' }]}>
                                                        {qty}
                                                    </Text>
                                                    <TouchableOpacity 
                                                        style={[styles.tierQtyBtn, isActive && styles.tierQtyBtnActive]}
                                                        onPress={() => {
                                                            const newQty = qty + 1;
                                                            setQuantities(prev => ({...prev, [idx]: newQty}));
                                                        }}
                                                    >
                                                        <MaterialIcons name="add" size={14} color={isActive ? "#fff" : "#64748b"} />
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    )}



                    {totalAmount > 0 && (
                        <View style={styles.selectionSummary}>
                            <Text style={styles.summaryTitle}>Selected Items:</Text>
                            <View style={styles.summaryChips}>
                                {Object.entries(quantities)
                                    .filter(([_, qty]) => qty > 0)
                                    .map(([idx, qty]) => {
                                        const tier = activePricingArray?.[parseInt(idx)];
                                        return (
                                            <View key={idx} style={styles.summaryChip}>
                                                <Text style={styles.summaryChipText}>
                                                    {qty} × {tier?.unit || 'Units'} = ₹{(qty * (tier?.price || 0)).toLocaleString()}
                                                </Text>
                                            </View>
                                        );
                                    })}
                            </View>
                        </View>
                    )}

                    <View style={styles.totalRow}>
                        <View>
                            <Text style={styles.totalLabel}>Total Amount</Text>
                            <Text style={styles.totalPrice}>₹{totalAmount.toLocaleString()}</Text>
                        </View>
                    </View>

                    <View style={[styles.divider, isDarkMode && styles.darkDivider]} />

                    <Text style={[styles.sectionHeading, isDarkMode && styles.darkText]}>Product Description</Text>
                    <Text style={[styles.descriptionText, isDarkMode && styles.darkSubtitle]}>
                        {product?.description || "No description available for this product."}
                    </Text>

                    {isWholesale && (
                        <View style={styles.specsContainer}>
                            <Text style={[styles.sectionHeading, isDarkMode && styles.darkText]}>Specifications</Text>
                            <View style={styles.specsGrid}>
                                <View style={styles.specItem}>
                                    <Text style={styles.specLabel}>HSN Code</Text>
                                    <Text style={[styles.specValue, isDarkMode && styles.darkText]}>{product?.hsnCode || 'N/A'}</Text>
                                </View>
                                <View style={styles.specItem}>
                                    <Text style={styles.specLabel}>Stock Status</Text>
                                    <Text style={[styles.specValue, { color: '#3E9400' }]}>{product?.stock > 0 ? `In Stock (${product.stock} units)` : 'Out of Stock'}</Text>
                                </View>
                                <View style={styles.specItem}>
                                    <Text style={styles.specLabel}>Min. Order Qty</Text>
                                    <Text style={[styles.specValue, isDarkMode && styles.darkText]}>{product?.minOrderQty || 1} Units</Text>
                                </View>
                                <View style={styles.specItem}>
                                    <Text style={styles.specLabel}>Lead Time</Text>
                                    <Text style={[styles.specValue, isDarkMode && styles.darkText]}>{product?.leadTime || 'Standard Delivery'}</Text>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Nutritional Facts */}
                    <View style={[styles.nutritionContainer, isDarkMode && styles.darkNutritionBg]}>
                        <Text style={[styles.nutritionTitle, isDarkMode && styles.darkText]}>NUTRITIONAL FACTS (PER 100G)</Text>
                        <View style={styles.nutritionGrid}>
                            {[
                                { label: 'CALORIES', value: '33 kcal' },
                                { label: 'SUGAR', value: '4.9g' },
                                { label: 'FIBER', value: '2g' },
                                { label: 'VIT C', value: '58mg' },
                            ].map((item, index) => (
                                <View key={index} style={[styles.nutritionItem, isDarkMode && styles.darkSection]}>
                                    <Text style={styles.nutritionLabel}>{item.label}</Text>
                                    <Text style={[styles.nutritionValue, isDarkMode && styles.darkText]}>{item.value}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Related Products */}
                    <View style={styles.relatedHeader}>
                        <Text style={[styles.sectionHeading, isDarkMode && styles.darkText]}>Related Products</Text>
                        <TouchableOpacity>
                            <Text style={styles.viewAllBtn}>View All</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.relatedScroll}>
                        {relatedProducts.length > 0 ? (
                            relatedProducts.map((item, index) => (
                                <TouchableOpacity 
                                    key={item._id || index} 
                                    style={[styles.relatedCard, isDarkMode && styles.darkRelatedCard]}
                                    onPress={() => navigation.push('ProductDetails', { product: item, isWholesale })}
                                >
                                    <Image source={{ uri: resolveImageUrl(item.images?.[0]) }} style={styles.relatedImg} />
                                    <View style={styles.relatedInfo}>
                                        <Text style={[styles.relatedName, isDarkMode && styles.darkText]} numberOfLines={1}>{item.name}</Text>
                                        <View style={styles.relatedPriceRow}>
                                            <Text style={styles.relatedPrice}>₹{getBasePrice(item, isWholesale)}</Text>
                                            <View style={styles.relatedAddBtn}>
                                                <MaterialIcons name="add" size={16} color="#3E9400" />
                                            </View>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))
                        ) : !loadingRelated ? (
                            <Text style={[styles.descriptionText, { marginLeft: 0 }]}>No similar products found.</Text>
                        ) : null}
                    </ScrollView>
                </View>
            </ScrollView>

            {/* Bottom Actions */}
            <View style={[styles.footer, isDarkMode && styles.darkHeader, { paddingBottom: Math.max(insets.bottom, 24) }]}>
                <TouchableOpacity style={[styles.outlineBtn, isDarkMode && styles.darkOutlineBtn]} onPress={handleAddToCart}>
                    <MaterialIcons name="shopping-basket" size={20} color="#3E9400" />
                    <Text style={styles.outlineBtnText}>{isWholesale ? 'Add to Bulk' : 'Add to Cart'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryBtn} onPress={handleBuyNow}>
                    <Text style={styles.primaryBtnText}>{isWholesale ? 'Order Now' : 'Buy Now'}</Text>
                    <MaterialIcons name={isWholesale ? "shopping-cart" : "arrow-forward"} size={20} color="#fff" />
                </TouchableOpacity>
            </View>


        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    darkContainer: {
        backgroundColor: '#0F172A',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        zIndex: 50,
    },
    darkHeader: {
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        borderBottomWidth: 1,
        borderBottomColor: '#1e293b',
    },
    navBtn: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '600',
        color: '#0f172a',
        marginLeft: 8,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 8,
    },
    headerActionBtn: {
        padding: 8,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    imageSection: {
        width: width,
        height: width,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        position: 'relative',
    },
    darkSection: {
        backgroundColor: '#1E293B',
    },
    mainImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
        borderRadius: 24,
    },
    pricingTag: {
        position: 'absolute',
        top: 32,
        left: 32,
        backgroundColor: '#E7F3DE',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
    },
    pricingTagText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#3E9400',
        letterSpacing: 0.5,
    },
    infoCard: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        marginTop: -32,
        paddingHorizontal: 20,
        paddingTop: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 10,
    },
    darkCard: {
        backgroundColor: '#0F172A',
    },
    brandRow: {
        marginBottom: 4,
    },
    brandText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#3E9400',
        letterSpacing: 1.5,
    },
    productTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 4,
    },
    wholesaleCard: {
        backgroundColor: '#F8FAFC',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        marginBottom: 24,
    },
    darkWholesaleCard: {
        backgroundColor: 'rgba(51, 65, 85, 0.3)',
        borderColor: '#334155',
    },
    wholesaleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    wholesaleTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    wholesaleTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#3E9400',
    },
    gstBadge: {
        backgroundColor: '#fff',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    darkGstBadge: {
        backgroundColor: '#1E293B',
        borderColor: '#334155',
    },
    gstText: {
        fontSize: 10,
        color: '#64748b',
        fontWeight: '500',
    },
    tierTable: {
        width: '110%',
        alignSelf: 'center',
        backgroundColor: '#fff',
        borderRadius: 0,
        overflow: 'hidden',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#F1F5F9',
        marginHorizontal: -16,
        marginBottom: 16,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#F8FAFC',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    headerCell: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    tableRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    tableRowActive: {
        backgroundColor: '#F0FDF4',
    },
    darkRow: {
        backgroundColor: '#1E293B',
        borderBottomColor: '#334155',
    },
    cell: {
        justifyContent: 'center',
    },
    tierQty: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    tierLabelSub: {
        fontSize: 11,
        fontWeight: '600',
        color: '#2563EB',
        marginTop: 2,
    },
    tierPrice: {
        fontSize: 15,
        fontWeight: '900',
        color: '#1e293b',
    },
    tierQtySelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F8FAFC',
        borderRadius: 8,
        width: 100,
        height: 36,
        paddingHorizontal: 2,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    tierQtySelectorActive: {
        backgroundColor: '#fff',
        borderColor: '#3E9400',
    },
    tierQtyBtn: {
        width: 30,
        height: 30,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tierQtyBtnActive: {
        backgroundColor: '#3E9400',
    },
    tierQtyValue: {
        fontSize: 14,
        color: '#1e293b',
        fontWeight: 'bold',
        minWidth: 20,
        textAlign: 'center',
    },
    selectionSummary: {
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    summaryTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    summaryChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    summaryChip: {
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        elevation: 1,
    },
    summaryChipText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1e293b',
    },
    totalRow: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        elevation: 2,
        marginBottom: 24,
    },
    totalLabel: {
        fontSize: 12,
        color: '#94a3b8',
    },
    totalPrice: {
        fontSize: 24,
        fontWeight: '900',
        color: '#3E9400',
    },
    divider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginBottom: 24,
    },
    darkDivider: {
        backgroundColor: '#1E293B',
    },
    sectionHeading: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 12,
    },
    descriptionText: {
        fontSize: 14,
        color: '#4b5563',
        lineHeight: 22,
        marginBottom: 32,
    },
    specsContainer: {
        marginBottom: 32,
    },
    specsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    specItem: {
        width: '45%',
    },
    specLabel: {
        fontSize: 12,
        color: '#94a3b8',
        marginBottom: 2,
    },
    specValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0f172a',
    },
    nutritionContainer: {
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderRadius: 20,
        marginBottom: 32,
    },
    darkNutritionBg: {
        backgroundColor: 'rgba(30, 41, 59, 0.5)',
    },
    nutritionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#0f172a',
        letterSpacing: 1,
        marginBottom: 12,
    },
    nutritionGrid: {
        flexDirection: 'row',
        gap: 8,
    },
    nutritionItem: {
        flex: 1,
        backgroundColor: '#fff',
        paddingVertical: 10,
        paddingHorizontal: 4,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        elevation: 1,
    },
    nutritionLabel: {
        fontSize: 10,
        color: '#94a3b8',
        marginBottom: 4,
    },
    nutritionValue: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    relatedHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    viewAllBtn: {
        fontSize: 14,
        fontWeight: '600',
        color: '#3E9400',
    },
    relatedScroll: {
        marginHorizontal: -20,
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    relatedCard: {
        width: 140,
        backgroundColor: '#fff',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        overflow: 'hidden',
        marginRight: 16,
    },
    darkRelatedCard: {
        backgroundColor: '#1E293B',
        borderColor: '#334155',
    },
    relatedImg: {
        width: '100%',
        height: 120,
        resizeMode: 'cover',
    },
    relatedInfo: {
        padding: 12,
    },
    relatedName: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 8,
    },
    relatedPriceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    relatedPrice: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#3E9400',
    },
    relatedAddBtn: {
        backgroundColor: 'rgba(62, 148, 0, 0.1)',
        padding: 4,
        borderRadius: 8,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        paddingHorizontal: 20,
        paddingVertical: 16,
        flexDirection: 'row',
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        zIndex: 100,
    },
    outlineBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderWidth: 2,
        borderColor: '#3E9400',
        borderRadius: 16,
        height: 56,
    },
    darkOutlineBtn: {
        backgroundColor: 'transparent',
    },
    outlineBtnText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#3E9400',
    },
    primaryBtn: {
        flex: 1.5,
        backgroundColor: '#3E9400',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderRadius: 16,
        height: 56,
        shadowColor: '#3E9400',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 8,
    },
    primaryBtnText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    darkText: {
        color: '#fff',
    },
    darkSubtitle: {
        color: '#94a3b8',
    },
});

export default ProductDetailsScreen;
