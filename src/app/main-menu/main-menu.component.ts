import { Component, OnInit } from '@angular/core';
import {BrowserService, Location} from "../service/browser.service";

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

  public location: Location = this.locations[0];

  constructor(private fhirService: BrowserService) { }

  ngOnInit(): void {
    this.fhirService.locationChange.subscribe(location => {
      this.location = location;
    });
  }

  selected(location) {
    //console.log(event);
    if (location !== undefined) {
      this.fhirService.setLocation(location);
    }
  }

}
