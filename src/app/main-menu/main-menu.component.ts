import { Component, OnInit } from '@angular/core';
import {BrowserService, Location} from "../service/browser.service";
import {Router} from "@angular/router";
import {R4} from "@ahryman40k/ts-fhir-types";
import {ILocation} from "@ahryman40k/ts-fhir-types/lib/R4/Resource/RTTI_Location";
import {TdMediaService} from "@covalent/core/media";

@Component({
  selector: 'app-main-menu',
  templateUrl: './main-menu.component.html',
  styleUrls: ['./main-menu.component.scss']
})
export class MainMenuComponent implements OnInit {




  public regionName = "";

  constructor(private fhirService: BrowserService,
              private router: Router,
              public media : TdMediaService) { }

  ngOnInit(): void {
    this.fhirService.locationChange.subscribe(location => {

      this.fhirService.get("/Location?identifier="+location.code).subscribe(result => {
        const bundle = <R4.IBundle> result;
        for(const entry of bundle.entry) {
          var fd: ILocation = <ILocation> entry.resource;
            this.regionName= " - "+ this.nameFix(fd.name);
        }

      })
    });
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
