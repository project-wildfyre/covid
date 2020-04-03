import { Component, OnInit } from '@angular/core';
import {BrowserService, Location} from "../service/browser.service";
import {Router} from "@angular/router";
import {R4} from "@ahryman40k/ts-fhir-types";
import {ILocation} from "@ahryman40k/ts-fhir-types/lib/R4/Resource/RTTI_Location";

@Component({
  selector: 'app-main-menu',
  templateUrl: './main-menu.component.html',
  styleUrls: ['./main-menu.component.scss']
})
export class MainMenuComponent implements OnInit {

  public locations: Location[] = [
    {code:'E92000001', name:'England'},
    {code:'E12000001', name:'North East'},
    {code:'E12000002', name:'North West'},
    {code:'E12000003', name:'Yorkshire and The Humber'},
    {code:'E12000004', name:'East Midlands'},
    {code:'E12000005', name:'West Midlands'},
    {code:'E12000006', name:'East of England'},
    {code:'E12000007', name:'London'},
    {code:'E12000008', name:'South East'},
    {code:'E12000009', name:'South West'}
  ];

  public nhslocations: Location[] = [
    {code:'E40000000', name:'NHS England'},
    {name:"South West (North)", code:"E39000043"},
    {name:"South West (South)", code:"E39000044"},
    {name:"North Midlands", code:"E39000032"},
    {name:"Cumbria and North East", code:"E39000047"},
    {name:"East of England", code:"E39000046"},
    {name:"Cheshire and Merseyside", code:"E39000026"},
    {name:"Hampshire, Isle of Wight and Thames Valley", code:"E39000041"},
    {name:"Lancashire and South Cumbria", code:"E39000040"},
    {name:"Yorkshire and Humber", code:"E39000048"},
    {name:"London", code:"E39000018"},
    {name:"Kent, Surrey and Sussex", code:"E39000042"},
    {name:"Central Midlands", code:"E39000045"},
    {name:"Greater Manchester", code:"E39000037"},
    {name:"West Midlands", code:"E39000033"}];

  public location: Location = this.locations[0];

  public nhslocation: Location = this.nhslocations[0];

  public regionName = "";

  constructor(private fhirService: BrowserService,
              private router: Router) { }

  ngOnInit(): void {
    this.fhirService.locationChange.subscribe(location => {
      this.location = location;
      this.fhirService.get("/Location?identifier="+location.code).subscribe(result => {
        const bundle = <R4.IBundle> result;
        for(const entry of bundle.entry) {
          var fd: ILocation = <ILocation> entry.resource;
            this.regionName= " - "+ this.nameFix(fd.name);
        }

      })
    });
  }

  selected(location) {
    //console.log(event);
    if (location !== undefined) {
      this.router.navigate(['/phe',location.code]);

    }
  }
  selectedNHS(location) {
    //console.log(event);
    if (location !== undefined) {
      this.router.navigate(['/nhs111',location.code]);

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
