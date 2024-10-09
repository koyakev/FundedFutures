import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Modal, Pressable, Alert } from 'react-native';
import { doc, getDoc, collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase/dbConnection';
import { Ionicons, MaterialIcons, AntDesign } from '@expo/vector-icons';

const calculateSimilarity = (schoolA, schoolB) => {
    const setA = new Set(schoolA);
    const setB = new Set(schoolB);
    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    return intersection.size / union.size;
}

export default function Dashboard({ navigation, route }) {
    const { id } = route.params;
    const [user, setUser] = useState([]);
    const [organizations, setOrganizations] = useState([]);
    const [offers, setOffers] = useState([]);
    const [visible, setVisible] = useState(false);
    const [selectedOption, setSelectedOption] = useState('');
    const [feedback, setFeedback] = useState('');
    const [filteredOffers, setFilteredOffers] = useState([]);

    useEffect(() => {
        const fetch = async () => {
            try {
                const userDoc = await getDoc(doc(db, 'students', id));
                setUser(userDoc.data());

                const queryOrgs = await getDocs(collection(db, 'organization'));
                const orgList = queryOrgs.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }))
                setOrganizations(orgList);

                const queryOffers = await getDocs(collection(db, 'scholarships'));
                const offerList = queryOffers.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }))
                setOffers(offerList);



            } catch (error) {
                console.error('Error fetching documents: ', error);
            }
        }

        fetch();
    }, [id]);

    useEffect(() => {
        filterOffers(offers, [user.school]);
    }, [offers]);

    const filterOffers = (offersList, userSchool) => {
        const recommendations = offersList
            .map(offer => ({
                ...offer,
                similarity: calculateSimilarity(offer.schoolsOffered, userSchool),
            }))
            .filter(offer => offer.similarity > 0.0)
            .sort((a, b) => b.similarity - a.similarity);

        setFilteredOffers(recommendations);
    }

    const send = async () => {
        try {
            const feedbackData = await addDoc(collection(db, 'feedback'), {
                type: selectedOption,
                userId: id,
                detail: feedback,
            })

            Alert.alert('Feedback successfully sent!');

            setVisible(false);
        } catch (error) {
            console.error('Error adding document: ', error);
        }
    }

    return (
        <View style={styles.container}>

            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchBar}
                    placeholder="Search for Scholarship"
                    placeholderTextColor="4D4D4D"
                />
                <TouchableOpacity style={styles.searchIcon}>
                    <Ionicons name="search" size={24} color="#4D4D4D" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.contentContainer}>
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>List of Scholarship Grantors</Text>
                    <View style={styles.headerIcons}>
                        <TouchableOpacity>
                            <Ionicons name="help-circle-outline" size={28} color="#F7D66A" />
                        </TouchableOpacity>
                        <TouchableOpacity>
                            <MaterialIcons name="notifications" size={28} color="#F7D66A" />
                        </TouchableOpacity>
                    </View>
                </View>

                {filteredOffers ? (
                    <View style={styles.scholarshipContainer}>
                        {filteredOffers.map((offer) => (
                            <View key={offer.id}>
                                <View style={styles.scholarshipItem}>
                                    <View style={styles.scholarshipDetails}>
                                        <Text style={styles.institutionName}>{offer.programName}</Text>
                                        <Text style={styles.postDate}>Posted on {offer.dateAdded}</Text>
                                        <Text style={styles.slotRow}>
                                            <Text style={styles.availableSlotsText}>Available Slots:</Text>
                                            <Text style={styles.availableSlotsValue}>{offer.applied}/{offer.slots}</Text>
                                        </Text>
                                    </View>
                                    <View style={styles.externalBadge}>
                                        <Text style={styles.externalText}>{offer.programType}</Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => {
                                            navigation.navigate('ScholarshipDetails', { id: id, offerId: offer.id })
                                        }}
                                        style={styles.arrowButton}
                                    >
                                        <Ionicons name="chevron-forward" size={24} color="#4D4D4D" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                ) : (
                    <View style={styles.loading}>
                        <ActivityIndicator
                            size="large"
                            color="#F7D66A"
                        />
                    </View>
                )}
                {/* {organizations.length > 0 ? (
                    <>

                        <View style={styles.scholarshipContainer}>
                            {organizations.map((org) => (
                                <View key={org.id} style={styles.scholarshipItem}>
                                    <View style={styles.scholarshipDetails}>
                                        <Text style={styles.institutionName}>{org.orgName}</Text>
                                        <Text style={styles.contact}>{org.orgEmail}</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.arrowButton}
                                        onPress={() => navigation.navigate('Details', { id: id, institute: org.id })}
                                    >
                                        <Ionicons name='chevron-forward' size={24} color='#4D4D4D' />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>


                    </>
                ) : (
                    <View style={styles.loading}>
                        <ActivityIndicator
                            size="large"
                            color="#F7D66A"
                        />
                    </View>
                )} */}
            </ScrollView>

            <Modal
                animationType="slide"
                transparent={true}
                visible={visible}
                onRequestClose={() => setVisible(false)}
            >
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <Text style={styles.titleText}>Send us your feedback!</Text>
                        <Text style={styles.subtitleText}>Do you have a suggestion or found some bugs? Let us know in the field below.</Text>
                        <Text style={styles.feedbackQuestion}>How was your experience?</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Describe your experience here..."
                            multiline
                            numberOfLines={4}
                            value={feedback}
                            onChangeText={value => setFeedback(value)}
                        />

                        <View style={styles.radioGroup}>
                            <Pressable
                                style={styles.radioButton}
                                onPress={() => setSelectedOption('Bug')}
                            >
                                <View style={[styles.radioCircle, selectedOption === 'Bug' && styles.radioCircleSelected]} />
                                <Text style={styles.radioText}>Bug</Text>
                            </Pressable>

                            <Pressable
                                style={styles.radioButton}
                                onPress={() => setSelectedOption('Suggestion')}
                            >
                                <View style={[styles.radioCircle, selectedOption === 'Suggestion' && styles.radioCircleSelected]} />
                                <Text style={styles.radioText}>Suggestion</Text>
                            </Pressable>

                            <Pressable
                                style={styles.radioButton}
                                onPress={() => setSelectedOption('Others')}
                            >
                                <View style={[styles.radioCircle, selectedOption === 'Others' && styles.radioCircleSelected]} />
                                <Text style={styles.radioText}>Others</Text>
                            </Pressable>

                        </View>
                        <TouchableOpacity
                            style={styles.button}
                            onPress={send}
                        >
                            <Text style={styles.buttonText}>Send Feedback</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <View style={styles.nav}>
                <TouchableOpacity>
                    <AntDesign name="home" size={30} color="#FADEAD" />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => navigation.navigate('Profile', { id: id })}
                >
                    <Ionicons name="person-circle-outline" size={30} color="#FADEAD" />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setVisible(true)}
                >
                    <AntDesign name="profile" size={30} color="#FADEAD" />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => navigation.popToTop()}
                >
                    <AntDesign name="logout" size={30} color="red" />
                </TouchableOpacity>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#4D4D4D'
    },
    headerIcons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginLeft: 20,
    },
    searchContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 15,
        marginRight: 15,
        marginTop: 40,
        paddingHorizontal: 15,
        backgroundColor: '#FFFFFF',
        borderRadius: 25
    },
    searchBar: {
        flex: 1,
        height: 40
    },
    searchIcon: {

    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginVertical: 20,
    },
    titleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    contentContainer: {
        paddingHorizontal: 15,
        paddingBottom: 20,
    },
    scholarshipContainer: {
        backgroundColor: '#E6D3A3',
        borderRadius: 15,
        padding: 15,
    },
    scholarshipItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4D4D4D',
        borderRadius: 15,
        padding: 15,
        marginBottom: 15
    },
    scholarshipDetails: {
        flex: 1,
    },
    institutionName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    postDate: {
        fontSize: 12,
        color: '#FFFFFF',
        marginBottom: 5,
    },
    slotRow: {
        flexDirection: 'row',
    },
    availableSlotsText: {
        fontSize: 14,
        color: '#FFFFFF',
        marginRight: 5,
    },
    availableSlotsValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#00FF00'
    },
    externalBadge: {
        backgroundColor: '#FFD700',
        borderRadius: 5,
        paddingVertical: 2,
        paddingHorizontal: 8,
        marginRight: 10,
    },
    externalText: {
        color: '#4D4D4D',
        fontSize: 12,
        fontWeight: 'bold',
    },
    arrowButton: {
        backgroundColor: '#FFD700',
        borderRadius: 15,
        padding: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // scholarshipContainer: {
    //     backgroundColor: '#F7D66A',
    //     borderRadius: 15,
    //     padding: 10,
    //     paddingTop: 10,
    // },
    // scholarshipItem: {
    //     flexDirection: 'row',
    //     alignItems: 'center',
    //     backgroundColor: '#4D4D4D',
    //     borderRadius: 15,
    //     padding: 15,
    //     marginTop: 10,
    //     marginBottom: 10,
    //     borderColor: '#4D4D4D',
    //     borderWidth: 1,
    // },
    // scholarshipDetails: {
    //     flex: 1
    // },
    // institutionName: {
    //     fontSize: 16,
    //     fontWeight: 'bold',
    //     color: '#FFFFFF'
    // },
    // contact: {
    //     fontSize: 12,
    //     color: '#FFFFFF'
    // },
    // arrowButton: {
    //     backgroundColor: '#FFD700',
    //     borderRadius: 25,
    //     padding: 10,
    //     justifyContent: 'center',
    //     alignItems: 'center'
    // },
    nav: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 15,
        marginLeft: 20,
        marginRight: 20,
        borderTopWidth: 1,
        borderTopColor: 'gray',
        borderTopStyle: 'solid'
    },
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    //
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    modalView: {
        width: 300,
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    titleText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    subtitleText: {
        fontSize: 12,
        textAlign: 'center',
        color: '#6C757D',
        marginBottom: 20,
    },
    feedbackQuestion: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 10,
    },
    input: {
        width: '100%',
        height: 80,
        borderColor: '#E0E0E0',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        marginBottom: 15,
        textAlignVertical: 'top',
        backgroundColor: '#F8F9FA',
    },
    radioGroup: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginBottom: 20,
    },
    radioButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    radioCircle: {
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#007BFF',
        marginRight: 5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioCircleSelected: {
        backgroundColor: '#007BFF',
    },
    radioText: {
        fontSize: 12,
        color: '#333',
    },
    button: {
        backgroundColor: '#007BFF',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    buttonText: {
        color: '#FFF',
        fontWeight: 'bold',
    }
});