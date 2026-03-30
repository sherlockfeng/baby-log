// 本机调试用 localhost；真机/模拟器需用电脑局域网 IP，例如 EXPO_PUBLIC_API_URL=http://10.73.226.151:8787
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:8787";
