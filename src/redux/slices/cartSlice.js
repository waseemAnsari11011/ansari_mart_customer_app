import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { calculateProductPrice } from '../../utils/pricing';
import api from '../../utils/api';

// --- Thunks for Backend Cart Synchronization ---

export const fetchCartThunk = createAsyncThunk('cart/fetchCart', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/users/cart');
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || error.message);
  }
});
export const addToCartThunk = createAsyncThunk('cart/addToCart', async ({ product, quantity, isWholesale, tierIndex }, { rejectWithValue }) => {
  try {
    const response = await api.post('/users/cart', {
      productId: product._id,
      quantity,
      isWholesale,
      tierIndex
    });
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || error.message);
  }
});

export const addBulkToCartThunk = createAsyncThunk('cart/addBulkToCart', async ({ items }, { rejectWithValue }) => {
  try {
    const response = await api.post('/users/cart/bulk', { items });
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || error.message);
  }
});

export const updateCartQtyThunk = createAsyncThunk('cart/updateQty', async ({ productId, quantity, tierIndex }, { rejectWithValue }) => {
  try {
    const response = await api.put(`/users/cart/${productId}`, { quantity, tierIndex });
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || error.message);
  }
});

export const removeFromCartThunk = createAsyncThunk('cart/removeFromCart', async ({ productId, tierIndex }, { rejectWithValue }) => {
  try {
    const response = await api.delete(`/users/cart/${productId}`, { params: { tierIndex } });
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || error.message);
  }
});

export const clearCartThunk = createAsyncThunk('cart/clearCart', async (_, { rejectWithValue }) => {
  try {
    const response = await api.delete('/users/cart');
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || error.message);
  }
});

const initialState = {
  cartItems: [],
  loading: false,
  error: null,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    // Keep local fallback clear just in case
    clearCartLocal: (state) => {
      state.cartItems = [];
    },
    setCartLocal: (state, action) => {
      state.cartItems = action.payload;
    }
  },
  extraReducers: (builder) => {
    // Common handler for fulfilled cart states
    const handleCartUpdate = (state, action) => {
      state.loading = false;
      state.cartItems = action.payload || [];
      state.error = null;
    };

    builder
      // Fetch
      .addCase(fetchCartThunk.pending, (state) => { state.loading = true; })
      .addCase(fetchCartThunk.fulfilled, handleCartUpdate)
      .addCase(fetchCartThunk.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      // Add
      .addCase(addToCartThunk.pending, (state) => { state.loading = true; })
      .addCase(addToCartThunk.fulfilled, handleCartUpdate)
      .addCase(addToCartThunk.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      // Add Bulk
      .addCase(addBulkToCartThunk.pending, (state) => { state.loading = true; })
      .addCase(addBulkToCartThunk.fulfilled, handleCartUpdate)
      .addCase(addBulkToCartThunk.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      // Update Qty
      .addCase(updateCartQtyThunk.pending, (state) => { state.loading = true; })
      .addCase(updateCartQtyThunk.fulfilled, handleCartUpdate)
      .addCase(updateCartQtyThunk.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      // Remove
      .addCase(removeFromCartThunk.pending, (state) => { state.loading = true; })
      .addCase(removeFromCartThunk.fulfilled, handleCartUpdate)
      .addCase(removeFromCartThunk.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      // Clear
      .addCase(clearCartThunk.pending, (state) => { state.loading = true; })
      .addCase(clearCartThunk.fulfilled, handleCartUpdate)
      .addCase(clearCartThunk.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  }
});

export const { clearCartLocal, setCartLocal } = cartSlice.actions;

// Selector to get cart total with tiered pricing
export const selectCartTotal = (state) => {
  return state.cart.cartItems.reduce((total, item) => {
    // Ensure product object exists before calculation
    if (!item.product) return total;
    const unitPrice = calculateProductPrice(item.product, item.quantity, item.isWholesale, item.tierIndex || 0);
    return total + unitPrice * item.quantity;
  }, 0);
};

export default cartSlice.reducer;
