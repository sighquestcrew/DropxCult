import { createSlice } from "@reduxjs/toolkit";

interface UiState {
    hasAppNavigation: boolean;
}

const initialState: UiState = {
    hasAppNavigation: false,
};

const uiSlice = createSlice({
    name: "ui",
    initialState,
    reducers: {
        setHasAppNavigation: (state, action) => {
            state.hasAppNavigation = action.payload;
        },
    },
});

export const { setHasAppNavigation } = uiSlice.actions;
export default uiSlice.reducer;
