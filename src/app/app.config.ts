import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

/**
 * Angular Application Configuration
 * 
 * Central configuration for the entire Angular application. Initializes Firebase backend,
 * configures routing, and sets up change detection strategy. This config is passed to the
 * bootstrapApplication() function during application startup.
 * 
 * Configuration Includes:
 * - Firebase initialization with project credentials
 * - Authentication (Auth) provider
 * - Firestore database provider
 * - Application routing with lazy-loaded routes
 * - Global error listening for unhandled errors
 * - Zoneless change detection for optimal performance
 * 
 * Firebase Project: join-db-ee5a8
 * 
 * @constant
 * @type {ApplicationConfig}
 * 
 * @example
 * // Used in main.ts
 * bootstrapApplication(App, appConfig)
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideFirebaseApp(() =>
      initializeApp({
        projectId: 'join-db-ee5a8',
        appId: '1:1071337539188:web:a82b5c20d18417d9423321',
        storageBucket: 'join-db-ee5a8.firebasestorage.app',
        apiKey: 'AIzaSyBDbp41sPTcemNlIZoP9lyE037AktuztqY',
        authDomain: 'join-db-ee5a8.firebaseapp.com',
        messagingSenderId: '1071337539188',
      })
    ),
    provideFirestore(() => getFirestore()),
    provideAuth(() => getAuth()),
  ],
};
