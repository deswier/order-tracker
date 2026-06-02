import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.family.orders',
  appName: 'Family Orders',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // For local dev with live reload, uncomment and set your machine IP:
    // url: 'http://192.168.x.x:5173',
    // cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
    },
  },
}

export default config
