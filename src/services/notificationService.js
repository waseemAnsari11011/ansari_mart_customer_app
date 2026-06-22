import messaging from '@react-native-firebase/messaging';
import api from '../utils/api';

export const registerFCMToken = async () => {
    try {
        await messaging().requestPermission();

        const fcmToken = await messaging().getToken();

        console.log("2. FCM Token:", fcmToken);

        await api.post('/users/save-fcm-token', {
            fcmToken,
        });


    } catch (error) {
        console.log(
            "FCM ERROR:",
            error.response?.data || error.message
        );
    }
};