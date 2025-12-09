import { Component } from '@angular/core';
import { Routes } from '@angular/router';
import { MainPage } from './login/main-page/main-page';
import { Contacts } from './login/main-page/contacts/contacts';
import { Board } from './login/main-page/board/board';
import { AddTask } from './login/main-page/add-task/add-task';
import { Summary } from './login/main-page/summary/summary';

export const routes: Routes = [
    {path:"",component:MainPage},
    {path:"contacs",component:Contacts},
    {path:"board",component:Board},
    {path:"add-task",component:AddTask},
    {path:"summary",component:Summary}

    
];
