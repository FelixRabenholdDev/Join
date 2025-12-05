import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes), provideFirebaseApp(() => initializeApp({ projectId: "join-db-ee5a8", appId: "1:1071337539188:web:a82b5c20d18417d9423321", storageBucket: "join-db-ee5a8.firebasestorage.app", apiKey: "AIzaSyBDbp41sPTcemNlIZoP9lyE037AktuztqY", authDomain: "join-db-ee5a8.firebaseapp.com", messagingSenderId: "1071337539188", projectNumber: "1071337539188", version: "2" })), provideFirestore(() => getFirestore())
  ]
};
