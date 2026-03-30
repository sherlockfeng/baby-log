export interface ThemeColors {
  background: string;
  backgroundSecondary: string;
  primary: string;
  primaryDark: string;
  text: string;
  textSecondary: string;
  placeholder: string;
  border: string;
  card: string;
  error: string;
  success: string;
  link: string;
}

export const darkColors: ThemeColors = {
  background: "#0D0B12",
  backgroundSecondary: "#1A1625",
  primary: "#B8A4E6",
  primaryDark: "#8B7BC4",
  text: "#FFFFFF",
  textSecondary: "#B8B0C8",
  placeholder: "#7A7290",
  border: "#2D2842",
  card: "#1E1B2E",
  error: "#E57373",
  success: "#81C784",
  link: "#B8A4E6",
};

export const lightColors: ThemeColors = {
  background: "#F5F3FA",
  backgroundSecondary: "#FFFFFF",
  primary: "#7C5CBF",
  primaryDark: "#5A3D99",
  text: "#1A1625",
  textSecondary: "#6B6180",
  placeholder: "#A09AB0",
  border: "#DDD8E8",
  card: "#FFFFFF",
  error: "#D32F2F",
  success: "#388E3C",
  link: "#7C5CBF",
};

/** Default export — dark theme colors (backwards compatible) */
export const colors = darkColors;

export const spacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
};

export const borderRadius = {
  input: 12,
  button: 9999,
  logo: 9999,
  card: 16,
};

export const shadow = {
  primary: {
    shadowColor: "#B8A4E6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
};
