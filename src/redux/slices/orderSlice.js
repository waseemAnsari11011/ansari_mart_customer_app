import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  orders: [],
  loading: false,
  lastFetched: null,
  error: null,
};

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setOrders: (state, action) => {
      state.orders = action.payload;
      state.lastFetched = Date.now();
    },
    addOrder: (state, action) => {
      state.orders = [action.payload, ...state.orders];
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearOrders: (state) => {
      state.orders = [];
      state.lastFetched = null;
    }
  },
});

export const { setOrders, addOrder, setLoading, setError, clearOrders } = orderSlice.actions;

export default orderSlice.reducer;
