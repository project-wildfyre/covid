import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {MainMenuComponent} from "./main-menu/main-menu.component";
import {BodyComponent} from "./body/body.component";
import {NhsOneoneoneComponent} from "./nhs-oneoneone/nhs-oneoneone.component";


const routes: Routes = [
  { path: '', component: MainMenuComponent,
    children : [
      { path: '', redirectTo: 'phe', pathMatch: 'full'},
      { path: 'main', redirectTo: 'phe', pathMatch: 'full'},
      { path: 'phe', component: BodyComponent},
      { path: 'nhs111', component: NhsOneoneoneComponent}
    ]}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
