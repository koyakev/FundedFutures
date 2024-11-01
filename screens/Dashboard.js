import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Modal, Pressable, Alert } from 'react-native';
import { doc, getDoc, collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase/dbConnection';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import Navigation from './Navigation';
import axios from 'axios';

const API_KEY = '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';

export default function Dashboard({ navigation, route }) {
    const { id } = route.params;
    const [user, setUser] = useState([]);
    const [organizations, setOrganizations] = useState([]);
    const [offers, setOffers] = useState([]);
    const [filteredIds, setFilteredIds] = useState([]);
    const [filteredOffers, setFilteredOffers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    const offersIdList = new Set();

    const query = async (data, id) => {
        const response = await fetch(
            'https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L12-v2',
            {
                headers: {
                    Authorization: `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json',
                },
                method: 'POST',
                body: JSON.stringify(data),
            }
        );
        const result = await response.json();
        console.log("Result: ", id, result);

        for (let i = 0; i < result.length; i++) {
            if (result[i] >= 1) {
                offersIdList.add(id);
            }
        }
        //console.log(offersIdList);
        setFilteredIds(Array.from(offersIdList));
    }

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
    }, []);

    useEffect(() => {
        const runQuery = async () => {
            offers.map(offer => {
                query({
                    'inputs': {
                        'source_sentence': user.school,
                        'sentences': offer.schoolsOffered,
                    }
                }, offer.id)
            })
        }
        runQuery();
    }, [offers, user.schools]);

    useEffect(() => {
        console.log("FilteredIds: ", filteredIds);
        const fetch = async () => {
            const offerPromises = filteredIds.map(async (id) => {
                const filtered = await getDoc(doc(db, 'scholarships', id));
                return {
                    id: filtered.id,
                    ...filtered.data()
                }
            })

            const offers = await Promise.all(offerPromises);
            setFilteredOffers(offers);
        };
        fetch();
    }, [filteredIds]);

    return (
        <View style={styles.container}>

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
        marginTop: 30
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