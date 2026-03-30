import AsyncStorage from "@react-native-async-storage/async-storage";

const NICKNAME_KEY = "babylog_profile_nickname";
const AVATAR_KEY = "babylog_profile_avatar_uri";

export interface UserProfile {
  nickname: string;
  avatarUri: string;
}

export async function getProfile(): Promise<UserProfile> {
  const [nickname, avatarUri] = await Promise.all([
    AsyncStorage.getItem(NICKNAME_KEY),
    AsyncStorage.getItem(AVATAR_KEY),
  ]);
  return { nickname: nickname ?? "", avatarUri: avatarUri ?? "" };
}

export async function setNickname(nickname: string): Promise<void> {
  await AsyncStorage.setItem(NICKNAME_KEY, nickname);
}

export async function setAvatarUri(uri: string): Promise<void> {
  await AsyncStorage.setItem(AVATAR_KEY, uri);
}
