import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

// Automatic BASE_URL detection for development
// For production, use your server URL

let baseURL = 'http://13.201.92.4';

if (__DEV__) {
    const isEmulator = DeviceInfo.isEmulatorSync();
    baseURL = (Platform.OS === 'android' && isEmulator)
        ? 'http://10.0.2.2:8000'
        : 'http://192.168.137.1:8000';
    console.log(`[API] Connection Mode: ${isEmulator ? 'Emulator' : 'Physical Device'}`);
    console.log(`[API] Base URL: ${baseURL}`);
}

const api = axios.create({
    baseURL: `${baseURL}/api`,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const resolveImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) {
        // Fix for old 'localhost' URLs if any still exist in cache
        if (__DEV__ && imagePath.includes('localhost')) {
            return imagePath.replace('localhost', baseURL.split('//')[1].split(':')[0]);
        }
        return imagePath;
    }
    if (imagePath.startsWith('data:image')) return imagePath;

    // Remove leading slash if present to avoid double slashes
    const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
    return `${baseURL}/${cleanPath}`;
};

export { baseURL };

api.interceptors.request.use(
    async (config) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (token && !config.headers.Authorization) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error('Error attaching token', error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
