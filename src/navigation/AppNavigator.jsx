import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCartThunk } from '../redux/slices/cartSlice';

import SplashScreen from '../screens/Common/SplashScreen';
import RoleSelectionScreen from '../screens/Auth/RoleSelectionScreen';
import CustomerLoginScreen from '../screens/Auth/CustomerLoginScreen';
import BusinessLoginScreen from '../screens/Auth/BusinessLoginScreen';
import RetailHomeScreen from '../screens/Dashboard/RetailHomeScreen';
import BusinessHomeScreen from '../screens/Dashboard/BusinessHomeScreen';
import CategoryListingScreen from '../screens/Product/CategoryListingScreen';
import ProductListingScreen from '../screens/Product/ProductListingScreen';
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

    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Splash" component={SplashScreen} />
                <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
                <Stack.Screen name="CustomerLogin" component={CustomerLoginScreen} />
                <Stack.Screen name="BusinessLogin" component={BusinessLoginScreen} />
                <Stack.Screen name="RetailHome" component={RetailHomeScreen} />
                <Stack.Screen name="BusinessHome" component={BusinessHomeScreen} />
                <Stack.Screen name="CategoryListing" component={CategoryListingScreen} />
                <Stack.Screen name="ProductListing" component={ProductListingScreen} />
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

