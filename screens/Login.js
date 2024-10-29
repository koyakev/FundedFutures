import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Image, Pressable, Alert, ActivityIndicator } from 'react-native';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/dbConnection';

export default function Login({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const login = async () => {
        setLoading(true);
        const querySnapshot = await getDocs(query(collection(db, 'students'), where('email', '==', email), where('password', '==', password)));

        if (querySnapshot.empty) {
            Alert.alert('Invalid', 'The user is not found');
            setLoading(false);
        }

        querySnapshot.forEach((doc) => {
            const id = doc.id;
            navigation.navigate('Dashboard', { id: id });
            Alert.alert('Welcome!', `Hello ${doc.data().username}`);
        })

        setEmail('');
        setPassword('');
        setLoading(false);
    }

    const changePass = async () => {
        const querySnapshot = await getDocs(query(collection(db, 'students'), where('email', '==', email)));

        if (querySnapshot.empty) {
            Alert.alert('Email is not found');
        } else {
            navigation.navigate('ChangePassword', { email: email });
        }
    }

    return (
        <View style={styles.container}>
            <View style={styles.login}>
                <Image
                    style={styles.logo}
                    source={require('../assets/STUDENT.png')}
                />
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                    style={styles.input}
                    placeholder="email@example.com"
                    value={email}
                    onChangeText={value => setEmail(value)}
                />
                <Text style={styles.label}>Password</Text>
                <TextInput
                    style={styles.input}
                    secureTextEntry={true}
                    placeholder="**********"
                    value={password}
                    onChangeText={value => setPassword(value)}
                />
                <Pressable style={styles.forget}
                    onPress={changePass}
                >
                    <Text style={styles.forgetText}>Forget Password?</Text>
                </Pressable>

                {!loading ? (
                    <Pressable
                        style={styles.signin}
                        onPress={login}
                    >
                        <Text style={styles.signinButton}>Sign In</Text>
                    </Pressable>
                ) : (
                    <ActivityIndicator
                        style={styles.signin}
                        size={27}
                        color="#555455"
                    />
                )}

                <Pressable
                    style={styles.signup}
                    onPress={() => navigation.navigate('SignupStudent')}
                >
                    <Text style={styles.signupText}>Don't have an account? Register here</Text>
                </Pressable>

            </View>
        </View >
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: "#555455"
    },
    logo: {
        height: 350,
        width: 300,
        alignSelf: 'center'
    },
    login: {
        padding: 20,
    },
    label: {
        color: "#FADEAD",
        fontSize: 20,
        margin: 7
    },
    input: {
        backgroundColor: "#FADEAD",
        width: 300,
        padding: 10,
        borderRadius: 20,
        marginBottom: 10,
        elevation: 5
    },
    forget: {
        alignSelf: 'flex-end',
    },
    forgetText: {
        color: '#FADEAD',
        fontSize: 16,
        marginBottom: 40
    },
    signin: {
        backgroundColor: "#FADEAD",
        alignSelf: 'center',
        alignItems: 'center',
        padding: 15,
        width: 200,
        borderRadius: 20,
        marginBottom: 40,
        elevation: 5,
    },
    signinButton: {
        fontSize: 20,
        color: "#555455",
    },
    signup: {
        alignSelf: 'center',
    },
    signupText: {
        color: "#FADEAD",
        fontSize: 16
    }
});