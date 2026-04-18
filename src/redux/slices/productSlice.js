import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  categories: [],
  products: [],
  pagination: {
    page: 1,
    pages: 1,
    total: 0,
    hasMore: true
  },
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
      // Handle both old array format and new paginated object format
      if (Array.isArray(action.payload)) {
        state.products = action.payload;
        state.pagination = { ...initialState.pagination, hasMore: false };
      } else {
        const { products, page, pages, total } = action.payload;
        if (page === 1) {
          state.products = products;
        } else {
          // Append products, filtering out duplicates by _id just in case
          const existingIds = new Set(state.products.map(p => p._id));
          const uniqueNewProducts = products.filter(p => !existingIds.has(p._id));
          state.products = [...state.products, ...uniqueNewProducts];
        }
        state.pagination = {
          page,
          pages,
          total,
          hasMore: page < pages
        };
      }
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
