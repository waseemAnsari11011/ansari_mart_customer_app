import messaging from '@react-native-firebase/messaging';
import { Alert } from 'react-native';
import api from '../utils/api';
import { navigate } from '../navigation/navigationRef';

const openProduct = async (productId) => {
    if (!productId) return;

    try {
        const response = await api.get(`/products/${productId}`);

        const product =
            response.data.product || response.data;

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
        .then(async remoteMessage => {

            if (!remoteMessage) return;

            setTimeout(async () => {
                await openProduct(
                    remoteMessage?.data?.productId
                );
            }, 3000);
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