import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface CartItem {
  id: string; // Product ID or Custom Design ID
  name: string;
  slug: string; // For custom, we can use 'custom-design-id'
  price: number;
  image: string;
  size: string;
  qty: number;
  // 👇 NEW FIELDS
  isCustom?: boolean;
  designId?: string; // Specific reference to the CustomRequest collection
}

interface CartState {
  items: CartItem[];
  itemsPrice: number;
  taxPrice: number;
  shippingPrice: number;
  totalPrice: number;
}

const initialState: CartState = {
  items: [],
  itemsPrice: 0,
  taxPrice: 0,
  shippingPrice: 0,
  totalPrice: 0,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const item = action.payload;

      // Check if item exists (match ID and Size)
      const existItem = state.items.find((x) => x.id === item.id && x.size === item.size);

      if (existItem) {
        state.items = state.items.map((x) =>
          x.id === existItem.id && x.size === existItem.size ? item : x
        );
      } else {
        state.items = [...state.items, item];
      }

      // Recalculate Totals
      state.itemsPrice = state.items.reduce((acc, item) => acc + item.price * item.qty, 0);
      state.totalPrice = state.itemsPrice; // Add tax/shipping logic here if needed
    },
    removeFromCart: (state, action: PayloadAction<{ id: string, size: string }>) => {
      state.items = state.items.filter((x) => !(x.id === action.payload.id && x.size === action.payload.size));

      // Recalculate Totals
      state.itemsPrice = state.items.reduce((acc, item) => acc + item.price * item.qty, 0);
      state.totalPrice = state.itemsPrice;
    },
    // Optional: Clear cart after successful payment
    clearCart: (state) => {
      state.items = [];
      state.itemsPrice = 0;
      state.totalPrice = 0;
    }
  },
});

export const { addToCart, removeFromCart, clearCart } = cartSlice.actions;
export default cartSlice.reducer;