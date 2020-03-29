import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {MainMenuComponent} from "./main-menu/main-menu.component";
import {BodyComponent} from "./body/body.component";


const routes: Routes = [
  { path: '', component: MainMenuComponent,
    children : [
      { path: '', redirectTo: 'main', pathMatch: 'full'},
      { path: 'main', component: BodyComponent}
    ]}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
