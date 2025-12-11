import { Component } from '@angular/core';
import { Routes } from '@angular/router';
import { MainPage } from './login/main-page/main-page';
import { Contacts } from './login/main-page/contacts/contacts';
import { Board } from './login/main-page/board/board';
import { AddTask } from './login/main-page/add-task/add-task';
import { Summary } from './login/main-page/summary/summary';
import { PrivacyPolicy } from './login/main-page/privacy-policy/privacy-policy';
import { LegalNotice } from './login/main-page/legal-notice/legal-notice';
import { Helper } from './login/main-page/helper/helper';

export const routes: Routes = [
    
    {path:"contacs",component:Contacts},
    {path:"board",component:Board},
    {path:"add-task",component:AddTask},
    {path:"summary",component:Summary},
    {path:"Privacy Policy",component:PrivacyPolicy},
    {path:"Legal notice",component:LegalNotice},
    {path:"Helper",component:Helper},

    
];
