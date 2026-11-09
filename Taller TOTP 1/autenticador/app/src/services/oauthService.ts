import * as AuthSession from "expo-auth-session";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import axios from "axios";
import { store } from "../state/store";
import { exchangeCodeThunk } from "../state/thunks";
import { signOut } from "../state/userSlice";
import { createPkceChallenge, createPkceVerifier, createState } from "../security/pkce";
import { deleteRefreshToken, getRefreshToken } from "./tokenVault";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://192.168.40.11:4200";
let verifier: string | null = null;
let stateValue: string | null = null;

export let simulateCsrf = false;
export function setSimulateCsrf(value: boolean) {
  simulateCsrf = value;
}

export function redirectUri() {
  return AuthSession.makeRedirectUri({ scheme: "unisabana-auth", path: "oauth/callback" });
}

export async function startLogin() {
  verifier = createPkceVerifier();
  stateValue = createState();
  const challenge = await createPkceChallenge(verifier);
  const redirect = redirectUri();
  const query = new URLSearchParams({
    response_type: "code",
    client_id: "demo",
    redirect_uri: redirect,
    state: stateValue,
    code_challenge: challenge,
    code_challenge_method: "S256"
  });
  const result = await WebBrowser.openAuthSessionAsync(`${API_URL}/auth/oauth/authorize?${query}`, redirect);
  if (result.type === "cancel" || result.type === "dismiss") return null;
  if (result.type !== "success" || !result.url) return null;
  return handleCallback(result.url, store.dispatch);
}

export async function handleCallback(url: string, dispatch = store.dispatch) {
  const parsed = Linking.parse(url);
  const code = typeof parsed.queryParams?.code === "string" ? parsed.queryParams.code : null;
  const returnedState = typeof parsed.queryParams?.state === "string" ? parsed.queryParams.state : null;
  if (simulateCsrf) {
    throw new Error("State inválido: posible ataque CSRF. Se abortó el inicio de sesión.");
  }
  if (!returnedState || returnedState !== stateValue) {
    throw new Error("State inválido: posible ataque CSRF. Se abortó el inicio de sesión.");
  }
  if (!code || !verifier) return null;
  await dispatch(exchangeCodeThunk({ code, verifier }));
  return code;
}

export async function logout() {
  const refreshToken = await getRefreshToken();
  if (refreshToken) {
    try {
      await axios.post(`${API_URL}/auth/logout`, { refresh_token: refreshToken });
    } catch {
      // El cierre local continúa aunque el backend no esté disponible.
    }
  }
  await deleteRefreshToken();
  store.dispatch(signOut());
}
