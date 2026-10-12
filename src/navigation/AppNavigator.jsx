// @refresh reset
// Remount the navigator on development edits to avoid stale hook state.
import React from 'react';
import { Alert, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { navigationRef } from './navigationRef';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { clearCartLocal, fetchCartThunk } from '../redux/slices/cartSlice';
import { logout } from '../redux/slices/authSlice';
import { registerSessionExpiryHandler } from '../utils/sessionExpiry';
import api from '../utils/api';

import SplashScreen from '../screens/Common/SplashScreen';
import RoleSelectionScreen from '../screens/Auth/RoleSelectionScreen';
import CustomerLoginScreen from '../screens/Auth/CustomerLoginScreen';
import BusinessLoginScreen from '../screens/Auth/BusinessLoginScreen';
import RetailHomeScreen from '../screens/Dashboard/RetailHomeScreen';
import BusinessHomeScreen from '../screens/Dashboard/BusinessHomeScreen';
import CategoryListingScreen from '../screens/Product/CategoryListingScreen';
import ProductListingScreen from '../screens/Product/ProductListingScreen';
import OfferProductsScreen from '../screens/Product/OfferProductsScreen';
import ProductDetailsScreen from '../screens/Product/ProductDetailsScreen';
import CartScreen from '../screens/Order/CartScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import BusinessKYCScreen from '../screens/Profile/BusinessKYCScreen';
import ManageAddressScreen from '../screens/Profile/ManageAddressScreen';
import AddAddressScreen from '../screens/Profile/AddAddressScreen';
import EditAddressScreen from '../screens/Profile/EditAddressScreen';
import HelpSupportScreen from '../screens/Common/HelpSupportScreen';
import OrderHistoryScreen from '../screens/Order/OrderHistoryScreen';
import OrderDetailsScreen from '../screens/Order/OrderDetailsScreen';
import OrderTrackingScreen from '../screens/Order/OrderTrackingScreen';
import CheckoutScreen from '../screens/Order/CheckoutScreen';
import OrderSuccessScreen from '../screens/Order/OrderSuccessScreen';
import EditProfileScreen from '../screens/Profile/EditProfileScreen';
import PoliciesScreen from '../screens/Policy/PoliciesScreen';
import PrivacyPolicyScreen from '../screens/Policy/PrivacyPolicyScreen';
// import TermsConditionsScreen from '../screens/Policy/TermsConditionsScreen';
// import RefundPolicyScreen from '../screens/Policy/RefundPolicyScreen';
// import CancellationPolicyScreen from '../screens/Policy/CancellationPolicyScreen';
// import ShippingPolicyScreen from '../screens/Policy/ShippingPolicyScreen';
// import ReturnExchangePolicyScreen from '../screens/Policy/ReturnExchangePolicyScreen';
// import BusinessPolicyScreen from '../screens/Policy/BusinessPolicyScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
    const dispatch = useDispatch();

    const { token } = useSelector(state => state.auth);

    React.useEffect(() => {
        // Only fetch cart from backend if user is logged in
        if (token) {
            dispatch(fetchCartThunk());
        }
    }, [dispatch, token]);

    React.useEffect(() => {
        return registerSessionExpiryHandler((releaseNotice, details) => {
            const loginType = ['Retail', 'Business'].includes(details?.loginType) ? details.loginType : null;
            Alert.alert(
                details?.code === 'ACCOUNT_CHANGED' ? 'Account Changed' : 'Session Expired',
                loginType
                    ? `Your account has changed. Please log in again as a ${loginType} customer.`
                    : 'Your login session is no longer valid. Please log in again to continue.',
                [
                    {
                        text: 'Log In Again',
                        onPress: async () => {
                            try {
                                await AsyncStorage.multiRemove(['userToken', 'userInfo']);
                                dispatch(clearCartLocal());
                                dispatch(logout());

                                if (navigationRef.isReady()) {
                                    navigationRef.resetRoot({
                                        index: 0,
                                        routes: [{ name: loginType === 'Business' ? 'BusinessLogin' : loginType === 'Retail' ? 'CustomerLogin' : 'RoleSelection' }],
                                    });
                                }
                            } finally {
                                releaseNotice();
                            }
                        },
                    },
                ],
                { cancelable: false },
            );
        });
    }, [dispatch]);

    React.useEffect(() => {
        if (!token) { return; }
        let checking = false;
        const checkSession = async () => {
            if (checking || AppState.currentState !== 'active') { return; }
            checking = true;
            try {
                await api.get('/users/profile');
            } catch {
                // The API interceptor shows the session-change notice on 401.
            } finally {
                checking = false;
            }
        };
        checkSession();
        const interval = setInterval(checkSession, 30000);
        const subscription = AppState.addEventListener('change', state => {
            if (state === 'active') { checkSession(); }
        });
        return () => {
            clearInterval(interval);
            subscription.remove();
        };
    }, [token]);

    return (
        <NavigationContainer ref={navigationRef}>
            <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Splash" component={SplashScreen} />
                <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
                <Stack.Screen name="CustomerLogin" component={CustomerLoginScreen} />
                <Stack.Screen name="BusinessLogin" component={BusinessLoginScreen} />
                <Stack.Screen name="RetailHome" component={RetailHomeScreen} />
                <Stack.Screen name="BusinessHome" component={BusinessHomeScreen} />
                <Stack.Screen name="CategoryListing" component={CategoryListingScreen} />
                <Stack.Screen name="ProductListing" component={ProductListingScreen} />
                <Stack.Screen name="OfferProducts" component={OfferProductsScreen} />
                <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
                <Stack.Screen name="Cart" component={CartScreen} />
                <Stack.Screen name="Profile" component={ProfileScreen} />
                <Stack.Screen name="BusinessKYC" component={BusinessKYCScreen} />
                <Stack.Screen name="ManageAddress" component={ManageAddressScreen} />
                <Stack.Screen name="AddAddress" component={AddAddressScreen} />
                <Stack.Screen name="EditAddress" component={EditAddressScreen} />
                <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
                <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
                <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
                <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
                <Stack.Screen name="Checkout" component={CheckoutScreen} />
                <Stack.Screen name="OrderSuccess" component={OrderSuccessScreen} />
                <Stack.Screen name="EditProfile" component={EditProfileScreen} />
                <Stack.Screen name="Policies" component={PoliciesScreen} />
                <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
                {/* <Stack.Screen name="TermsConditions" component={TermsConditionsScreen} />
                <Stack.Screen name="RefundPolicy" component={RefundPolicyScreen} />
                <Stack.Screen name="CancellationPolicy" component={CancellationPolicyScreen} />
                <Stack.Screen name="ShippingPolicy" component={ShippingPolicyScreen} />
                <Stack.Screen name="ReturnExchangePolicy" component={ReturnExchangePolicyScreen} />
                <Stack.Screen name="BusinessPolicy" component={BusinessPolicyScreen} /> */}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
