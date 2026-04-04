import AsyncStorage from '@react-native-async-storage/async-storage';

export const saveCartToStorage = async (cartItems) => {
    try {
        await AsyncStorage.setItem('ansari_cart', JSON.stringify(cartItems));
    } catch (error) {
        console.error('Error saving cart to storage:', error);
    }
};

export const loadCartFromStorage = async () => {
    try {
        const cartData = await AsyncStorage.getItem('ansari_cart');
        return cartData ? JSON.parse(cartData) : [];
    } catch (error) {
        console.error('Error loading cart from storage:', error);
        return [];
    }
};
