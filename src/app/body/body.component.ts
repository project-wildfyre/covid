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

  multiCasesPerMillion: any[] = [
    {
      "name": "Area",
      "series": [
      ]
    }
  ];

  multiTotalCases: any[] = [
    {
      "name": "Area",
      "series": [
      ]
    }
  ];
  // width - height
  view: any[] = [600, 400];

  // options
  legend: boolean = false;
  showLabels: boolean = true;
  animations: boolean = true;
  xAxis: boolean = true;
  yAxis: boolean = true;
  showYAxisLabel: boolean = true;
  showXAxisLabel: boolean = true;
  xAxisLabel: string = 'Date';
  yAxisLabel: string = 'Case Per Million';
  timeline: boolean = true;

  cases = new Map();

  colorScheme = {
    domain: ['#5AA454', '#E44D25', '#CFC0BB', '#7aa3e5', '#a8385d', '#aae3f5']
  };
  constructor(private fhirService: BrowserService) {

  }

  ngOnInit(): void {

    this.fhirService.get('/MeasureReport?reporter.partof=Location/1610&_count=100&_sort=period&date=le2020-03-30').subscribe(
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
    this.multiTotalCases = [];
    this.multiCasesPerMillion = [];
    for (let entry of this.cases.entries()) {
      var entTot = {};
      var entPer = {};
      entTot.name = entry[0];
      entTot.series = [];
      entPer.name = entry[0];
      entPer.series = [];
      var reps : IMeasureReport[] = entry[1];
      for (const rep of reps) {
          var valTot = {};
          var dat = rep.date.split('T');
          valTot.name = dat[0];
          entTot.name = rep.subject.display;

          valTot.value = rep.group[0].measureScore.value;
          entTot.series.push(valTot);

        var valPer = {};

        valPer.name = dat[0];
        entPer.name = rep.subject.display;
        entPer.name = rep.subject.display;
        valPer.value = rep.group[1].measureScore.value;
        entPer.series.push(valPer);

      }
      this.multiTotalCases.push(entTot);
      this.multiCasesPerMillion.push(entPer);
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
