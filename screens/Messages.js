import react, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Modal, TouchableOpacity } from 'react-native';
import Navigation from './Navigation';
import { collection, getDoc, getDocs, doc, query, where, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/dbConnection';

export default function Messages({ navigation, route }) {
    const { id } = route.params;
    const [user, setUser] = useState([]);
    const [messages, setMessages] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetch = async () => {
            try {
                const userDoc = await getDoc(doc(db, 'students', id));
                setUser(userDoc.data());
            } catch (error) {
                console.error('Error: ', error);
            }
        }

        fetch();
    }, [id]);

    useEffect(() => {
        const fetchMessages = async () => {
            if (!user.email) return;
            try {
                const userMessages = await getDocs(query(collection(db, 'messages'), where('receiver', '==', user.email)));
                setMessages(userMessages.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })));
            } catch (error) {
                console.error('Error: ', error);
            }
        }
        fetchMessages();
    }, [user]);

    const deleteMessage = async (idtoDelete) => {
        try {
            setLoading(true);
            setModalVisible(false);
            const toDelete = await deleteDoc(doc(db, 'messages', idtoDelete));
            setLoading(false);
            navigation.goBack();
            navigation.push('Messages', { id: id });
        } catch (error) {
            console.error('Error: ', error);
        }
    }

    return (
        <View style={styles.container}>
            {user ? (
                <View style={styles.username}>
                    <Text style={styles.usernameText}>{user.username}'s Messages</Text>
                </View>
            ) : (
                <View style={styles.loading}>
                    <ActivityIndicator
                        size="large"
                        color="#4D4D4D"
                    />
                </View>
            )}

            <ScrollView style={styles.messageContainer}>
                {!loading ? (
                    <View style={styles.messagesList}>
                        {messages.length > 0 && (
                            messages.map(message => (
                                <TouchableOpacity
                                    key={message.id}
                                    style={styles.messageContent}
                                    onPress={() => setModalVisible(true)}
                                >
                                    <Text style={styles.subject}>
                                        {message.subject}
                                    </Text>
                                    <View style={styles.contentContainer}>
                                        <Text style={styles.sender}>
                                            From: {message.sender}
                                        </Text>
                                        <Text style={styles.sentdate}>
                                            {message.dateSent &&
                                                message.dateSent.toDate().toLocaleDateString('en-us', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                        </Text>
                                    </View>
                                    <Modal
                                        animationType="slide"
                                        transparent={true}
                                        visible={modalVisible}
                                        onRequestClose={() => setModalVisible(false)}
                                    >
                                        <View style={styles.centeredView}>
                                            <View style={styles.modalView}>
                                                <TouchableOpacity
                                                    style={styles.closeButton}
                                                    onPress={() => setModalVisible(false)}
                                                >
                                                    <Text>Close</Text>
                                                </TouchableOpacity>
                                                <Text style={styles.label}>
                                                    Subject:
                                                </Text>
                                                <Text style={styles.modalText}>
                                                    {message.subject}
                                                </Text>
                                                <Text style={styles.label}>
                                                    From:
                                                </Text>
                                                <Text style={styles.modalText}>
                                                    {message.sender}
                                                </Text>
                                                <Text style={styles.label}>
                                                    Date:
                                                </Text>
                                                <Text style={styles.modalText}>
                                                    {message.dateSent.toDate().toLocaleDateString('en-us', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </Text>
                                                <Text style={styles.label}>
                                                    Body:
                                                </Text>
                                                <ScrollView style={styles.bodyContainer}>
                                                    <Text>
                                                        {message.body}
                                                    </Text>
                                                </ScrollView>
                                                <TouchableOpacity
                                                    style={styles.deleteButton}
                                                    onPress={() => deleteMessage(message.id)}
                                                >
                                                    <Text style={styles.deleteButtonText}>Delete Message</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </Modal>
                                </TouchableOpacity>
                            ))
                        )}
                    </View>
                ) : (
                    <View style={styles.loading}>
                        <ActivityIndicator
                            size="large"
                            color="#4D4D4D"
                        />
                    </View>
                )}
            </ScrollView>


            <Navigation navigation={navigation} id={id} />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#4D4D4D'
    },
    messageContainer: {
        flex: 1
    },
    username: {
        padding: 15,
        marginTop: 40,
    },
    usernameText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    messageContainer: {
        flex: 1,
        margin: 15,
        marginTop: 5,
        backgroundColor: '#E6D3A3',
        borderRadius: 20,
        elevation: 20
    },
    messagesList: {
        padding: 20,
    },
    messageContent: {
        backgroundColor: '#4D4D4D',
        padding: 20,
        borderRadius: 15,
        elevation: 10,
        marginBottom: 10,
    },
    subject: {
        color: 'white',
        fontSize: 25,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    contentContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sender: {
        color: 'white',
        fontSize: 12,
    },
    sentdate: {
        color: 'white',
        fontStyle: 'italic',
        fontSize: 12,
    },
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    modalView: {
        width: 350,
        height: 750,
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        paddingTop: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 10,
    },
    label: {
        marginBottom: 5,
        fontWeight: 'bold',
    },
    modalText: {
        fontSize: 16,
        padding: 8,
        borderWidth: 1,
        borderColor: 'lightgray',
        borderRadius: 8,
        marginBottom: 10
    },
    bodyContainer: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 8,
        borderColor: 'lightgray',
        marginBottom: 10,
        padding: 8,
    },
    deleteButton: {
        flexDirection: 'row',
        backgroundColor: '#4D4D4D',
        justifyContent: 'center',
        padding: 10,
        borderRadius: 8
    },
    deleteButtonText: {
        color: 'white',
        fontWeight: 'bold'
    },
    closeButton: {
        flexDirection: 'row',
        justifyContent: 'flex-end'
    }
})