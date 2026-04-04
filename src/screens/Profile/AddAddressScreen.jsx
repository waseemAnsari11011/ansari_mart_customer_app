import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Dimensions, StatusBar, Alert, ActivityIndicator, Platform, PermissionsAndroid } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { addAddressAsync } from '../../redux/slices/addressSlice';
import { reverseGeocode } from '../../utils/location';
import Geolocation from 'react-native-geolocation-service';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

const { width } = Dimensions.get('window');

const AddAddressScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const dispatch = useDispatch();
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [selectedLabel, setSelectedLabel] = useState('home');
    const [loadingLocation, setLoadingLocation] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    // Form State
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        pincode: '',
        state: '',
        city: '',
        houseNo: '',
        roadName: '',
        landmark: '',
        latitude: null,
        longitude: null
    });

    const handleSave = async () => {
        if (!formData.name || !formData.phone || !formData.pincode || !formData.city) {
            Alert.alert('Error', 'Please fill all required fields');
            return;
        }

        setIsSaving(true);
        try {
            const newAddress = {
                label: selectedLabel.charAt(0).toUpperCase() + selectedLabel.slice(1),
                name: formData.name,
                phone: '+91 ' + formData.phone,
                address: `${formData.houseNo}, ${formData.roadName}`,
                city: formData.city,
                state: formData.state,
                pincode: formData.pincode,
                landmark: formData.landmark || '',
                latitude: formData.latitude,
                longitude: formData.longitude,
                isDefault: false
            };

            await dispatch(addAddressAsync(newAddress)).unwrap();
            navigation.goBack();
        } catch (error) {
            Alert.alert('Error', error || 'Failed to save address');
        } finally {
            setIsSaving(false);
        }
    };

    const [locationStatus, setLocationStatus] = useState('');

    const fetchLocation = async () => {
        setLoadingLocation(true);
        setLocationStatus('Fetching location...');

        try {
            if (Platform.OS === 'android') {
                const granted = await PermissionsAndroid.requestMultiple([
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
                ]);
                
                const isGranted = 
                    granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED ||
                    granted[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;

                if (!isGranted) {
                    setLoadingLocation(false);
                    setLocationStatus('');
                    Alert.alert('Permission Denied', 'Location permission is required.');
                    return;
                }
            }

            Geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    console.log('Location Found:', latitude, longitude);
                    setLocationStatus('Converting address...');
                    try {
                        const addressDetails = await reverseGeocode(latitude, longitude);
                        if (addressDetails) {
                            setFormData({
                                ...formData,
                                pincode: addressDetails.pincode || '',
                                city: addressDetails.city || '',
                                state: addressDetails.state || 'Maharashtra',
                                roadName: addressDetails.roadName || addressDetails.formattedAddress || '',
                                houseNo: addressDetails.houseNo || '',
                                landmark: addressDetails.landmark || '',
                                latitude: latitude,
                                longitude: longitude
                            });
                            Alert.alert('Success', 'Location fetched successfully!');
                        }
                    } catch (err) {
                        console.error('Geocoding error:', err);
                        Alert.alert('Error', 'Unable to convert coordinates to address');
                    } finally {
                        setLoadingLocation(false);
                        setLocationStatus('');
                    }
                },
                (error) => {
                    console.warn('Scan timeout, trying cache...', error);
                    // Standard Sevabazar fallback for "Instant" feel
                    Geolocation.getCurrentPosition(
                        async (pos) => {
                            const { latitude, longitude } = pos.coords;
                            setLocationStatus('Converting address...');
                            const addressDetails = await reverseGeocode(latitude, longitude);
                            if (addressDetails) {
                            setFormData({
                                ...formData,
                                pincode: addressDetails.pincode || '',
                                city: addressDetails.city || '',
                                state: addressDetails.state || 'Maharashtra',
                                roadName: addressDetails.roadName || addressDetails.formattedAddress || '',
                                houseNo: addressDetails.houseNo || '',
                                landmark: addressDetails.landmark || '',
                                latitude: latitude,
                                longitude: longitude
                            });
                            }
                            setLoadingLocation(false);
                            setLocationStatus('');
                        },
                        (err2) => {
                            setLoadingLocation(false);
                            setLocationStatus('');
                            Alert.alert('Error', 'Unable to fetch location. Please ensure location is enabled.');
                        },
                        { enableHighAccuracy: false, timeout: 5000, maximumAge: 1000 * 60 * 60 * 24 } // 24-hour cache
                    );
                },
                { enableHighAccuracy: false, timeout: 5000, maximumAge: 0, forceRequestLocation: true, showLocationDialog: true }
            );
        } catch (err) {
            console.error('Fetch error:', err);
            setLoadingLocation(false);
            setLocationStatus('');
        }
    };

    return (
        <View style={[styles.container, isDarkMode && styles.darkContainer]}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />
            {/* Header */}
            <View style={[styles.header, isDarkMode && styles.darkHeader, { paddingTop: Math.max(insets.top, 16) }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back-ios" size={20} color={isDarkMode ? "#fff" : "#111"} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, isDarkMode && styles.darkText]}>Add New Address</Text>
                {/* Theme toggle removed */}
            </View>

            <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: 150 + insets.bottom }]}>
                {/* Use Current Location Button */}
                <TouchableOpacity 
                    style={[styles.locationBtn, isDarkMode && styles.darkCard, loadingLocation && { opacity: 0.7 }]} 
                    onPress={fetchLocation}
                    disabled={loadingLocation}
                >
                    {loadingLocation ? (
                        <ActivityIndicator size="small" color="#2E7D32" />
                    ) : (
                        <MaterialIcons name="my-location" size={20} color="#2E7D32" />
                    )}
                    <Text style={styles.locationBtnText}>
                        {loadingLocation ? (locationStatus || 'Fetching Location...') : 'Use Current Location'}
                    </Text>
                </TouchableOpacity>

                {loadingLocation && locationStatus && (
                    <Text style={{ 
                        color: '#2E7D32', 
                        fontSize: 12, 
                        textAlign: 'center', 
                        marginTop: -8, 
                        marginBottom: 12,
                        fontStyle: 'italic'
                    }}>
                        {locationStatus}
                    </Text>
                )}

                <View style={styles.form}>
                    <Text style={styles.label}>Address Label</Text>
                    <View style={styles.radioGroup}>
                        {['business', 'warehouse', 'home'].map((label) => (
                            <TouchableOpacity
                                key={label}
                                style={[
                                    styles.radioButton,
                                    selectedLabel === label && styles.selectedRadio,
                                    isDarkMode && styles.darkCard
                                ]}
                                onPress={() => setSelectedLabel(label)}
                            >
                                <Text style={[
                                    styles.radioText,
                                    selectedLabel === label && styles.selectedRadioText
                                ]}>
                                    {label.charAt(0).toUpperCase() + label.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Full Name of Contact Person</Text>
                        <TextInput
                            style={[styles.input, isDarkMode && styles.darkCard]}
                            placeholder="e.g. Ahmed Ansari"
                            placeholderTextColor="#94A3B8"
                            value={formData.name}
                            onChangeText={(val) => setFormData({...formData, name: val})}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Mobile Number</Text>
                        <View style={styles.phoneInputContainer}>
                            <View style={[styles.prefix, isDarkMode && styles.darkPrefix]}>
                                <Text style={styles.prefixText}>+91</Text>
                            </View>
                             <TextInput
                                style={[styles.input, styles.phoneInput, isDarkMode && styles.darkCard]}
                                placeholder="98765 43210"
                                placeholderTextColor="#94A3B8"
                                keyboardType="numeric"
                                value={formData.phone}
                                onChangeText={(val) => setFormData({...formData, phone: val})}
                            />
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                            <Text style={styles.label}>Pin Code</Text>
                             <TextInput
                                style={[styles.input, isDarkMode && styles.darkCard]}
                                placeholder="400001"
                                placeholderTextColor="#94A3B8"
                                keyboardType="numeric"
                                value={formData.pincode}
                                onChangeText={(val) => setFormData({...formData, pincode: val})}
                            />
                        </View>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.label}>State</Text>
                            <TextInput
                                style={[styles.input, isDarkMode && styles.darkCard]}
                                placeholder="State"
                                placeholderTextColor="#94A3B8"
                                value={formData.state}
                                onChangeText={(val) => setFormData({...formData, state: val})}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>City</Text>
                         <TextInput
                            style={[styles.input, isDarkMode && styles.darkCard]}
                            placeholder="Mumbai"
                            placeholderTextColor="#94A3B8"
                            value={formData.city}
                            onChangeText={(val) => setFormData({...formData, city: val})}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>House/Plot No. and Building Name</Text>
                         <TextInput
                            style={[styles.input, isDarkMode && styles.darkCard]}
                            placeholder="Plot No. 45, Galaxy Tower"
                            placeholderTextColor="#94A3B8"
                            value={formData.houseNo}
                            onChangeText={(val) => setFormData({...formData, houseNo: val})}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Road Name/Area/Colony</Text>
                         <TextInput
                            style={[styles.input, isDarkMode && styles.darkCard]}
                            placeholder="Industrial Area Phase II"
                            placeholderTextColor="#94A3B8"
                            value={formData.roadName}
                            onChangeText={(val) => setFormData({...formData, roadName: val})}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Landmark (Optional)</Text>
                         <TextInput
                            style={[styles.input, isDarkMode && styles.darkCard]}
                            placeholder="e.g. Near Metro Station"
                            placeholderTextColor="#94A3B8"
                            value={formData.landmark}
                            onChangeText={(val) => setFormData({...formData, landmark: val})}
                        />
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Button */}
            <View style={[styles.saveFooter, isDarkMode && styles.darkFooter, { paddingBottom: Math.max(insets.bottom, 24) }]}>
                 <TouchableOpacity 
                    style={[styles.saveBtn, isSaving && { opacity: 0.7 }]} 
                    onPress={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <Text style={styles.saveBtnText}>Save Address</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    darkContainer: {
        backgroundColor: '#0F172A',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(226, 232, 240, 0.5)',
    },
    darkHeader: {
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        borderBottomColor: 'rgba(30, 41, 59, 0.5)',
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
    darkModeButton: {
        padding: 8,
        backgroundColor: '#F1F5F9',
        borderRadius: 8,
    },
    darkButtonBg: {
        backgroundColor: '#1E293B',
    },
    darkText: {
        color: '#F1F5F9',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 16,
    },
    locationBtn: {
        backgroundColor: 'rgba(46, 125, 50, 0.05)',
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(46, 125, 50, 0.2)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 24,
    },
    locationBtnText: {
        color: '#2E7D32',
        fontWeight: 'bold',
        fontSize: 15,
    },
    form: {
        gap: 20,
    },
    label: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
        marginLeft: 4,
    },
    radioGroup: {
        flexDirection: 'row',
        gap: 12,
    },
    radioButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    darkCard: {
        backgroundColor: '#1E293B',
        borderColor: '#334155',
    },
    selectedRadio: {
        backgroundColor: '#2E7D32',
        borderColor: '#2E7D32',
    },
    radioText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    selectedRadioText: {
        color: '#fff',
    },
    inputGroup: {
        gap: 4,
    },
    input: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        color: '#0F172A',
    },
    phoneInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    prefix: {
        height: '100%',
        justifyContent: 'center',
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRightWidth: 0,
        backgroundColor: '#F8FAFC',
        borderTopLeftRadius: 12,
        borderBottomLeftRadius: 12,
        position: 'absolute',
        left: 0,
        zIndex: 2,
    },
    darkPrefix: {
        backgroundColor: '#1E293B',
        borderColor: '#334155',
    },
    prefixText: {
        fontSize: 15,
        color: '#94A3B8',
        fontWeight: '500',
    },
    phoneInput: {
        flex: 1,
        paddingLeft: 65,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    picker: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    pickerText: {
        fontSize: 15,
        color: '#0F172A',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    logo: {
        height: 40,
        width: 120,
        tintColor: '#888',
    },
    footerBranding: {
        marginTop: 32,
        alignItems: 'center',
    },
    saveFooter: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        paddingHorizontal: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    darkFooter: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        borderTopColor: '#334155',
    },
    saveBtn: {
        backgroundColor: '#2E7D32',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#2E7D32',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    saveBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default AddAddressScreen;
