import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UserInfo {
    _id: string;
    name: string;
    email: string;
    isAdmin: boolean;
    token?: string; // Optional now, since we use HttpOnly cookies
    image?: string;
}

interface AuthState {
    userInfo: UserInfo | null;
}

// Use separate localStorage key for admin auth (security isolation)
const ADMIN_STORAGE_KEY = "adminUserInfo";

const initialState: AuthState = {
    userInfo: typeof window !== "undefined" && localStorage.getItem(ADMIN_STORAGE_KEY)
        ? JSON.parse(localStorage.getItem(ADMIN_STORAGE_KEY)!)
        : null,
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setCredentials: (state, action: PayloadAction<UserInfo>) => {
            state.userInfo = action.payload;
            localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(action.payload));
        },
        logout: (state) => {
            state.userInfo = null;
            localStorage.removeItem(ADMIN_STORAGE_KEY);
        },
    },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;

