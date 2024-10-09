import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5, AntDesign } from '@expo/vector-icons';
import { doc, getDoc, getDocs, query, collection, where } from 'firebase/firestore';
import { db } from '../firebase/dbConnection';

export default function Profile({ navigation, route }) {
    const { id } = route.params;
    const [user, setUser] = useState(null);
    const [applications, setApplications] = useState([]);
    const [offerDetails, setOfferDetails] = useState([]);


    useEffect(() => {
        const fetchData = async () => {
            try {
                const userDoc = await getDoc(doc(db, 'students', id));
                setUser(userDoc.data());

                const applicationsList = await getDocs(query(collection(db, 'enrollments'), where('userId', '==', id)));
                setApplications(applicationsList.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data()
                })))

                const offerDetailsArray = [];

                for (const application of applicationsList.docs) {
                    try {
                        const offerDoc = await getDoc(doc(db, 'scholarships', application.data().offerId));

                        const offerGrantor = await getDocs(query(collection(db, 'organization'), where('orgEmail', '==', offerDoc.data().createdBy)));
                        offerGrantor.forEach(grantor => {
                            offerDetailsArray.push({
                                id: offerDoc.id,
                                ...offerDoc.data(),
                                ...grantor.data(),
                                ...application.data(),
                            });
                        })

                    } catch (error) {
                        console.error('Error fetching documents: ', error);
                    }
                }

                setOfferDetails(offerDetailsArray);

            } catch (error) {
                console.error('Error fetching data: ', error)
            }
        }

        fetchData();
    }, [id])

    const birthday = user && user.birthday ? new Date(user.birthday.seconds * 1000).toLocaleDateString() : null;

    return (
        <View style={styles.container}>
            {user ? (
                <>
                    <View style={styles.header}>
                        <View style={styles.profileContainer}>
                            <View style={styles.profileImage}>
                                <FontAwesome5 name="user-graduate" size={35} color="black" />
                            </View>
                            <View style={styles.profileDetails}>
                                <Text style={styles.profileName}>{user.firstname} {user.lastname}</Text>
                                <Text style={styles.profileEmail}>{user.email}</Text>
                                <Text style={styles.profileContact}>{user.username}</Text>
                            </View>
                        </View>

                    </View>

                </>
            ) : (
                <View style={styles.loading}>
                    <ActivityIndicator
                        size="large"
                        color="#F7D66A"
                    />
                </View>
            )}

            <ScrollView contentContainerStyle={styles.contentContainer}>
                <View style={styles.scholarshipContainer}>
                    {offerDetails.length > 0 ? (
                        offerDetails.map((offer) => (
                            <View key={offer.id} style={styles.scholarshipItem}>
                                <View style={styles.scholarshipDetails}>
                                    <Text style={styles.institutionName}>{offer.orgName}</Text>
                                    <Text style={styles.scholarshipName}>{offer.programName}</Text>
                                </View>
                                <View style={styles.progressContainer}>
                                    {offer.status == 'approved' ? (
                                        <View style={[styles.progressBarContainer, { backgroundColor: '#FFD700' }]}>
                                            <Text style={styles.progressText}>{offer.status}</Text>
                                        </View>
                                    ) : offer.status == 'pending' ? (
                                        <View style={[styles.progressBarContainer, { backgroundColor: 'red' }]}>
                                            <Text style={[styles.progressText, { color: 'white' }]}>{offer.status}</Text>
                                        </View>
                                    ) : (
                                        <View style={[styles.progressBarContainer, { backgroundColor: '#B0B0B0' }]}>
                                            <Text style={styles.progressText}>{offer.status}</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        ))
                    ) : (
                        <View style={styles.loading}>
                            <ActivityIndicator
                                size="large"
                                color="#4D4D4D"
                            />
                        </View>
                    )}
                </View>
            </ScrollView>

            <View style={styles.nav}>
                <TouchableOpacity
                    onPress={() => navigation.navigate('Dashboard', { id: id })}
                >
                    <AntDesign name="home" size={30} color="#FADEAD" />
                </TouchableOpacity>
                <TouchableOpacity>
                    <Ionicons name="person-circle-outline" size={30} color="#FADEAD" />
                </TouchableOpacity>
                <TouchableOpacity>
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
        backgroundColor: '#4D4D4D',
    },
    header: {
        padding: 15,
        backgroundColor: '#4D4D4D',
        marginTop: 40,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    profileContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileImage: {
        width: 60,
        height: 60,
        backgroundColor: '#E6D3A3',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 30
    },
    profileDetails: {
        marginLeft: 10,
    },
    profileName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    profileStatus: {
        fontSize: 14,
        color: '#FFD700',
    },
    profileEmail: {
        fontSize: 14,
        color: '#FFFFFF',
    },
    profileContact: {
        fontSize: 14,
        color: '#FFFFFF',
    },
    notificationButton: {
        padding: 10,
    },
    contentContainer: {
        paddingHorizontal: 15,
        paddingBottom: 20,
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
        color: '#FFD700'
    },
    scholarshipName: {
        fontSize: 14,
        color: '#CCCCCC'
    },
    progressContainer: {
        marginTop: 10,
    },
    progressText: {
        fontSize: 14,
    },
    progressBarContainer: {
        borderRadius: 5,
        overflow: 'hidden',
        marginTop: 5,
        justifyContent: 'center',
        alignItems: 'center'
    },

    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    nav: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 15,
        marginLeft: 20,
        marginRight: 20,
        borderTopWidth: 1,
        borderTopColor: 'gray',
        borderTopStyle: 'solid'
    }
});