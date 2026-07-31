import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.amyjuliet.dosejournal',
  appName: 'DoseJournal',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  ios: {
    minVersion: '13.0'
  }
};

export default config;
