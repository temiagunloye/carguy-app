// src/screens/SignInScreen.tsx
// User login screen

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { signIn } from '../services/auth';

interface Props {
    navigation: any;
}

export default function SignInScreen({ navigation }: Props) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignIn = async () => {
        if (!email.trim() || !password) {
            Alert.alert('Required', 'Please enter email and password');
            return;
        }

        setLoading(true);
        try {
            await signIn({ email: email.trim(), password });
            navigation.replace('MainTabs');
        } catch (error: any) {
            Alert.alert('Sign In Failed', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.keyboardView}
            >
                <View style={styles.content}>
                    <View style={styles.logoContainer}>
                        <Ionicons name="car-sport" size={64} color="#4a9eff" />
                        <Text style={styles.appName}>ThatCarGuy</Text>
                        <Text style={styles.tagline}>Welcome back!</Text>
                    </View>

                    <View style={styles.form}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="your@email.com"
                            placeholderTextColor="#666"
                            autoCapitalize="none"
                            keyboardType="email-address"
                            value={email}
                            onChangeText={setEmail}
                        />

                        <Text style={styles.label}>Password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter password"
                            placeholderTextColor="#666"
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                        />

                        <TouchableOpacity
                            style={[styles.signInButton, loading && styles.buttonDisabled]}
                            onPress={handleSignIn}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.signInButtonText}>Sign In</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.signUpLink}
                            onPress={() => navigation.replace('SignUp')}
                        >
                            <Text style={styles.signUpLinkText}>
                                Don't have an account? <Text style={styles.signUpLinkBold}>Sign Up</Text>
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.continueLink}
                            onPress={() => navigation.replace('MainTabs')}
                        >
                            <Text style={styles.continueLinkText}>Continue as Guest (Free Tier)</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    keyboardView: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 32,
        justifyContent: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 48,
    },
    appName: {
        color: '#fff',
        fontSize: 32,
        fontWeight: '700',
        marginTop: 16,
    },
    tagline: {
        color: '#888',
        fontSize: 14,
        marginTop: 8,
    },
    form: {
        marginBottom: 32,
    },
    label: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        padding: 16,
        color: '#fff',
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#2a2a2a',
    },
    signInButton: {
        backgroundColor: '#4a9eff',
        borderRadius: 12,
        padding: 18,
        alignItems: 'center',
        marginTop: 24,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    signInButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    signUpLink: {
        marginTop: 24,
        alignItems: 'center',
    },
    signUpLinkText: {
        color: '#888',
        fontSize: 14,
    },
    signUpLinkBold: {
        color: '#4a9eff',
        fontWeight: '600',
    },
    continueLink: {
        marginTop: 16,
        alignItems: 'center',
    },
    continueLinkText: {
        color: '#666',
        fontSize: 13,
        textDecorationLine: 'underline',
    },
});
