import axios from 'axios';
import { GOOGLE_API_KEY } from '@env';

export const reverseGeocode = async (latitude, longitude) => {
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}`
    );

    const data = response.data;
    if (data.status === 'OK' && data.results.length > 0) {
      let addressData = {
        formattedAddress: data.results[0].formatted_address,
        houseNo: '',
        city: '',
        state: '',
        pincode: '',
        landmark: '',
        locality: '',
        sublocality: '',
        roadName: ''
      };

      const results = data.results;

      // Robust Landmark Detection (Scanning first 5 results for POIs)
      const landmarkTypesList = [
        'point_of_interest', 'establishment', 'premise', 'place_of_worship',
        'park', 'natural_feature', 'shopping_mall', 'school', 'hospital', 'landmark'
      ];

      for (let i = 0; i < Math.min(results.length, 5); i++) {
        const res = results[i];
        if (res.types.some(t => landmarkTypesList.includes(t))) {
          const poiName = res.address_components[0]?.long_name;
          if (poiName && poiName.length > 2 && !poiName.includes('+')) {
            addressData.landmark = `Near ${poiName}`;
            break;
          }
        }
      }

      // Collect complete information from all results
      let locality = '';
      let district = '';
      let subDistrict = '';

      results.forEach(result => {
        result.address_components.forEach(component => {
          if (component.types.includes('locality') && !locality) locality = component.long_name;
          if (component.types.includes('administrative_area_level_2') && !district) district = component.long_name;
          if (component.types.includes('administrative_area_level_3') && !subDistrict) subDistrict = component.long_name;
          if (component.types.includes('administrative_area_level_1') && !addressData.state) addressData.state = component.long_name;
          if (component.types.includes('postal_code') && !addressData.pincode) addressData.pincode = component.long_name;
          if (component.types.includes('sublocality_level_1') && !addressData.sublocality) addressData.sublocality = component.long_name;
          if (component.types.includes('route') && !addressData.roadName) addressData.roadName = component.long_name;
        });
      });

      // City prioritization (SubDistrict > District > Locality)
      addressData.city = subDistrict || district || locality || 'Mumbai';

      // Deduplicate landmark if redundant
      if (addressData.landmark) {
        const lMark = addressData.landmark.replace('Near ', '').toLowerCase().trim();
        const subLoc = (addressData.sublocality || '').toLowerCase().trim();
        const loc = (locality || '').toLowerCase().trim();
        if (subLoc.includes(lMark) || loc.includes(lMark)) {
          addressData.landmark = '';
        }
      }

      return addressData;
    }

    console.warn('Geocoding Status:', data.status);
    return null;
  } catch (error) {
    console.error('Reverse Geocoding Error:', error);
    return null;
  }
};
