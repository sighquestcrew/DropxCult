import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface EditorState {
    tshirtType: 'regular' | 'oversized';
    tshirtColor: string;
    canvasJson: object | null;
    isDirty: boolean; // Tracking if changes are unsaved
}

const initialState: EditorState = {
    tshirtType: 'regular',
    tshirtColor: '#ffffff',
    canvasJson: null,
    isDirty: false,
};

export const editorSlice = createSlice({
    name: 'editor',
    initialState,
    reducers: {
        setTshirtType: (state, action: PayloadAction<'regular' | 'oversized'>) => {
            state.tshirtType = action.payload;
            state.isDirty = true;
        },
        setTshirtColor: (state, action: PayloadAction<string>) => {
            state.tshirtColor = action.payload;
            state.isDirty = true;
        },
        setCanvasJson: (state, action: PayloadAction<object>) => {
            state.canvasJson = action.payload;
            state.isDirty = true;
        },
        markSaved: (state) => {
            state.isDirty = false;
        },
        resetEditor: () => initialState,
    },
});

export const { setTshirtType, setTshirtColor, setCanvasJson, markSaved, resetEditor } = editorSlice.actions;

export default editorSlice.reducer;
