import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {MainMenuComponent} from "./main-menu/main-menu.component";
import {PheComponent} from "./phe/phe.component";
import {NhsOneoneoneComponent} from "./nhs-oneoneone/nhs-oneoneone.component";


const routes: Routes = [
  { path: '', component: MainMenuComponent,
    children : [
      { path: '', redirectTo: 'phe', pathMatch: 'full'},
      { path: 'main', redirectTo: 'phe', pathMatch: 'full'},
      { path: 'phe', component: PheComponent},
      { path: 'phe/:region', component: PheComponent},
      { path: 'nhs111', component: NhsOneoneoneComponent},
      { path: 'nhs111/:nhsregion', component: NhsOneoneoneComponent}
    ]}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
