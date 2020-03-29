import { Component, OnInit } from '@angular/core';
import {BrowserService} from "../service/browser.service";
import {R4} from "@ahryman40k/ts-fhir-types";
import {IMeasureReport} from "@ahryman40k/ts-fhir-types/lib/R4";

@Component({
  selector: 'app-body',
  templateUrl: './body.component.html',
  styleUrls: ['./body.component.scss']
})
export class BodyComponent implements OnInit {

  multi: any[] = [
    {
      "name": "Area",
      "series": [
      ]
    }
  ];
  view: any[] = [900, 700];

  // options
  legend: boolean = true;
  showLabels: boolean = true;
  animations: boolean = true;
  xAxis: boolean = true;
  yAxis: boolean = true;
  showYAxisLabel: boolean = true;
  showXAxisLabel: boolean = true;
  xAxisLabel: string = 'Date';
  yAxisLabel: string = 'Population';
  timeline: boolean = true;

  cases = new Map();

  colorScheme = {
    domain: ['#5AA454', '#E44D25', '#CFC0BB', '#7aa3e5', '#a8385d', '#aae3f5']
  };
  constructor(private fhirService: BrowserService) {

  }

  ngOnInit(): void {

    this.fhirService.get('/MeasureReport?_count=100').subscribe(
      result => {
        const bundle = <R4.IBundle> result;
        this.processBundle(bundle);
        //this.dataSource = new QuestionnaireDataSource(this.fhirService,  this.questionnaires);
      }
    );
  }
  processBundle(bundle: R4.IBundle) {
    if (bundle.entry !== undefined) {
      for (const entry of bundle.entry) {
        if (entry.resource.resourceType === 'MeasureReport') {
          const measure = <IMeasureReport> entry.resource;
          let ident = measure.identifier[0].value;
          let idents = ident.split('-');
          if (!this.cases.has(idents[0])) {
            console.log(idents[0]);
            this.cases.set(idents[0],[]);
          };
          var map : IMeasureReport[] = this.cases.get(idents[0]);
          map.push(measure);
        }
      }
      var more : boolean = false;
      if (bundle.link != undefined) {
        for (const link of bundle.link) {
          if (link.relation == 'next') {
            more = true;
            let split = link.url.split('_getpages=');
            console.log(split);
            this.fhirService.get('?_getpages='+split[1]).subscribe(result => {
              this.processBundle(<R4.IBundle> result);
            })
          }
        }
        if (!more) {
          this.buildGraph();
        }
      }
    }
  }

  buildGraph() {
    this.multi = [];
    for (let entry of this.cases.entries()) {
      var ent = {};
      ent.name = entry[0];
      ent.series = [];
      var reps : IMeasureReport[] = entry[1];
      for (const rep of reps) {
          var val = {};
          var dat = rep.date.split('T');
          val.name = dat[0];
          ent.name = rep.subject.display;
          val.value = rep.group[0].measureScore.value;
          ent.series.push(val);
      }
      this.multi.push(ent);
      //console.log(entry[0], entry[1]);    //"Lokesh" 37 "Raj" 35 "John" 40
    }
  }
  onSelect(data): void {
    console.log('Item clicked', JSON.parse(JSON.stringify(data)));
  }

  onActivate(data): void {
    console.log('Activate', JSON.parse(JSON.stringify(data)));
  }

  onDeactivate(data): void {
    console.log('Deactivate', JSON.parse(JSON.stringify(data)));
  }
}
