import React, { useEffect, useState, useRef } from 'react';
import VersionCheck from 'react-native-version-check';
import ForceUpdateModal from './ForceUpdateModal';
import { View, Text, StyleSheet, Animated, Image, ActivityIndicator, BackHandler, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../redux/slices/authSlice';
import { setCategories, setProducts, setBanners } from '../../redux/slices/productSlice';
import { setOrders as setReduxOrders } from '../../redux/slices/orderSlice';
import api from '../../utils/api';
import { registerFCMToken } from '../../services/notificationService';
import { notificationProductId, clearNotificationProductId } from '../../services/notificationHandler';

const SplashScreen = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const dispatch = useDispatch();

  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [storeUrl, setStoreUrl] = useState('');

  const checkForUpdate = async () => {
    try {
      const update = await VersionCheck.needUpdate();

      if (update?.isNeeded) {
        setStoreUrl(update.storeUrl);
        setShowUpdateModal(true);

        return false;
      }

      return true;
    } catch (error) {
      console.log('Version check failed:', error);
      return true;
    }
  };

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start(async () => {

      const canContinue = await checkForUpdate();

      if (!canContinue) {
        return;
      }

      try {
        const userInfoStr = await AsyncStorage.getItem('userInfo');
        const token = await AsyncStorage.getItem('userToken');
        const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;
        const userType = userInfo ? (userInfo.type === 'Business' ? 'business' : 'retail') : null;

        setTimeout(async () => {
          // Fetch Fresh Data
          try {
            const productsUrl = userType ? `/products?userType=${userType}&limit=50` : '/products?limit=50';
            const [catRes, prodRes, settingsRes] = await Promise.all([
              api.get('/categories'),
              api.get(productsUrl),
              api.get('/settings')
            ]);
            dispatch(setCategories(catRes.data));
            dispatch(setProducts(prodRes.data));

            const activeBanners = settingsRes.data?.banners?.filter(b => b.status === 'ACTIVE') || [];
            dispatch(setBanners(activeBanners));
          } catch (fetchError) {
            console.error('Error fetching initial data:', fetchError);
          }

          if (userInfo && token) {
            dispatch(setCredentials({ user: userInfo, token }));

            try {
              await registerFCMToken();
            } catch (error) {
              console.log('FCM registration failed:', error);
            }

            // Pre-fetch orders for logged-in users
            try {
              const orderRes = await api.get('/orders/myorders');
              dispatch(setReduxOrders(orderRes.data));
            } catch (orderError) {
              console.warn('Orders pre-fetch failed:', orderError);
            }

            const homeScreen =
              userInfo.type === 'Business'
                ? 'BusinessHome'
                : 'RetailHome';

            navigation.replace(homeScreen);

            if (notificationProductId) {

              setTimeout(async () => {

                try {

                  const response = await api.get(
                    `/products/${notificationProductId}`
                  );

                  const product =
                    response.data.product || response.data;

                  navigation.navigate(
                    'ProductDetails',
                    {
                      product,
                      isWholesale: false,
                    }
                  );

                  // 👇 YE ADD KARO
                  clearNotificationProductId();

                } catch (error) {
                  console.log("PRODUCT FETCH ERROR", error);
                }

              }, 500);

            }
          } else {
            navigation.replace('RoleSelection');
          }
        }, 1000); // Give user enough time to see splash
      } catch (error) {
        console.error('Error checking auto-login', error);
        navigation.replace('RoleSelection');
      }
    });
  }, [fadeAnim, navigation]);

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.logoText}>
          <Text style={styles.ansari}>Ansari</Text>
          <Text style={styles.mart}>Mart</Text>
        </View>
        <Text style={styles.subtitle}>Smart Wholesale & Retail Shopping Platform</Text>

        <ActivityIndicator
          size="large"
          color="#4a9214"
          style={styles.loader}
        />
      </Animated.View>

      <ForceUpdateModal
        visible={showUpdateModal}
        onUpdate={() => Linking.openURL(storeUrl)}
        onExit={() => BackHandler.exitApp()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 10,
  },
  logoText: {
    flexDirection: 'row',
  },
  ansari: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4a9214',
  },
  mart: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#f1811e',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    marginBottom: 30,
  },
  loader: {
    marginTop: 20,
  },
});

export default SplashScreen;
