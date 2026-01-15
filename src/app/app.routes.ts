import { Routes } from '@angular/router';
import { Login } from './login/login';

/**
 * Application Routing Configuration
 * 
 * Defines all routes for the application with lazy-loaded components for optimal
 * performance. Routes are organized into two main sections: unauthenticated (login)
 * and authenticated (main application).
 * 
 * Route Structure:
 * 
 * Unauthenticated Routes:
 * - /Login - User authentication page (login, signup, guest access)
 * - / - Redirects to /Login
 * 
 * Authenticated Routes (children of MainPage):
 * - /summary - Dashboard/summary view
 * - /contacts - Contact management
 * - /board - Task board/kanban view
 * - /add-task - Task creation form
 * - /Privacy Policy - Privacy policy information
 * - /Legal notice - Legal notice information
 * - /helper - Application help/tutorial
 * 
 * All authenticated routes use lazy loading for code splitting and faster initial load times.
 * 
 * @constant
 * @type {Routes}
 * 
 * @example
 * // Used in app.config.ts
 * provideRouter(routes)
 */
export const routes: Routes = [
  { path: '', redirectTo: 'Login', pathMatch: 'full' },
  { path: 'Login', component: Login },
  {
    path: '',
    loadComponent: () => import('./login/main-page/main-page').then(c => c.MainPage),
    children: [
      { path: 'contacts', loadComponent: () => import('./login/main-page/contacts/contacts').then(c => c.Contacts) },
      { path: 'board', loadComponent: () => import('./login/main-page/board/board').then(c => c.Board) },
      { path: 'summary', loadComponent: () => import('./login/main-page/summary/summary').then(c => c.Summary) },
      { path: 'Privacy Policy', loadComponent: () => import('./login/main-page/privacy-policy/privacy-policy').then(c => c.PrivacyPolicy) },
      { path: 'Legal notice', loadComponent: () => import('./login/main-page/legal-notice/legal-notice').then(c => c.LegalNotice) },
      { path: 'add-task', loadComponent: () => import('./login/main-page/add-task/add-task').then(c => c.AddTask) },
      { path: 'helper', loadComponent: () => import('./login/main-page/helper/helper').then(c => c.Helper) }
    ]
  }
];
