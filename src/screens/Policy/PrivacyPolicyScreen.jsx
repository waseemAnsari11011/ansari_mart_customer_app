import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Platform,
    StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { WebView } from 'react-native-webview';

const PrivacyPolicyScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();

    return (
        <View style={styles.container}>
            <StatusBar
                barStyle="dark-content"
                backgroundColor="#F8FAFC"
            />

            {/* Header */}
            <View
                style={[
                    styles.header,
                    { paddingTop: Math.max(insets.top, 16) },
                ]}
            >
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => navigation.goBack()}
                >
                    <MaterialIcons
                        name="arrow-back-ios"
                        size={18}
                        color="#111827"
                        style={{ marginLeft: 5 }}
                    />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>
                    Privacy Policy
                </Text>

                <View style={{ width: 40 }} />
            </View>

            {/* WebView Container */}
            <View style={styles.webViewContainer}>
                <WebView
                    source={{
                        uri: 'https://www.termsfeed.com/live/ae7b0bcf-438d-41a8-8845-4e75610ba2c6',
                    }}
                    startInLoadingState={true}
                    showsVerticalScrollIndicator={false}
                />
            </View>
        </View>
    );
};

export default PrivacyPolicyScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 16,
        backgroundColor: '#F8FAFC',
    },

    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',

        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
            },
            android: {
                elevation: 3,
            },
        }),
    },

    headerTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#0F172A',
    },

    webViewContainer: {
        flex: 1,
        marginHorizontal: 10,
        marginBottom: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        overflow: 'hidden',

        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.06,
                shadowRadius: 12,
            },
            android: {
                elevation: 4,
            },
        }),
    },
});