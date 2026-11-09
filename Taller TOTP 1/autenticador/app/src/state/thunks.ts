import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { getRefreshToken, saveRefreshToken } from "../services/tokenVault";
import type { LastVerification } from "./userSlice";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://192.168.40.11:4200";

interface ExchangeInput {
  code: string;
  verifier: string;
}

export const exchangeCodeThunk = createAsyncThunk<
  { access_token: string; elevatedToken?: string; stepUpToken: string | null; user: string },
  ExchangeInput,
  { rejectValue: string }
>("user/exchangeCode", async ({ code, verifier }, { rejectWithValue }) => {
  try {
    const response = await axios.post(`${API_URL}/auth/oauth/token`, {
      grant_type: "authorization_code",
      code,
      code_verifier: verifier,
      redirect_uri: "unisabana-auth://oauth/callback",
      client_id: "demo"
    });
    if (response.data.refresh_token) {
      await saveRefreshToken(response.data.refresh_token);
    }
    const profile = await axios.get(`${API_URL}/api/perfil`, {
      headers: { Authorization: `Bearer ${response.data.access_token}` }
    });
    return {
      access_token: response.data.access_token,
      elevatedToken: response.data.elevated_token,
      stepUpToken: response.data.step_up_token ?? null,
      user: profile.data.email ?? profile.data.usuario ?? "demo"
    };
  } catch {
    return rejectWithValue("No se pudo intercambiar el codigo OAuth.");
  }
});

export const restoreSessionThunk = createAsyncThunk<
  { accessToken: string | null; stepUpToken: string | null; user: string },
  void,
  { rejectValue: string }
>("user/restoreSession", async (_arg, { rejectWithValue }) => {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    return rejectWithValue("No hay sesion guardada.");
  }
  try {
    const response = await axios.post(`${API_URL}/auth/refresh`, {
      refresh_token: refreshToken
    });
    await saveRefreshToken(response.data.refresh_token);
    const profile = await axios.get(`${API_URL}/api/perfil`, {
      headers: { Authorization: `Bearer ${response.data.access_token}` }
    });
    return {
      accessToken: response.data.access_token,
      stepUpToken: response.data.step_up_token ?? null,
      user: profile.data.email ?? profile.data.usuario ?? "demo"
    };
  } catch {
    return rejectWithValue("No se pudo restaurar la sesion.");
  }
});

export interface MfaInput {
  step_up_token: string;
  code: string;
}

export const verifyMfaThunk = createAsyncThunk<
  { elevatedToken: string; lastVerification: LastVerification },
  MfaInput,
  { rejectValue: string }
>("user/verifyMfa", async ({ step_up_token, code }, { rejectWithValue }) => {
  try {
    const response = await axios.post(`${API_URL}/auth/mfa/verify`, {
      step_up_token,
      totp: code
    });
    return {
      elevatedToken: response.data.elevated_token,
      lastVerification: { step_up_token, code, at: Date.now() }
    };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      return rejectWithValue("Codigo incorrecto o vencido.");
    }
    if (axios.isAxiosError(error) && error.response?.status === 409) {
      return rejectWithValue("Ataque de repeticion detectado (409): este codigo ya fue usado.");
    }
    return rejectWithValue("No se pudo verificar el codigo.");
  }
});
