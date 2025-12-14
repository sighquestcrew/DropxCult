import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// 1. Update the Interface to include 'image'
interface UserInfo {
  _id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  token: string;
  image?: string; // <--- ADD THIS (Optional string)
}

interface AuthState {
  userInfo: UserInfo | null;
}

// Use separate localStorage key for store auth (security isolation)
const STORE_STORAGE_KEY = "storeUserInfo";

const initialState: AuthState = {
  // Check localStorage safely
  userInfo: typeof window !== "undefined" && localStorage.getItem(STORE_STORAGE_KEY)
    ? JSON.parse(localStorage.getItem(STORE_STORAGE_KEY)!)
    : null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<UserInfo>) => {
      state.userInfo = action.payload;
      // Persist to localStorage
      localStorage.setItem(STORE_STORAGE_KEY, JSON.stringify(action.payload));
    },
    logout: (state) => {
      state.userInfo = null;
      localStorage.removeItem(STORE_STORAGE_KEY);
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;