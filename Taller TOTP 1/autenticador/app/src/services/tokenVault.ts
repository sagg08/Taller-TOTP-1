import * as SecureStore from "expo-secure-store";

const REFRESH_KEY = "totp.refresh_token";
const TOTP_SECRET_KEY = "totp.secret";
const TOTP_QR_ACCOUNT_KEY = "totp.qr_account";

export async function saveRefreshToken(token: string) {
  await SecureStore.setItemAsync(REFRESH_KEY, token);
}

export async function getRefreshToken() {
  return SecureStore.getItemAsync(REFRESH_KEY);
}

export async function deleteRefreshToken() {
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}

export async function saveTotpSecret(secret: string) {
  await SecureStore.setItemAsync(TOTP_SECRET_KEY, secret);
}

export async function getTotpSecret() {
  return SecureStore.getItemAsync(TOTP_SECRET_KEY);
}

export async function deleteTotpSecret() {
  await SecureStore.deleteItemAsync(TOTP_SECRET_KEY);
}

export async function saveTotpQrAccount(account: string) {
  await SecureStore.setItemAsync(TOTP_QR_ACCOUNT_KEY, account);
}

export async function getTotpQrAccount() {
  return SecureStore.getItemAsync(TOTP_QR_ACCOUNT_KEY);
}

export async function deleteTotpQrAccount() {
  await SecureStore.deleteItemAsync(TOTP_QR_ACCOUNT_KEY);
}
