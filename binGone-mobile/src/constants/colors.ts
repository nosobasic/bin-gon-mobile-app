export const colors = {
  primary: '#00705C',
  secondary: '#FFAC00',
  // Additional colors for consistency
  white: '#FFFFFF',
  black: '#000000',
  lightGray: '#F5F5F5',
  red: '#FF3B30',
  lightGreen: '#E8F5E8',
  lightOrange: '#FFF3E0',
  lightBlue: '#E3F2FD',
  lightPurple: '#F3E5F5',
  blue: '#2196F3',
  purple: '#9C27B0',
 
  gray: {
    light: '#F5F5F5',
    medium: '#666666',
    dark: '#333333',
    textInputBg: "#F6F6F6",
    textInputIcon: "#292D32",
    borderGray: "#A2A2A2"
  },
  text: {
    black: "#151414",
    gray: "#686565"
  },
  background: {
    primary: '#FFFFFF',
    secondary: '#F5F5F5',
    gray: '#D9D9D9'
  },
} as const;

export type Colors = typeof colors; 