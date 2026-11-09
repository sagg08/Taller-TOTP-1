import { Redirect } from "expo-router";
import { useAppSelector } from "../state/hooks";

export default function Index() {
  const accessToken = useAppSelector((state) => state.user.accessToken);
  return <Redirect href={accessToken ? "/(tabs)" : "/login"} />;
}
