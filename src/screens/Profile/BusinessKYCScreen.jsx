import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, StatusBar, Image, Alert, ActivityIndicator, Platform, PermissionsAndroid } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import api from '../../utils/api';
import { launchImageLibrary } from 'react-native-image-picker';
import { updateUser } from '../../redux/slices/authSlice';
import Geolocation from 'react-native-geolocation-service';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { reverseGeocode } from '../../utils/location';

const BusinessKYCScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const dispatch = useDispatch();
    const user = useSelector(state => state.auth.user);
    
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingLocation, setLoadingLocation] = useState(false);
    const [locationStatus, setLocationStatus] = useState('');
    
    // Form State
    const [formData, setFormData] = useState({
        shopName: user?.businessDetails?.shopName || '',
        businessType: user?.businessDetails?.businessType || '',
        businessAddress: user?.businessDetails?.businessAddress || '',
        latitude: user?.businessDetails?.latitude || null,
        longitude: user?.businessDetails?.longitude || null,
        gstNo: user?.businessDetails?.gstNo || '',
        gstFile: user?.businessDetails?.gstFile || '',
        panNo: user?.businessDetails?.panNo || '',
        panFile: user?.businessDetails?.panFile || ''
    });

    // Local picked files (not yet uploaded)
    const [selectedGst, setSelectedGst] = useState(null);
    const [selectedPan, setSelectedPan] = useState(null);

    const [uploading, setUploading] = useState(false);

    // Fetch latest profile on mount
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get('/users/profile');
                if (response.data) {
                    dispatch(updateUser(response.data));
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
            }
        };
        fetchProfile();
    }, []);

    // Sync formData when user updates in Redux
    useEffect(() => {
        if (user?.businessDetails) {
            setFormData({
                shopName: user.businessDetails.shopName || '',
                businessType: user.businessDetails.businessType || '',
                businessAddress: user.businessDetails.businessAddress || '',
                latitude: user.businessDetails.latitude || null,
                longitude: user.businessDetails.longitude || null,
                gstNo: user.businessDetails.gstNo || '',
                gstFile: user.businessDetails.gstFile || '',
                panNo: user.businessDetails.panNo || '',
                panFile: user.businessDetails.panFile || ''
            });
        }
    }, [user]);

    const handleFilePick = async (type) => {
        const options = {
            mediaType: 'photo',
            includeBase64: false,
            maxHeight: 2000,
            maxWidth: 2000,
        };

        try {
            const response = await launchImageLibrary(options);

            if (response.didCancel) {
                return;
            } else if (response.errorCode) {
                console.error('ImagePicker Error:', response.errorMessage);
                Alert.alert("Error", response.errorMessage || "Failed to pick image.");
            } else if (response.assets && response.assets.length > 0) {
                const pickedFile = response.assets[0];
                if (type === 'gst') setSelectedGst(pickedFile);
                else setSelectedPan(pickedFile);
            }
        } catch (err) {
            console.error('Picker Error:', err);
            Alert.alert("Error", "An unexpected error occurred.");
        }
    };

    const uploadFileToServer = async (file, type) => {
        const formDataUpload = new FormData();
        
        // Ensure URI is correctly formatted for Android/iOS
        const fileUri = Platform.OS === 'android' ? file.uri : file.uri.replace('file://', '');
        
        formDataUpload.append('image', {
            uri: fileUri,
            type: file.type || 'image/jpeg',
            name: file.fileName || `${type}_document.jpg`,
        });

        // baseURL is already .../api, so use /upload
        const response = await api.post('/upload', formDataUpload, {
            headers: { 
                'Content-Type': 'multipart/form-data',
                'Accept': 'application/json'
            },
        });

        return response.data.url;
    };

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
                            const fullAddress = [
                                addressDetails.houseNo,
                                addressDetails.roadName || addressDetails.formattedAddress,
                                addressDetails.landmark ? `Near ${addressDetails.landmark}` : null,
                                addressDetails.city,
                                addressDetails.state,
                                addressDetails.pincode
                            ].filter(Boolean).join(', ');

                            setFormData(prev => ({ 
                                ...prev, 
                                businessAddress: fullAddress,
                                latitude: latitude,
                                longitude: longitude
                            }));
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
                                const fullAddress = [
                                    addressDetails.houseNo,
                                    addressDetails.roadName || addressDetails.formattedAddress,
                                    addressDetails.landmark ? `Near ${addressDetails.landmark}` : null,
                                    addressDetails.city,
                                    addressDetails.state,
                                    addressDetails.pincode
                                ].filter(Boolean).join(', ');

                                setFormData(prev => ({ 
                                    ...prev, 
                                    businessAddress: fullAddress,
                                    latitude: latitude,
                                    longitude: longitude
                                }));
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

    const handleSubmit = async () => {
        if (!formData.shopName || !formData.businessType || !formData.businessAddress || !formData.gstNo || !formData.panNo) {
            Alert.alert("Error", "Please fill all required fields (Shop Name, Type, Address, GST, and PAN)");
            return;
        }

        // Check if documents are present (either already uploaded or selected locally)
        if ((!formData.gstFile && !selectedGst) || (!formData.panFile && !selectedPan)) {
            Alert.alert("Documents Required", "Please upload both GST and PAN images");
            return;
        }

        try {
            setLoading(true);
            setUploading(true);

            let gstUrl = formData.gstFile;
            let panUrl = formData.panFile;

            // Upload new files if selected
            if (selectedGst) {
                try {
                    gstUrl = await uploadFileToServer(selectedGst, 'gst');
                } catch (err) {
                    Alert.alert("GST Upload Failed", "Failed to upload GST document.");
                    setLoading(false);
                    setUploading(false);
                    return;
                }
            }

            if (selectedPan) {
                try {
                    panUrl = await uploadFileToServer(selectedPan, 'pan');
                } catch (err) {
                    Alert.alert("PAN Upload Failed", "Failed to upload PAN document.");
                    setLoading(false);
                    setUploading(false);
                    return;
                }
            }

            const businessDetails = {
                shopName: formData.shopName,
                businessType: formData.businessType,
                businessAddress: formData.businessAddress,
                latitude: formData.latitude,
                longitude: formData.longitude,
                gstNo: formData.gstNo,
                gstFile: gstUrl,
                panNo: formData.panNo,
                panFile: panUrl,
                verificationStatus: 'Pending'
            };

            const response = await api.patch('/users/update-profile', { businessDetails });
            
            if (response.data.user) {
                dispatch(updateUser(response.data.user));
                Alert.alert("Success", "KYC details and documents submitted successfully!");
                navigation.goBack();
            }
        } catch (error) {
            console.error('KYC submission error:', error);
            Alert.alert("Error", error.response?.data?.message || "Failed to submit KYC details");
        } finally {
            setLoading(false);
            setUploading(false);
        }
    };

    return (
        <View style={[styles.container, isDarkMode && styles.darkContainer]}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />
            
            <View style={[styles.header, isDarkMode && styles.darkHeader, { paddingTop: Math.max(insets.top, 16) }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back-ios" size={20} color={isDarkMode ? "#fff" : "#111"} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, isDarkMode && styles.darkText]}>Business KYC</Text>
                {/* Theme toggle removed */}
            </View>

            <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 + insets.bottom }]} showsVerticalScrollIndicator={false}>
                {user?.businessDetails?.verificationStatus === 'Approved' ? (
                    <View style={[styles.statusBanner, isDarkMode && styles.darkStatusBanner, { backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(34, 197, 94, 0.3)' }]}>
                        <MaterialIcons name="check-circle" size={24} color="#22C55E" />
                        <View style={styles.statusTextContainer}>
                            <Text style={[styles.statusTitle, { color: '#22C55E' }]}>KYC Approved</Text>
                            <Text style={[styles.statusDesc, isDarkMode && styles.darkSubText]}>Your business account is verified. You now have access to wholesale pricing and bulk ordering.</Text>
                        </View>
                    </View>
                ) : user?.businessDetails?.verificationStatus === 'Rejected' ? (
                    <View style={[styles.statusBanner, isDarkMode && styles.darkStatusBanner, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' }]}>
                        <MaterialIcons name="error" size={24} color="#EF4444" />
                        <View style={styles.statusTextContainer}>
                            <Text style={[styles.statusTitle, { color: '#EF4444' }]}>KYC Rejected</Text>
                            <Text style={[styles.statusDesc, isDarkMode && styles.darkSubText]}>{user?.businessDetails?.rejectionReason || "Please verify your documents and try again."}</Text>
                        </View>
                    </View>
                ) : (
                    <View style={[styles.statusBanner, isDarkMode && styles.darkStatusBanner, { backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.3)' }]}>
                        <MaterialIcons name="pending-actions" size={24} color="#F59E0B" />
                        <View style={styles.statusTextContainer}>
                            <Text style={[styles.statusTitle, { color: '#F59E0B' }]}>KYC Pending</Text>
                            <Text style={[styles.statusDesc, isDarkMode && styles.darkSubText]}>Please complete your business KYC to activate wholesale pricing and bulk ordering.</Text>
                        </View>
                    </View>
                )}

                <View style={styles.formSection}>
                    <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>Business Details</Text>
                    
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Legal Business Name</Text>
                        <TextInput
                            style={[styles.input, isDarkMode && styles.darkInput, user?.businessDetails?.verificationStatus === 'Approved' && { opacity: 0.8, backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc' }]}
                            placeholder="M/s Ansari Traders"
                            placeholderTextColor="#94A3B8"
                            value={formData.shopName}
                            onChangeText={(text) => setFormData({ ...formData, shopName: text })}
                            editable={user?.businessDetails?.verificationStatus !== 'Approved'}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Business Type</Text>
                        <TextInput
                            style={[styles.input, isDarkMode && styles.darkInput, user?.businessDetails?.verificationStatus === 'Approved' && { opacity: 0.8, backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc' }]}
                            placeholder="Retailer / Kirana Store / Wholesale"
                            placeholderTextColor="#94A3B8"
                            value={formData.businessType}
                            onChangeText={(text) => setFormData({ ...formData, businessType: text })}
                            editable={user?.businessDetails?.verificationStatus !== 'Approved'}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                            <Text style={styles.label}>Business Address</Text>
                            <TouchableOpacity onPress={fetchLocation} disabled={loadingLocation || user?.businessDetails?.verificationStatus === 'Approved'}>
                                {loadingLocation ? (
                                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
                                        <ActivityIndicator size="small" color="#2E7D32" />
                                        <Text style={{color: '#2E7D32', fontSize: 13, fontWeight: 'bold'}}>{locationStatus}</Text>
                                    </View>
                                ) : (
                                    <Text style={{color: '#2E7D32', fontSize: 13, fontWeight: 'bold'}}>Fetch Current Location</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                        <TextInput
                            style={[styles.input, isDarkMode && styles.darkInput, user?.businessDetails?.verificationStatus === 'Approved' && { opacity: 0.8, backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc' }, { minHeight: 80, textAlignVertical: 'top' }]}
                            placeholder="Enter complete business address"
                            placeholderTextColor="#94A3B8"
                            multiline={true}
                            value={formData.businessAddress}
                            onChangeText={(text) => setFormData({ ...formData, businessAddress: text })}
                            editable={user?.businessDetails?.verificationStatus !== 'Approved'}
                        />
                    </View>

                    <Text style={[styles.sectionTitle, isDarkMode && styles.darkText, { marginTop: 16 }]}>GST Verification</Text>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>GST Number</Text>
                        <TextInput
                            style={[styles.input, isDarkMode && styles.darkInput, user?.businessDetails?.verificationStatus === 'Approved' && { opacity: 0.8, backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc' }]}
                            placeholder="Enter 15-digit GST number"
                            placeholderTextColor="#94A3B8"
                            autoCapitalize="characters"
                            value={formData.gstNo}
                            onChangeText={(text) => setFormData({ ...formData, gstNo: text })}
                            editable={user?.businessDetails?.verificationStatus !== 'Approved'}
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Upload GST Document Image</Text>
                        <TouchableOpacity 
                            style={[styles.uploadBox, isDarkMode && styles.darkUploadBox, (formData.gstFile || selectedGst) && styles.uploadedBox, user?.businessDetails?.verificationStatus === 'Approved' && { opacity: 0.7 }]}
                            onPress={() => handleFilePick('gst')}
                            disabled={uploading || user?.businessDetails?.verificationStatus === 'Approved'}
                        >
                            <MaterialIcons name={(formData.gstFile || selectedGst) ? "check-circle" : "cloud-upload"} size={32} color="#2E7D32" />
                            <Text style={[styles.uploadTitle, isDarkMode && styles.darkText]}>
                                {(formData.gstFile || selectedGst) ? "GST Selected" : "Tap to upload GST"}
                            </Text>
                            <Text style={styles.uploadSub}>
                                {selectedGst ? selectedGst.fileName : (formData.gstFile ? "Image already uploaded" : "JPEG or PNG (Max 5MB)")}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.sectionTitle, isDarkMode && styles.darkText, { marginTop: 16 }]}>PAN Verification</Text>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>PAN Card Number</Text>
                        <TextInput
                            style={[styles.input, isDarkMode && styles.darkInput, user?.businessDetails?.verificationStatus === 'Approved' && { opacity: 0.8, backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc' }]}
                            placeholder="Enter 10-digit PAN number"
                            placeholderTextColor="#94A3B8"
                            autoCapitalize="characters"
                            value={formData.panNo}
                            onChangeText={(text) => setFormData({ ...formData, panNo: text })}
                            editable={user?.businessDetails?.verificationStatus !== 'Approved'}
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Upload PAN Card Image</Text>
                        <TouchableOpacity 
                            style={[styles.uploadBox, isDarkMode && styles.darkUploadBox, (formData.panFile || selectedPan) && styles.uploadedBox, user?.businessDetails?.verificationStatus === 'Approved' && { opacity: 0.7 }]}
                            onPress={() => handleFilePick('pan')}
                            disabled={uploading || user?.businessDetails?.verificationStatus === 'Approved'}
                        >
                            <MaterialIcons name={(formData.panFile || selectedPan) ? "check-circle" : "cloud-upload"} size={32} color="#2E7D32" />
                            <Text style={[styles.uploadTitle, isDarkMode && styles.darkText]}>
                                {(formData.panFile || selectedPan) ? "PAN Selected" : "Tap to upload PAN"}
                            </Text>
                            <Text style={styles.uploadSub}>
                                {selectedPan ? selectedPan.fileName : (formData.panFile ? "Image already uploaded" : "JPEG or PNG (Max 5MB)")}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            <View style={[styles.footer, isDarkMode && styles.darkFooter, { paddingBottom: Math.max(insets.bottom, 24) }]}>
                <TouchableOpacity 
                    style={[styles.submitBtn, (loading || user?.businessDetails?.verificationStatus === 'Approved') && { opacity: 0.7 }]} 
                    onPress={handleSubmit}
                    disabled={loading || user?.businessDetails?.verificationStatus === 'Approved'}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitBtnText}>
                            {user?.businessDetails?.verificationStatus === 'Approved' ? "Verification Complete" : "Submit Details"}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    darkContainer: { backgroundColor: '#0F172A' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', zIndex: 10 },
    darkHeader: { backgroundColor: '#1E293B', borderBottomColor: '#334155' },
    backButton: { padding: 8, marginLeft: -8 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0F172A', flex: 1, marginLeft: 12 },
    darkModeButton: { padding: 8, backgroundColor: '#F1F5F9', borderRadius: 8 },
    darkButtonBg: { backgroundColor: '#334155' },
    darkText: { color: '#F8FAFC' },
    darkSubText: { color: '#94A3B8' },
    scrollContent: { padding: 20 },
    statusBanner: { flexDirection: 'row', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 24, gap: 12 },
    darkStatusBanner: { backgroundColor: 'rgba(245, 158, 11, 0.05)' },
    statusTextContainer: { flex: 1 },
    statusTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
    statusDesc: { fontSize: 13, color: '#475569', lineHeight: 20 },
    formSection: { gap: 20 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginBottom: -4 },
    inputGroup: { gap: 8 },
    label: { fontSize: 13, fontWeight: 'bold', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginLeft: 4 },
    input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#0F172A' },
    darkInput: { backgroundColor: '#1E293B', borderColor: '#334155', color: '#F8FAFC' },
    picker: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    pickerText: { fontSize: 15, color: '#0F172A' },
    radioGroup: { flexDirection: 'row', gap: 12, marginBottom: 8 },
    radioButton: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', backgroundColor: '#fff' },
    darkCard: { backgroundColor: '#1E293B', borderColor: '#334155' },
    selectedRadio: { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
    radioText: { fontSize: 13, fontWeight: 'bold', color: '#1E293B' },
    selectedRadioText: { color: '#fff' },
    uploadedBox: { borderColor: '#2E7D32', borderStyle: 'solid', backgroundColor: 'rgba(46, 125, 50, 0.1)' },
    uploadBox: { backgroundColor: 'rgba(46, 125, 50, 0.05)', borderWidth: 1.5, borderColor: 'rgba(46, 125, 50, 0.3)', borderStyle: 'dashed', borderRadius: 16, padding: 24, alignItems: 'center', gap: 8 },
    darkUploadBox: { backgroundColor: 'rgba(46, 125, 50, 0.1)', borderColor: 'rgba(46, 125, 50, 0.4)' },
    uploadTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', marginTop: 4 },
    uploadSub: { fontSize: 13, color: '#64748B' },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
    darkFooter: { backgroundColor: '#1E293B', borderTopColor: '#334155' },
    submitBtn: { backgroundColor: '#2E7D32', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
    submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

export default BusinessKYCScreen;
