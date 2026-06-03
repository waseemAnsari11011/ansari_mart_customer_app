import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, StatusBar, Image, ActivityIndicator, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../redux/slices/authSlice';
import api from '../../utils/api';

const CustomerLoginScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState(['', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [showNameModal, setShowNameModal] = useState(false);
    const [name, setName] = useState('');
    const [tempAuthData, setTempAuthData] = useState(null);
    const dispatch = useDispatch();
    const otpRefs = useRef([]);

    const handleSendOtp = async () => {
        if (phoneNumber.length !== 10) {
            Alert.alert("Invalid Input", "Please enter a valid 10-digit phone number");
            return;
        }
        setLoading(true);
        try {
            const { data } = await api.post('/users/send-otp', { phone: phoneNumber, type: 'Retail' });
            if (data.token) {
                if (data.isNewUser) {
                    setTempAuthData(data);
                    setShowNameModal(true);
                } else {
                    await completeLogin(data.user, data.token);
                }
                return;
            }
            setOtpSent(true);
            // The message from server is now "OTP sent successfully to your phone number."
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
            const { data } = await api.post('/users/verify-otp', { phone: phoneNumber, otp: otpString });

            if (data.isNewUser) {
                setTempAuthData(data);
                setShowNameModal(true);
            } else {
                await completeLogin(data.user, data.token);
            }
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveName = async () => {
        if (!name.trim()) {
            Alert.alert("Required", "Please enter your name");
            return;
        }
        setLoading(true);
        try {
            // Pass token explicitly to ensure it's not overwritten by interceptors
            const { data } = await api.patch('/users/update-profile',
                { name: name.trim() },
                { headers: { Authorization: `Bearer ${tempAuthData.token}` } }
            );
            await completeLogin(data.user, tempAuthData.token);
        } catch (error) {
            console.log('Update Profile Error:', error.response?.data || error.message);
            Alert.alert('Error', 'Failed to save name');
        } finally {
            setLoading(false);
        }
    };

    const completeLogin = async (user, token) => {
        await AsyncStorage.setItem('userToken', token);
        await AsyncStorage.setItem('userInfo', JSON.stringify(user));
        dispatch(setCredentials({ user, token }));
        navigation.replace('RetailHome');
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
                    <Text style={styles.title}>Customer Login</Text>
                    <Text style={styles.subtitle}>Verify your phone number to continue</Text>
                </View>

                <View style={styles.formContainer}>
                    {!otpSent ? (
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>PHONE NUMBER</Text>
                            <View style={styles.phoneInputContainer}>
                                <Text style={styles.countryCode}>+91</Text>
                                <TextInput
                                    style={styles.phoneInput}
                                    value={phoneNumber}
                                    onChangeText={setPhoneNumber}
                                    keyboardType="phone-pad"
                                    maxLength={10}
                                    placeholder="Enter 10 digit number"
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
                            <View style={styles.otpHeader}>
                                <Text style={styles.label}>ENTER 4-DIGIT OTP</Text>
                                <Text style={styles.timer}>00:59</Text>
                            </View>
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
                            <View style={styles.resendContainer}>
                                <Text style={styles.resendText}>Didn't receive code?</Text>
                                <TouchableOpacity>
                                    <Text style={styles.resendLink}>Resend OTP</Text>
                                </TouchableOpacity>
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

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Are you a Shop Owner?</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('BusinessLogin')}>
                        <View style={styles.switchContainer}>
                            <Text style={styles.switchText}>Switch to Buy For Shop Login</Text>
                            <Icon name="open-in-new" size={16} color="#4AA218" />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Name Input Modal */}
                <Modal
                    visible={showNameModal}
                    transparent={true}
                    animationType="slide"
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Welcome to AnsariMart!</Text>
                            <Text style={styles.modalSubtitle}>Please enter your name to continue</Text>

                            <View style={styles.modalInputGroup}>
                                <Text style={styles.label}>FULL NAME</Text>
                                <TextInput
                                    style={styles.nameInput}
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="e.g. Rahul Kumar"
                                    autoFocus
                                />
                            </View>

                            <TouchableOpacity
                                style={[styles.button, { marginTop: 24 }]}
                                onPress={handleSaveName}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <>
                                        <Text style={styles.buttonText}>Get Started</Text>
                                        <Icon name="check-circle" size={24} color="#fff" />
                                    </>
                                )}
                            </TouchableOpacity>
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
        color: '#4AA218',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
    },
    formContainer: {
        marginBottom: 30,
    },
    inputGroup: {
        gap: 16,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: '#888',
        textTransform: 'uppercase',
    },
    phoneInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#f0f0f0',
        borderRadius: 12,
        backgroundColor: '#fafafa',
        overflow: 'hidden',
    },
    countryCode: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        color: '#666',
        fontWeight: '500',
        borderRightWidth: 1,
        borderRightColor: '#eee',
    },
    phoneInput: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#333',
    },
    button: {
        backgroundColor: '#F38120',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        marginTop: 10,
        gap: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    otpHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    timer: {
        fontSize: 12,
        color: '#888',
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        marginVertical: 10,
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
        color: '#4AA218',
        textAlign: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    resendContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    resendText: {
        fontSize: 12,
        color: '#666',
    },
    resendLink: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#F38120',
    },
    footer: {
        alignItems: 'center',
        paddingTop: 20,
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
        color: '#4AA218',
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#4AA218',
        textAlign: 'center',
        marginBottom: 8,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
    },
    modalInputGroup: {
        gap: 8,
    },
    nameInput: {
        borderWidth: 2,
        borderColor: '#f0f0f0',
        borderRadius: 12,
        backgroundColor: '#fafafa',
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#333',
    }
});

export default CustomerLoginScreen;
