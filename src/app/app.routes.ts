;
import { Contacts } from './login/main-page/contacts/contacts';
import { Board } from './login/main-page/board/board';
import { Summary } from './login/main-page/summary/summary';
import { PrivacyPolicy } from './login/main-page/privacy-policy/privacy-policy';
import { LegalNotice } from './login/main-page/legal-notice/legal-notice';
import { Helper } from './login/main-page/helper/helper';
import { Login } from './login/login';
import { Routes } from '@angular/router';
import { MainPage } from './login/main-page/main-page';

export const routes: Routes = [


    { path: '', redirectTo: 'Login', pathMatch: 'full' },
  // 🔓 Öffentlich
  { path: 'Login', component: Login },

  // 🔒 Nach Login (mit Navbar/Header)
  {
    path: '',
    component:MainPage ,
    children: [
      { path: 'contacs', component: Contacts },
      { path: 'board', component: Board },
      { path: 'summary', component: Summary },
      { path: 'Privacy Policy', component: PrivacyPolicy },
      { path: 'Legal notice', component: LegalNotice },
      { path: 'Helper', component: Helper },
      {
        path: 'add-task',
        loadComponent: () =>
          import('./login/main-page/add-task/add-task')
            .then(c => c.AddTask)
      }
    ]
  }
];
