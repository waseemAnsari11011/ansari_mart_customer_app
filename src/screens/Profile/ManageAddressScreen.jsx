import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import {
  setDefaultAddressAsync,
  deleteAddressAsync,
  fetchAddresses,
} from '../../redux/slices/addressSlice';
import { useFocusEffect } from '@react-navigation/native';

const ManageAddressScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();

  const { addresses, loading } = useSelector(state => state.address);

  useFocusEffect(
    React.useCallback(() => {
      dispatch(fetchAddresses());
    }, [dispatch]),
  );

  const setAsDefault = id => {
    dispatch(setDefaultAddressAsync(id));
  };

  const handleDelete = id => {
    dispatch(deleteAddressAsync(id));
  };

  const getLabelIcon = label => {
    switch (label.toLowerCase()) {
      case 'home':
        return 'home';
      case 'business':
        return 'store';
      case 'warehouse':
        return 'warehouse';
      default:
        return 'location-on';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back-ios" size={20} color={'#111'} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Addresses</Text>
        {/* Theme toggle removed */}
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 100 + insets.bottom },
        ]}
      >
        {addresses.length === 0 && !loading && (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="location-off" size={64} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Addresses Found</Text>
            <Text style={styles.emptySub}>Add an address to see it here</Text>
          </View>
        )}

        {loading && addresses.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptySub}>Loading addresses...</Text>
          </View>
        )}

        {addresses.map(addr => (
          <View
            key={addr._id || addr.id}
            style={[styles.addressCard, addr.isDefault && styles.defaultCard]}
          >
            {addr.isDefault && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultBadgeText}>DEFAULT</Text>
              </View>
            )}

            <View style={styles.cardHeader}>
              <View style={styles.labelRow}>
                <View style={styles.iconBg}>
                  <MaterialIcons
                    name={getLabelIcon(addr.label)}
                    size={20}
                    color="#2E7D32"
                  />
                </View>
                <Text style={styles.labelText}>{addr.label}</Text>
              </View>
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() =>
                    navigation.navigate('EditAddress', { address: addr })
                  }
                >
                  <MaterialIcons name="edit" size={20} color={'#64748B'} />
                </TouchableOpacity>
                {!addr.isDefault && (
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleDelete(addr._id || addr.id)}
                  >
                    <MaterialIcons
                      name="delete-outline"
                      size={20}
                      color="#EF4444"
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.cardBody}>
              <Text style={styles.nameText}>{addr.name}</Text>
              <Text style={styles.phoneText}>{addr.phone}</Text>
              <Text style={styles.addressText}>{addr.address}</Text>
              {addr.landmark && (
                <Text style={styles.addressText}>
                  Landmark: {addr.landmark}
                </Text>
              )}
              <Text style={styles.addressText}>
                {addr.city}, {addr.state} - {addr.pincode}
              </Text>
            </View>

            {!addr.isDefault && (
              <TouchableOpacity
                style={styles.setDefaultBtn}
                onPress={() => setAsDefault(addr._id || addr.id)}
              >
                <Text style={styles.setDefaultText}>Set as Default</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>

      <View
        style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}
      >
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddAddress')}
        >
          <MaterialIcons name="add" size={24} color="#fff" />
          <Text style={styles.addBtnText}>Add New Address</Text>
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

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.8)',
    zIndex: 10,
  },

  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    flex: 1,
    marginLeft: 12,
  },

  scrollContent: {
    padding: 20,
    gap: 16,
  },
  addressCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  defaultCard: {
    borderColor: '#2E7D32',
    borderWidth: 1.5,
  },
  defaultBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: '#2E7D32',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 2,
  },
  defaultBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  labelText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    textTransform: 'capitalize',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  cardBody: {
    paddingLeft: 52,
  },
  nameText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  phoneText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
    fontWeight: '500',
  },
  addressText: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 16,
  },
  emptySub: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
  },
  setDefaultBtn: {
    marginTop: 16,
    marginLeft: 52,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignSelf: 'flex-start',
  },

  setDefaultText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#64748B',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },

  addBtn: {
    backgroundColor: '#2E7D32',
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ManageAddressScreen;
