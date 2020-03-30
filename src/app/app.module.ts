import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { CovalentLayoutModule } from '@covalent/core/layout';
import { CovalentStepsModule  } from '@covalent/core/steps';
/* any other core modules */
import {CovalentMediaModule} from "@covalent/core/media";
import {MatSidenavModule} from "@angular/material/sidenav";
import {MatTooltipModule} from "@angular/material/tooltip";
import {MatGridListModule} from "@angular/material/grid-list";
import {MatRadioModule} from "@angular/material/radio";
import {MatNativeDateModule, MatRippleModule} from "@angular/material/core";
import {MatSliderModule} from "@angular/material/slider";
import {MatAutocompleteModule} from "@angular/material/autocomplete";
import {MatDatepickerModule} from "@angular/material/datepicker";
import {MatTabsModule} from "@angular/material/tabs";
import {MatToolbarModule} from "@angular/material/toolbar";
import {MatDialogModule} from "@angular/material/dialog";
import {MatSnackBarModule} from "@angular/material/snack-bar";
import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";
import {MatSlideToggleModule} from "@angular/material/slide-toggle";
import {MatButtonToggleModule} from "@angular/material/button-toggle";
import {MatSelectModule} from "@angular/material/select";
import {MatInputModule} from "@angular/material/input";
import {MatMenuModule} from "@angular/material/menu";
import {MatCardModule} from "@angular/material/card";
import {MatIconModule} from "@angular/material/icon";
import {MatListModule} from "@angular/material/list";
import {MatButtonModule} from "@angular/material/button";
import {CovalentSearchModule} from "@covalent/core/search";
import {CovalentExpansionPanelModule} from "@covalent/core/expansion-panel";
import {CovalentCommonModule} from "@covalent/core/common";
import {CovalentDialogsModule} from "@covalent/core/dialogs";
import {CovalentLoadingModule} from "@covalent/core/loading";
import {CovalentPagingModule} from "@covalent/core/paging";
import {CovalentNotificationsModule} from "@covalent/core/notifications";
import {CovalentMessageModule} from "@covalent/core/message";
import {CovalentMenuModule} from "@covalent/core/menu";
import {CovalentDataTableModule} from "@covalent/core/data-table";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import { MainMenuComponent } from './main-menu/main-menu.component';
import { BodyComponent } from './body/body.component';
import {NgxGraphModule} from "@swimlane/ngx-graph";
import {NgxChartsModule} from "@swimlane/ngx-charts";
import { HttpClientModule } from '@angular/common/http';
import {MatTableModule} from "@angular/material/table";
import {MatSortModule} from "@angular/material/sort";


@NgModule({
  declarations: [
    AppComponent,
    MainMenuComponent,
    BodyComponent
  ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        AppRoutingModule,
        HttpClientModule,

        MatButtonModule,
        MatListModule,
        MatIconModule,
        MatCardModule,
        MatMenuModule,
        MatInputModule,
        MatSelectModule,
        MatButtonToggleModule,
        MatSlideToggleModule,
        MatProgressSpinnerModule,
        MatDialogModule,
        MatSnackBarModule,
        MatToolbarModule,
        MatTabsModule,
        MatSidenavModule,
        MatTooltipModule,
        MatRippleModule,
        MatRadioModule,
        MatGridListModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatSliderModule,
        MatAutocompleteModule,

      MatTableModule,
      MatSortModule,

        CovalentCommonModule,
        CovalentLayoutModule,
        CovalentMediaModule,
        CovalentExpansionPanelModule,
        CovalentStepsModule,
        CovalentDialogsModule,
        CovalentLoadingModule,
        CovalentSearchModule,
        CovalentPagingModule,
        CovalentNotificationsModule,
        CovalentMenuModule,
        CovalentDataTableModule,
        CovalentMessageModule,

        NgxGraphModule,
        NgxChartsModule,




    ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
