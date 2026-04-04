import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  categories: [],
  products: [],
  banners: [],
  loading: false,
  error: null,
};

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setCategories: (state, action) => {
      state.categories = action.payload;
    },
    setProducts: (state, action) => {
      state.products = action.payload;
    },
    setBanners: (state, action) => {
      state.banners = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const { setCategories, setProducts, setBanners, setLoading, setError } = productSlice.actions;

export default productSlice.reducer;
