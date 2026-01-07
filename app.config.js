import 'dotenv/config';
import { supabase } from './src/lib/supabase';

export default {
  expo: {
    scheme: "WhatPlant",
    name: "WhatPlant",
    slug: "WhatPlant",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/plant.jpg",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    data: [

      {
        scheme: "WhatPlant",
        host: "login-callback"
      }
    ],
    category: ["BROWSABLE", "DEFAULT"],
    extra: {
      plantIdApiKey: 'your-plant-id-api-key',
      supabaseKey: process.env.supabasekey,
      supabaseUrl: process.env.supabaseUrl,
      eas: {
        projectId: "your-unique-project-id"}
    },
    splash: {
      image: "./assets/plant.jpg",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      bundleIdentifier: "com.brbrbr.whatplant",
      supportsTablet: true
    },
    android: {
      
      package: "com.brbrbr.whatplant",
      adaptiveIcon: {
        foregroundImage: "./assets/plant.jpg",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      softwareKeyboardLayoutMode: "pan",
    },
    web: {
      favicon: "./assets/plant.jpg"
    },
    plugins : ["@react-native-google-signin/google-signin"],

  }
};



      