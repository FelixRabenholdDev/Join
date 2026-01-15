import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

/**
 * Application Bootstrap Entry Point
 * 
 * Main entry file for the Angular application. Bootstraps the App component
 * with the configured application settings. This is the first code executed
 * when the application starts.
 * 
 * Process:
 * 1. Imports App root component
 * 2. Imports appConfig with all providers
 * 3. Bootstraps App with platformBrowser
 * 4. Initializes Firebase, routing, and all services
 * 
 * Configuration:
 * - App component: Root component
 * - appConfig: Contains all providers (Firebase, routing, Angular config)
 * - Error handling: Logs any bootstrap errors to console
 */
bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
