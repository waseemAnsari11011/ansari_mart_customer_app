import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Dimensions, StatusBar, Image } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import api, { resolveImageUrl } from '../../utils/api';
import { updateUser } from '../../redux/slices/authSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, ActivityIndicator } from 'react-native';

const { width } = Dimensions.get('window');

const EditProfileScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const user = useSelector(state => state.auth.user);
    const dispatch = useDispatch();

    const [name, setName] = useState(user?.name || '');
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Name cannot be empty');
            return;
        }

        setLoading(true);
        try {
            const response = await api.patch('/users/update-profile', { name });
            const updatedUser = response.data.user;

            // Update Redux
            dispatch(updateUser(updatedUser));

            // Update AsyncStorage
            const userInfo = await AsyncStorage.getItem('userInfo');
            if (userInfo) {
                const parsedInfo = JSON.parse(userInfo);
                await AsyncStorage.setItem('userInfo', JSON.stringify({ ...parsedInfo, ...updatedUser }));
            }

            Alert.alert('Success', 'Profile updated successfully');
            navigation.goBack();
        } catch (error) {
            console.error('Update error:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <View style={[styles.container, isDarkMode && styles.darkContainer]}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />
            
            <View style={[styles.header, isDarkMode && styles.darkHeader, { paddingTop: Math.max(insets.top, 16) }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back-ios" size={20} color={isDarkMode ? "#fff" : "#111"} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, isDarkMode && styles.darkText]}>Edit Profile</Text>
                {/* Theme toggle removed */}
            </View>

            <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 + insets.bottom }]}>
                <View style={styles.profileSection}>
                    <View style={styles.avatarContainer}>
                        <Image 
                            source={{ uri: resolveImageUrl(user?.profilePhoto) || `https://ui-avatars.com/api/?name=${name || 'User'}&background=2E7D32&color=fff&size=120` }} 
                            style={styles.avatar} 
                        />
                        <TouchableOpacity style={styles.cameraBtn} onPress={() => Alert.alert('Coming Soon', 'Profile photo upload will be available in the next update.')}>
                            <MaterialIcons name="photo-camera" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.formSection}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Full Name</Text>
                        <TextInput
                            style={[styles.input, isDarkMode && styles.darkInput]}
                            value={name}
                            onChangeText={setName}
                            placeholder="Enter your name"
                            placeholderTextColor="#94A3B8"
                        />
                    </View>


                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Mobile Number</Text>
                        <TextInput
                            style={[styles.input, isDarkMode && styles.darkInput]}
                            value={user?.phone || ''}
                            keyboardType="phone-pad"
                            placeholderTextColor="#94A3B8"
                            editable={false}
                        />
                        <Text style={styles.helpText}>To change mobile number, please contact support.</Text>
                    </View>
                </View>
            </ScrollView>

            <View style={[styles.footer, isDarkMode && styles.darkFooter, { paddingBottom: Math.max(insets.bottom, 24) }]}>
                <TouchableOpacity 
                    style={[styles.saveBtn, loading && { opacity: 0.7 }]} 
                    onPress={handleSave}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.saveBtnText}>Save Changes</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
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
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        zIndex: 10,
    },
    darkHeader: {
        backgroundColor: '#1E293B',
        borderBottomColor: '#334155',
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
        backgroundColor: '#334155',
    },
    darkText: {
        color: '#F8FAFC',
    },
    scrollContent: {
        paddingTop: 32,
        paddingHorizontal: 20,
    },
    profileSection: {
        alignItems: 'center',
        marginBottom: 40,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        borderColor: '#fff',
    },
    cameraBtn: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#2E7D32',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#fff',
    },
    profileName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 4,
    },
    profileEmail: {
        fontSize: 14,
        color: '#64748B',
    },
    formSection: {
        gap: 20,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginLeft: 4,
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        color: '#0F172A',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        elevation: 1,
    },
    darkInput: {
        backgroundColor: '#1E293B',
        borderColor: '#334155',
        color: '#F8FAFC',
    },
    helpText: {
        fontSize: 12,
        color: '#94A3B8',
        marginLeft: 4,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    darkFooter: {
        backgroundColor: '#1E293B',
        borderTopColor: '#334155',
    },
    saveBtn: {
        backgroundColor: '#2E7D32',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    saveBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default EditProfileScreen;
