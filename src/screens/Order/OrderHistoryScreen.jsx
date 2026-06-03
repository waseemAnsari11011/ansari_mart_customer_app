import React, { useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  setOrders as setReduxOrders,
  setLoading as setReduxLoading,
} from '../../redux/slices/orderSlice';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  StatusBar,
  Platform,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import BottomTab from '../../components/BottomTab';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api, { resolveImageUrl } from '../../utils/api';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, RefreshControl } from 'react-native';

const OrderHistoryScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { orders, loading, lastFetched } = useSelector(state => state.orders);
  const insets = useSafeAreaInsets();
  const isWholesale = route?.params?.isWholesale ?? false;
  const [activeTab, setActiveTab] = useState(
    isWholesale ? 'Business' : 'Retail',
  );
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async (showLoading = true) => {
    if (showLoading) dispatch(setReduxLoading(true));
    try {
      console.log(`[API] Fetching orders from: /orders/myorders`);
      const { data } = await api.get('/orders/myorders');
      // Sort by latest first
      const sorted = data.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );
      dispatch(setReduxOrders(sorted));
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      dispatch(setReduxLoading(false));
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      // Only fetch if data is more than 5 minutes old or empty
      const fiveMinutes = 5 * 60 * 1000;
      if (
        orders.length === 0 ||
        !lastFetched ||
        Date.now() - lastFetched > fiveMinutes
      ) {
        fetchOrders();
      }
    }, [orders, lastFetched]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders(false);
  };

  const getStatusColor = status => {
    switch (status) {
      case 'Delivered':
        return { bg: '#DCFCE7', text: '#15803D' };
      case 'In Transit':
      case 'On the way':
        return { bg: '#CFFAFE', text: '#0E7490' }; // Cyan
      case 'Packing':
        return { bg: '#E0E7FF', text: '#4338CA' }; // Indigo
      case 'Pending':
        return { bg: '#FFEDD5', text: '#C2410C' }; // Orange
      case 'Cancelled':
        return { bg: '#FEE2E2', text: '#B91C1C' }; // Red
      default:
        return { bg: '#F3F4F6', text: '#4B5563' };
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Order History</Text>
          {/* Theme toggle removed */}
        </View>

        {/* Search */}
        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <MaterialIcons
              name="search"
              size={20}
              color="#9CA3AF"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Search orders..."
              placeholderTextColor="#9CA3AF"
            />
          </View>
          <TouchableOpacity style={styles.filterBtn}>
            <MaterialIcons name="tune" size={20} color="#4B5563" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 100 + insets.bottom },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3E9400']}
          />
        }
      >
        {loading ? (
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: 100,
            }}
          >
            <ActivityIndicator size="large" color="#3E9400" />
            <Text
              style={{ marginTop: 12, color: '#94A3B8', fontWeight: 'bold' }}
            >
              Loading orders...
            </Text>
          </View>
        ) : orders.length === 0 ? (
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: 100,
            }}
          >
            <MaterialIcons name="shopping-basket" size={64} color="#E2E8F0" />
            <Text
              style={{ marginTop: 12, color: '#94A3B8', fontWeight: 'bold' }}
            >
              No orders found
            </Text>
          </View>
        ) : (
          orders.map((order, index) => {
            const orderDate = new Date(order.createdAt).toLocaleDateString(
              'en-IN',
              {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              },
            );
            const orderTime = new Date(order.createdAt).toLocaleTimeString(
              'en-IN',
              {
                hour: '2-digit',
                minute: '2-digit',
              },
            );

            return (
              <TouchableOpacity
                key={order._id}
                style={styles.orderCard}
                onPress={() =>
                  navigation.navigate('OrderDetails', { orderId: order._id })
                }
              >
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.orderId}>
                      ORDER #
                      {order._id?.toString().length > 12
                        ? order._id.substring(order._id.length - 8)
                        : order._id}
                    </Text>
                    <Text style={styles.orderDate}>
                      {orderDate} • {orderTime}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(order.status).bg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(order.status).text },
                      ]}
                    >
                      {order.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.imageRow}>
                    {order.orderItems?.slice(0, 2).map((item, i) => (
                      <Image
                        key={i}
                        source={{ uri: resolveImageUrl(item.image) }}
                        style={styles.productImage}
                      />
                    ))}
                    {order.orderItems?.length > 2 && (
                      <View style={styles.moreImages}>
                        <Text style={styles.moreText}>
                          +{order.orderItems.length - 2}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.amountContainer}>
                    <Text style={styles.amountLabel}>Total Amount</Text>
                    <Text style={styles.totalAmount}>₹{order.totalPrice}</Text>
                  </View>
                </View>

                <View style={styles.footerButtons}>
                  {order.status === 'Shipped' ? (
                    <TouchableOpacity
                      style={styles.trackBtn}
                      onPress={() =>
                        navigation.navigate('OrderTracking', {
                          orderId: order._id,
                        })
                      }
                    >
                      <MaterialIcons
                        name="local-shipping"
                        size={18}
                        color="#F68B1E"
                      />
                      <Text style={styles.trackBtnText}>Track Order</Text>
                    </TouchableOpacity>
                  ) : (
                    <>
                      <TouchableOpacity
                        style={styles.detailsBtn}
                        onPress={() =>
                          navigation.navigate('OrderDetails', {
                            orderId: order._id,
                          })
                        }
                      >
                        <Text style={styles.detailsBtnText}>Details</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.reorderBtn}>
                        <Text style={styles.reorderBtnText}>Reorder</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Bottom Nav */}
      <BottomTab activeTab="Profile" isWholesale={isWholesale} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  filterBtn: {
    width: 48,
    height: 48,
    backgroundColor: '#fff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  scrollContent: {
    padding: 20,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  orderId: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  orderDate: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  imageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    marginRight: -12,
    borderWidth: 2,
    borderColor: '#fff',
  },
  moreImages: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    marginLeft: -12,
  },
  moreText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  amountContainer: {
    marginLeft: 'auto',
    alignItems: 'flex-end',
  },
  amountLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3E9400',
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  detailsBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  detailsBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4B5563',
  },
  reorderBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#3E9400',
    alignItems: 'center',
  },
  reorderBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  trackBtn: {
    flex: 1,
    backgroundColor: 'rgba(246, 139, 30, 0.1)',
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  trackBtnText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#F68B1E',
  },
});

export default OrderHistoryScreen;
