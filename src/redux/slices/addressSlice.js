import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const fetchAddresses = createAsyncThunk(
  'address/fetchAddresses',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/users/profile');
      return response.data.addresses;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const addAddressAsync = createAsyncThunk(
  'address/addAddressAsync',
  async (addressData, { rejectWithValue }) => {
    try {
      const response = await api.post('/users/addresses', addressData);
      return response.data.addresses;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateAddressAsync = createAsyncThunk(
  'address/updateAddressAsync',
  async ({ addressId, addressData }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/users/addresses/${addressId}`, addressData);
      return response.data.addresses;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteAddressAsync = createAsyncThunk(
  'address/deleteAddressAsync',
  async (addressId, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/users/addresses/${addressId}`);
      return response.data.addresses;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const setDefaultAddressAsync = createAsyncThunk(
  'address/setDefaultAddressAsync',
  async (addressId, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/users/addresses/${addressId}/default`);
      return response.data.addresses;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const initialState = {
  addresses: [],
  selectedAddress: null, // User can manually select an address
  currentLocation: {
    city: 'Mumbai',
    pincode: '400001'
  },
  loading: false,
  error: null,
};

const addressSlice = createSlice({
  name: 'address',
  initialState,
  reducers: {
    setAddresses: (state, action) => {
      state.addresses = action.payload;
    },
    addAddress: (state, action) => {
      state.addresses.push(action.payload);
    },
    updateAddress: (state, action) => {
      const index = state.addresses.findIndex(addr => addr.id === action.payload.id);
      if (index !== -1) {
        state.addresses[index] = action.payload;
      }
    },
    setDefaultAddress: (state, action) => {
      state.addresses = state.addresses.map(addr => ({
        ...addr,
        isDefault: addr.id === action.payload
      }));
    },
    setSelectedAddress: (state, action) => {
      state.selectedAddress = action.payload;
    },
    setCurrentLocation: (state, action) => {
      state.currentLocation = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchAddresses.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAddresses.fulfilled, (state, action) => {
        state.loading = false;
        state.addresses = action.payload;
      })
      .addCase(fetchAddresses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add
      .addCase(addAddressAsync.fulfilled, (state, action) => {
        state.addresses = action.payload;
      })
      // Update
      .addCase(updateAddressAsync.fulfilled, (state, action) => {
        state.addresses = action.payload;
      })
      // Delete
      .addCase(deleteAddressAsync.fulfilled, (state, action) => {
        state.addresses = action.payload;
      })
      // Default
      .addCase(setDefaultAddressAsync.fulfilled, (state, action) => {
        state.addresses = action.payload;
      });
  },
});

export const { 
  setAddresses, 
  addAddress, 
  updateAddress, 
  setDefaultAddress, 
  setSelectedAddress,
  setCurrentLocation 
} = addressSlice.actions;

export default addressSlice.reducer;
