import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Modal, Pressable, Alert } from 'react-native';
import { doc, getDoc, collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase/dbConnection';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import Navigation from './Navigation';
// import * as tf from '@tensorflow/tfjs';
// import '@tensorflow/tfjs-react-native';

// const createPresenceTensor = (set, universe) => {
//     if (!Array.isArray(set) || !Array.isArray(universe)) {
//         throw new Error('Both set and universe must be arrays');
//     }

//     const presenceArray = universe.map(item => set.includes(item) ? 1 : 0);
//     return tf.tensor1d(presenceArray);
// }

// const calculateSimilarity = (schoolA, schoolB) => {
//     try {
//         const validSchoolA = Array.isArray(schoolA) ? schoolA : [];
//         const validSchoolB = Array.isArray(schoolB) ? schoolB : [];

//         const universe = Array.from(new Set([...validSchoolA, ...validSchoolB]));
//         const tensorA = createPresenceTensor(schoolA, universe);
//         const tensorB = createPresenceTensor(schoolB, universe);
//         const intersection = tf.minimum(tensorA, tensorB);
//         const union = tf.maximum(tensorA, tensorB);
//         const intersectionSum = intersection.sum().dataSync()[0];
//         const unionSum = union.sum().dataSync()[0];
//         const similarity = intersectionSum / unionSum;
//         return similarity;
//     } catch (error) {
//         console.error('TensorFlow error: ', error)
//     }
// }

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
    const [filteredOffers, setFilteredOffers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    // useEffect(() => {
    //     const initializeTensorFlow = async () => {
    //         await tf.ready();
    //         console.log('TensorFlow.js is ready');
    //     };
    //     initializeTensorFlow();
    // });

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
    }, [offers, user, searchTerm]);

    const filterOffers = (offersList, userSchool) => {
        const recommendations = offersList
            .map(offer => {
                const schoolOffered = Array.isArray(offer.schoolsOffered) ? offer.schoolsOffered : [];
                return {
                    ...offer,
                    similarity: calculateSimilarity(offer.schoolsOffered, userSchool),
                }
            })
            .filter(offer =>
                offer.similarity > 0.0 &&
                offer.programName.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .sort((a, b) => b.similarity - a.similarity);

        setFilteredOffers(recommendations);
    }

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchBar}
                    placeholder="Search for Scholarship"
                    placeholderTextColor="4D4D4D"
                    value={searchTerm}
                    onChangeText={text => setSearchTerm(text)}
                />
                <TouchableOpacity style={styles.searchIcon}>
                    <Ionicons name="search" size={24} color="#4D4D4D" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.contentContainer}>
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>List of Scholarship Grantors</Text>
                    <View style={styles.headerIcons}>
                        <FontAwesome5 name="user-graduate" size={24} color="#F7D66A" />
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


            <Navigation navigation={navigation} id={id} />

        </View >
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
        elevation: 10,
    },
    scholarshipItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4D4D4D',
        borderRadius: 15,
        padding: 15,
        marginBottom: 15,
        elevation: 10,
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

    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    //

});