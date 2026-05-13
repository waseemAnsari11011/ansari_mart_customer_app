import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setCategories as setReduxCategories } from '../../redux/slices/productSlice';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Image, TextInput, StatusBar, Dimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomTab from '../../components/BottomTab';

const { width } = Dimensions.get('window');
const COLS = 4;
const CARD_GAP = 8;
const SIDE_PAD = 12;
const CARD_SIZE = (width - SIDE_PAD * 2 - CARD_GAP * (COLS - 1)) / COLS;

import api, { resolveImageUrl } from '../../utils/api';

const CategoryListingScreen = ({ navigation, route }) => {
    const dispatch = useDispatch();
    const reduxCategories = useSelector(state => state.products.categories);
    const insets = useSafeAreaInsets();
    const user = useSelector(state => state.auth.user);
    const isWholesale = route?.params?.isWholesale ?? (user?.type === 'Business');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(reduxCategories.length === 0);

    useEffect(() => {
        if (reduxCategories.length === 0) {
            fetchCategories();
        }
    }, [reduxCategories]);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await api.get('/categories');
            dispatch(setReduxCategories(response.data));
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const filtered = reduxCategories.filter(c =>
        c.name.toLowerCase().replace('\n', ' ').includes(search.toLowerCase())
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

            {/* Header */}
            <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Icon name="arrow-back-ios" size={20} color="#1A1A1A" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>All Categories</Text>
                    <View style={{ width: 40 }} />
                </View>

                <View style={styles.searchBar}>
                    <Icon name="search" size={20} color="#94A3B8" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search for categories..."
                        placeholderTextColor="#94A3B8"
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
            </View>

            {/* 4-column category grid */}
            <ScrollView
                contentContainerStyle={[
                    styles.grid,
                    { paddingBottom: 100 + insets.bottom }
                ]}
                showsVerticalScrollIndicator={false}
            >
                {filtered.map((cat, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.card}
                        activeOpacity={0.85}
                        onPress={() => navigation.navigate('ProductListing', { isWholesale, categoryName: cat.name })}
                    >
                        <View style={styles.imgBox}>
                            <Image source={{ uri: resolveImageUrl(cat.image) }} style={styles.img} />
                        </View>
                        <Text style={styles.cardLabel}>{cat.name}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
            <BottomTab activeTab="Categories" isWholesale={isWholesale} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1A1A1A',
        flex: 1,
        textAlign: 'center',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 48,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 15,
        color: '#1A1A1A',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: SIDE_PAD,
        paddingTop: 16,
        gap: CARD_GAP,
    },
    card: {
        width: CARD_SIZE,
        alignItems: 'center',
    },
    imgBox: {
        width: CARD_SIZE,
        height: CARD_SIZE,
        borderRadius: 12,
        backgroundColor: '#E8F5F9',
        overflow: 'hidden',
        marginBottom: 8,
    },
    img: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    cardLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#1A1A1A',
        textAlign: 'center',
        lineHeight: 14,
    },
});

export default CategoryListingScreen;
