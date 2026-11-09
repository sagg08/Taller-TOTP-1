import { createSlice } from "@reduxjs/toolkit";
import { restoreSessionThunk, exchangeCodeThunk, verifyMfaThunk } from "./thunks";

export interface LastVerification {
  step_up_token: string;
  code: string;
  at: number;
}

export interface UserState {
  accessToken: string | null;
  elevatedToken: string | null;
  stepUpToken: string | null;
  lastVerification: LastVerification | null;
  user: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  accessToken: null,
  elevatedToken: null,
  stepUpToken: null,
  lastVerification: null,
  user: null,
  loading: false,
  error: null
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    signOut(state) {
      state.accessToken = null;
      state.elevatedToken = null;
      state.stepUpToken = null;
      state.lastVerification = null;
      state.user = null;
      state.loading = false;
      state.error = null;
    },
    setAccessToken(state, action: { payload: string }) {
      state.accessToken = action.payload;
    },
    clearElevatedToken(state) {
      state.elevatedToken = null;
    },
    setStepUpToken(state, action: { payload: string }) {
      state.stepUpToken = action.payload;
    }
  },
  extraReducers(builder) {
    builder
      .addCase(exchangeCodeThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(exchangeCodeThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.accessToken = action.payload.access_token;
        state.elevatedToken = null;
        state.stepUpToken = action.payload.stepUpToken;
        state.user = action.payload.user;
      })
      .addCase(exchangeCodeThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? action.error.message ?? "No se pudo iniciar sesión";
      })
      .addCase(restoreSessionThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(restoreSessionThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.accessToken = action.payload.accessToken;
        state.stepUpToken = action.payload.stepUpToken;
        state.user = action.payload.user;
      })
      .addCase(restoreSessionThunk.rejected, (state) => {
        state.loading = false;
      })
      .addCase(verifyMfaThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyMfaThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.elevatedToken = action.payload.elevatedToken;
        state.lastVerification = action.payload.lastVerification;
      })
      .addCase(verifyMfaThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? action.error.message ?? "No se pudo verificar el código.";
      });
  }
});

export const { signOut, setAccessToken, clearElevatedToken, setStepUpToken } = userSlice.actions;
export default userSlice.reducer;
