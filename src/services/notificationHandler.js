import messaging from '@react-native-firebase/messaging';
import { Alert } from 'react-native';
import api from '../utils/api';
import { navigate } from '../navigation/navigationRef';

export let notificationProductId = null;
export const clearNotificationProductId = () => {
    notificationProductId = null;
};

const openProduct = async (productId) => {
    if (!productId) return;

    try {
        const response = await api.get(`/products/${productId}`);

        const product =
            response.data.product || response.data;
        console.log("OPEN PRODUCT CALLED", productId);

        navigate('ProductDetails', {
            product,
            isWholesale: false,
        });
    } catch (error) {
        console.log('PRODUCT FETCH ERROR', error);
    }
};

export const setupNotificationHandlers = () => {

    // Background → Open
    const unsubscribeOpened =
        messaging().onNotificationOpenedApp(
            async remoteMessage => {
                await openProduct(
                    remoteMessage?.data?.productId
                );
            }
        );

    // Killed State
    messaging()
        .getInitialNotification()
        .then(remoteMessage => {

            console.log(
                "INITIAL NOTIFICATION",
                JSON.stringify(remoteMessage, null, 2)
            );

            if (remoteMessage?.data?.productId) {
                notificationProductId =
                    remoteMessage.data.productId;
            }
        });

    // Foreground
    const unsubscribeForeground =
        messaging().onMessage(
            async remoteMessage => {

                Alert.alert(
                    remoteMessage?.notification?.title ||
                    'Notification',

                    remoteMessage?.notification?.body || '',

                    [
                        {
                            text: 'Cancel',
                            style: 'cancel',
                        },
                        {
                            text: 'Open',
                            onPress: () =>
                                openProduct(
                                    remoteMessage?.data?.productId
                                ),
                        },
                    ]
                );
            }
        );

    return () => {
        unsubscribeOpened();
        unsubscribeForeground();
    };
};