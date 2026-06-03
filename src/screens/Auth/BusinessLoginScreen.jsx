import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, StatusBar, Image, ActivityIndicator, Alert, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../redux/slices/authSlice';
import api from '../../utils/api';

const BusinessLoginScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const [phone, setPhone] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState(['', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [showBusinessModal, setShowBusinessModal] = useState(false);
    const [businessName, setBusinessName] = useState('');
    const [tempAuthData, setTempAuthData] = useState(null);
    const dispatch = useDispatch();
    const otpRefs = React.useRef([]);

    const handleSendOtp = async () => {
        if (phone.length !== 10) {
            Alert.alert("Invalid Input", "Please enter a valid 10-digit phone number");
            return;
        }
        setLoading(true);
        try {
            const { data } = await api.post('/users/send-otp', { phone, type: 'Business' });
            if (data.token) {
                if (data.isNewUser) {
                    setTempAuthData(data);
                    setShowBusinessModal(true);
                } else {
                    await completeLogin(data.user, data.token);
                }
                return;
            }
            setOtpSent(true);
            Alert.alert('Success', data.message);
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async () => {
        const otpString = otp.join('');
        if (otpString.length !== 4) {
            Alert.alert("Invalid Input", "Please enter the 4-digit OTP");
            return;
        }
        setLoading(true);
        try {
            const { data } = await api.post('/users/verify-otp', { phone, otp: otpString, type: 'Business' });

            if (data.isNewUser) {
                setTempAuthData(data);
                setShowBusinessModal(true);
            } else {
                await completeLogin(data.user, data.token);
            }
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveBusinessDetails = async () => {
        if (!businessName.trim()) {
            Alert.alert("Required", "Please enter Your Name");
            return;
        }
        setLoading(true);
        try {
            const { data } = await api.patch('/users/update-profile',
                { name: businessName.trim() },
                { headers: { Authorization: `Bearer ${tempAuthData.token}` } }
            );
            await completeLogin(data.user, tempAuthData.token);
        } catch (error) {
            Alert.alert('Error', 'Failed to save name');
        } finally {
            setLoading(false);
        }
    };

    const completeLogin = async (user, token) => {
        await AsyncStorage.setItem('userToken', token);
        await AsyncStorage.setItem('userInfo', JSON.stringify(user));
        dispatch(setCredentials({ user, token }));
        navigation.replace('BusinessHome');
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
            <ScrollView
                contentContainerStyle={[styles.container, { paddingTop: Math.max(insets.top, 24) }]}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <Image
                        source={require('../../assets/images/logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    <Text style={styles.title}>Business Login</Text>
                    <Text style={styles.subtitle}>Verify your phone number to continue</Text>
                </View>

                <View style={styles.formContainer}>
                    {!otpSent ? (
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>PHONE NUMBER</Text>
                            <View style={styles.inputContainer}>
                                <Icon name="phone" size={20} color="#bbb" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter phone number"
                                    placeholderTextColor="#ccc"
                                    keyboardType="phone-pad"
                                    maxLength={10}
                                    value={phone}
                                    onChangeText={setPhone}
                                />
                            </View>
                            <TouchableOpacity style={styles.button} onPress={handleSendOtp} disabled={loading}>
                                {loading ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <>
                                        <Text style={styles.buttonText}>Send OTP</Text>
                                        <Icon name="arrow-forward" size={24} color="#fff" />
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>ENTER 4-DIGIT OTP</Text>
                            <View style={styles.otpContainer}>
                                {otp.map((digit, index) => (
                                    <TextInput
                                        key={index}
                                        ref={(ref) => (otpRefs.current[index] = ref)}
                                        style={styles.otpInput}
                                        value={digit}

                                        keyboardType="number-pad"
                                        maxLength={1}
                                        textAlign="center"
                                        textContentType="oneTimeCode"
                                        autoComplete="sms-otp"

                                        onFocus={() => {
                                            otpRefs.current[index] = otpRefs.current[index];
                                        }}

                                        onChangeText={(text) => {
                                            const newOtp = [...otp];
                                            newOtp[index] = text.slice(-1);
                                            setOtp(newOtp);

                                            if (text && index < 3) {
                                                setTimeout(() => {
                                                    otpRefs.current[index + 1]?.focus();
                                                }, 50);
                                            }
                                        }}

                                        onKeyPress={({ nativeEvent }) => {
                                            if (nativeEvent.key === 'Backspace') {

                                                if (otp[index] !== '') {
                                                    // current box clear
                                                    const newOtp = [...otp];
                                                    newOtp[index] = '';
                                                    setOtp(newOtp);
                                                }
                                                else if (index > 0) {
                                                    // move back + clear previous
                                                    const newOtp = [...otp];
                                                    newOtp[index - 1] = '';
                                                    setOtp(newOtp);

                                                    setTimeout(() => {
                                                        otpRefs.current[index - 1]?.focus();
                                                    }, 0);
                                                }
                                            }
                                        }}
                                    />
                                ))}
                            </View>
                            <TouchableOpacity style={styles.button} onPress={handleVerify} disabled={loading}>
                                {loading ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <>
                                        <Text style={styles.buttonText}>Verify & Login</Text>
                                        <Icon name="login" size={24} color="#fff" />
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                <View style={styles.noteContainer}>
                    <View style={styles.noteIconContainer}>
                        <Icon name="verified-user" size={24} color="#398B00" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.noteTitle}>Registration Note</Text>
                        <Text style={styles.noteText}>
                            Business accounts are created by Admin after verification. Please <Text style={styles.linkText}>contact support</Text> to register your business.
                        </Text>
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Are you a retail customer?</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('CustomerLogin')}>
                        <View style={styles.switchContainer}>
                            <Text style={styles.switchText}>Switch to Customer Login</Text>
                            <Icon name="open-in-new" size={16} color="#398B00" />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Business Details Modal */}
                <Modal visible={showBusinessModal} transparent animationType="slide">
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Registration</Text>
                            <Text style={styles.modalSubtitle}>Please enter your name to continue</Text>

                            <View style={styles.modalForm}>
                                <View style={styles.modalInputGroup}>
                                    <Text style={styles.modalLabel}>YOUR NAME *</Text>
                                    <TextInput
                                        style={styles.modalInput}
                                        placeholder="Enter your full name"
                                        value={businessName}
                                        onChangeText={setBusinessName}
                                    />
                                </View>

                                <TouchableOpacity
                                    style={[styles.button, { marginTop: 20 }]}
                                    onPress={handleSaveBusinessDetails}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <>
                                            <Text style={styles.buttonText}>Submit Details</Text>
                                            <Icon name="check-circle" size={24} color="#fff" />
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 24,
        backgroundColor: '#fff',
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logo: {
        width: 120,
        height: 120,
        marginBottom: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#398B00',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
    },
    formContainer: {
        marginBottom: 30,
        gap: 16,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: '#888',
        textTransform: 'uppercase',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        backgroundColor: '#fff',
        paddingHorizontal: 12,
    },
    inputIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 16,
        color: '#333',
    },
    forgotPassword: {
        alignSelf: 'flex-end',
    },
    forgotPasswordText: {
        color: '#F58220',
        fontWeight: '600',
        fontSize: 13,
    },
    button: {
        backgroundColor: '#398B00',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
        marginTop: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    noteContainer: {
        backgroundColor: 'rgba(57, 139, 0, 0.05)',
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        gap: 12,
        borderWidth: 1,
        borderColor: 'rgba(57, 139, 0, 0.1)',
    },
    noteIconContainer: {
        backgroundColor: 'rgba(57, 139, 0, 0.1)',
        padding: 8,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    noteTitle: {
        fontWeight: 'bold',
        fontSize: 14,
        color: '#111',
        marginBottom: 4,
    },
    noteText: {
        fontSize: 12,
        color: '#666',
        lineHeight: 18,
    },
    linkText: {
        color: '#398B00',
        fontWeight: 'bold',
        textDecorationLine: 'underline',
    },
    footer: {
        alignItems: 'center',
        paddingTop: 20,
        marginBottom: 20,
    },
    footerText: {
        fontSize: 14,
        color: '#666',
    },
    switchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        gap: 4,
    },
    switchText: {
        color: '#398B00',
        fontWeight: '600',
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 20,
    },
    otpInput: {
        width: 55,
        height: 65,
        borderWidth: 2,
        borderColor: '#eee',
        borderRadius: 12,
        fontSize: 24,
        fontWeight: 'bold',
        backgroundColor: '#fafafa',
        color: '#398B00',
        textAlign: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#398B00',
        textAlign: 'center',
        marginBottom: 8,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
    },
    modalForm: {
        gap: 16,
    },
    modalInputGroup: {
        gap: 6,
    },
    modalLabel: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#888',
    },
    modalInput: {
        borderWidth: 1.5,
        borderColor: '#eee',
        borderRadius: 10,
        padding: 12,
        fontSize: 15,
        color: '#333',
        backgroundColor: '#f9f9f9',
    }
});

export default BusinessLoginScreen;
