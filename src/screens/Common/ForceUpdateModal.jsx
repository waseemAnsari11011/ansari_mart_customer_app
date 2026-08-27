import React from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';

const ForceUpdateModal = ({
    visible,
    onUpdate,
    onExit,
}) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={() => { }}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>

                    <Text style={styles.icon}>🚀</Text>

                    <Text style={styles.title}>
                        Update Available
                    </Text>

                    <Text style={styles.message}>
                        A new version of amart is available with
                        improvements, bug fixes and new features.
                        Please update the app to continue.
                    </Text>

                    <TouchableOpacity
                        style={styles.updateButton}
                        activeOpacity={0.8}
                        onPress={onUpdate}
                    >
                        <Text style={styles.updateButtonText}>
                            Update Now
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.exitButton}
                        activeOpacity={0.8}
                        onPress={onExit}
                    >
                        <Text style={styles.exitButtonText}>
                            Exit App
                        </Text>
                    </TouchableOpacity>

                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.55)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },

    container: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 20,
        paddingHorizontal: 24,
        paddingVertical: 28,
        alignItems: 'center',
    },

    icon: {
        fontSize: 50,
        marginBottom: 10,
    },

    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#222',
        marginBottom: 12,
    },

    message: {
        textAlign: 'center',
        color: '#666',
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 25,
    },

    updateButton: {
        width: '100%',
        backgroundColor: '#4a9214',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },

    updateButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },

    exitButton: {
        width: '100%',
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#ddd',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },

    exitButtonText: {
        color: '#444',
        fontSize: 15,
        fontWeight: '600',
    },
});

export default ForceUpdateModal;
