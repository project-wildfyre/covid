import {Component, OnInit, ViewChild} from '@angular/core';
import {BrowserService, Location} from "../service/browser.service";
import {ActivatedRoute, Router} from "@angular/router";
import {R4} from "@ahryman40k/ts-fhir-types";
import {ILocation} from "@ahryman40k/ts-fhir-types/lib/R4/Resource/RTTI_Location";
import {TdMediaService} from "@covalent/core/media";
import {MatDrawer} from "@angular/material/sidenav";
import {TdNavigationDrawerComponent} from "@covalent/core/layout";

@Component({
  selector: 'app-main-menu',
  templateUrl: './main-menu.component.html',
  styleUrls: ['./main-menu.component.scss']
})
export class MainMenuComponent implements OnInit {


  @ViewChild(TdNavigationDrawerComponent, {static: false}) drawer: TdNavigationDrawerComponent;

  constructor(private fhirService: BrowserService,
              private router: Router,
              public media : TdMediaService) { }

  ngOnInit(): void {

  }



  selected(location) {
    //console.log(event);
    if (location !== undefined) {
      this.drawer.toggle();
      this.router.navigate(['/'+location]);

    }

  }

  nameFix( name: string): string {
    name=name.replace('NHS England ','');
    if (name.startsWith('NHS ')) {
      name= name.substring(3,name.length);
    }
    if (name.indexOf('(')>0) {
      name = name.substring(name.indexOf('(')+1).replace(')','');
    }
    return name;
  }
}
