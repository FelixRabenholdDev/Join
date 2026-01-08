

import { Login } from './login/login';
import { Routes } from '@angular/router';
import { MainPage } from './login/main-page/main-page';

export const routes: Routes = [


    { path: '', redirectTo: 'Login', pathMatch: 'full' },
  
  { path: 'Login', component: Login },


  {
    path: '',
    component:MainPage ,
    children: [
      { path: 'contacs', loadComponent:() =>import('./login/main-page/contacts/contacts').then(c =>c.Contacts) },
      { path: 'board', loadComponent:() =>import('./login/main-page/board/board').then(c => c.Board) },
      { path: 'summary',loadComponent:() =>import('./login/main-page/summary/summary').then(c => c.Summary)},
      { path: 'Privacy Policy',loadComponent:() =>import('./login/main-page/privacy-policy/privacy-policy').then( c => c.PrivacyPolicy) },
      { path: 'Legal notice',loadComponent:() =>import('./login/main-page/legal-notice/legal-notice').then( c => c.LegalNotice)},
      { path: 'Helper',loadComponent: () =>import('./login/main-page/add-task/add-task').then(c => c.AddTask)},
      { path: 'add-task',loadComponent: () =>import('./login/main-page/add-task/add-task').then(c => c.AddTask),
        
      }
    ]
  }
]

