import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {MainMenuComponent} from "./main-menu/main-menu.component";
import {PheComponent} from "./phe/phe.component";
import {NhsOneoneoneComponent} from "./nhs-oneoneone/nhs-oneoneone.component";
import {MorbidityComponent} from "./morbidity/morbidity.component";
import {AboutComponent} from "./about/about.component";


const routes: Routes = [
  { path: '', component: MainMenuComponent,
    children : [
      { path: '', redirectTo: 'morbidity', pathMatch: 'full'},
      { path: 'main', redirectTo: 'phe', pathMatch: 'full'},
      { path: 'morbidity', component: MorbidityComponent},
      { path: 'phe', component: PheComponent},
      { path: 'phe/:region', component: PheComponent},
      { path: 'nhs111', component: NhsOneoneoneComponent},
      { path: 'nhs111/:nhsregion', component: NhsOneoneoneComponent},
      { path: 'about', component: AboutComponent},
    ]}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
