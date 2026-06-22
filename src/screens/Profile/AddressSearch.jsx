import React, { useState } from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    Text,
    FlatList,
    ActivityIndicator,
    StyleSheet,
} from 'react-native';

import { GOOGLE_API_KEY } from '@env';

const AddressSearch = ({ onAddressSelect }) => {
    const [searchText, setSearchText] = useState('');
    const [predictions, setPredictions] = useState([]);
    const [loading, setLoading] = useState(false);

    const searchAddress = async text => {
        setSearchText(text);

        if (text.trim().length < 3) {
            setPredictions([]);
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(
                `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
                    text,
                )}&components=country:in&key=${GOOGLE_API_KEY}`,
            );

            const data = await response.json();

            setPredictions(data.predictions || []);
        } catch (error) {
            console.log('Autocomplete Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const getAddressComponent = (components, type) => {
        const component = components.find(item =>
            item.types.includes(type),
        );

        return component ? component.long_name : '';
    };

    const selectPlace = async placeId => {
        try {
            setLoading(true);

            const response = await fetch(
                `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_API_KEY}`,
            );

            const data = await response.json();

            const place = data.result;

            const latitude = place.geometry.location.lat;
            const longitude = place.geometry.location.lng;

            const city = getAddressComponent(
                place.address_components,
                'locality',
            );

            const state = getAddressComponent(
                place.address_components,
                'administrative_area_level_1',
            );

            const pincode = getAddressComponent(
                place.address_components,
                'postal_code',
            );

            const address = place.formatted_address;

            setSearchText(address);
            setPredictions([]);

            onAddressSelect({
                address,
                city,
                state,
                pincode,
                latitude,
                longitude,
            });
        } catch (error) {
            console.log('Place Details Error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <TextInput
                placeholder="Search Address..."
                value={searchText}
                onChangeText={searchAddress}
                style={styles.input}
            />

            {loading && (
                <ActivityIndicator
                    size="small"
                    style={{ marginTop: 10 }}
                />
            )}

            {predictions.length > 0 && (
                <View style={styles.suggestionContainer}>
                    {predictions.map(item => (
                        <TouchableOpacity
                            key={item.place_id}
                            style={styles.suggestionItem}
                            onPress={() => selectPlace(item.place_id)}
                        >
                            <Text>{item.description}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
};

export default AddressSearch;

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },
    input: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    suggestionItem: {
        padding: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
});