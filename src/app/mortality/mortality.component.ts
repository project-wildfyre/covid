import { Component, OnInit } from '@angular/core';
import {BrowserService} from "../service/browser.service";
import {ActivatedRoute, Router} from "@angular/router";
import {TdLoadingService} from "@covalent/core/loading";
import {R4} from "@ahryman40k/ts-fhir-types";
import {IBundle, IMeasureReport} from "@ahryman40k/ts-fhir-types/lib/R4";
import * as shape from 'd3-shape';

@Component({
  selector: 'app-mortality',
  templateUrl: './mortality.component.html',
  styleUrls: ['./mortality.component.scss']
})
export class MortalityComponent implements OnInit {


  curve: any = shape.curveBasis;

  totalDeaths: any[] =[
    {
      "name": "UK",
      "series": [
      ]
    }
  ];

  changeDeaths: any[] =[
    {
      "name": "UK",
      "series": [
      ]
    }
  ];
  changeDeathsBMD: any[] =[
    {
      "name": "UK",
      "series": [
      ]
    }
  ];
  changeDeathsBMDCovid: any[] =[

  ];
  changeDeathsBMDregional : any[] =[

  ];

  totalDeathsPer100k : any[] =[
    {
      "name": "UK",
      "series": [
      ]
    }
  ];

  legend: boolean = true;
  showLabels: boolean = true;
  animations: boolean = true;
  xAxis: boolean = true;
  yAxis: boolean = true;
  showYAxisLabel: boolean = true;
  showXAxisLabel: boolean = true;
  xAxisLabel: string = 'Date';
  yAxisLabel: string = 'Case Per Million';
  timeline: boolean = false;
  colorScheme = {
    domain: ['#5AA454', '#E44D25', '#CFC0BB', '#7aa3e5', '#a8385d', '#aae3f5']
  };

  view: any[] = [500, 350];

  todayStr: string;

  cases = new Map();

  bmdUKcases = new Map();
  bmdRegionalcases = new Map();

  constructor(private fhirService: BrowserService,
              private route: ActivatedRoute,
              private router: Router,
              private _loadingService: TdLoadingService) { }


  ngOnInit(): void {
    this.view = [(window.innerWidth)*0.98, this.view[1]];
    this.populate('Z92');
  }

  populate(region) {

    this.fhirService.setLocation({ code : region, name: 'dummy'});

    this._loadingService.register('overlayStarSyntax');


    var fhirSearchUrl: string;


      fhirSearchUrl = '/MeasureReport'
        + '?measure=25444'
        + '&_count=100'
        + '&_sort:desc=period';

    this.fhirService.get(fhirSearchUrl).subscribe(
      result => {
        const bundle = <R4.IBundle> result;
        this.processBundle(bundle);

      }
    );
    fhirSearchUrl = '/MeasureReport'
      + '?measure=31531'
      + '&subject.identifier=E92000001'
     // + '&_count=100'+
      + '&_sort:desc=period';
    this.fhirService.get(fhirSearchUrl).subscribe(
      result => {
        const bundle = <R4.IBundle> result;
        this.processBundleBMD(bundle, true);

      }
    );
    fhirSearchUrl = '/MeasureReport'
      + '?measure=31531'
      + '&subject.partof.identifier=E92000001'
     // + '&_count=100'+
      + '&_sort:desc=period';
    this.fhirService.get(fhirSearchUrl).subscribe(
      result => {
        const bundle = <R4.IBundle> result;
        this.processBundleBMD(bundle, false);

      }
    );
  }
  processBundle(bundle: R4.IBundle) {
    if (bundle.entry !== undefined) {
      for (const entry of bundle.entry) {
        if (entry.resource.resourceType === 'MeasureReport') {
          const measure = <IMeasureReport> entry.resource;
          if (this.todayStr === undefined) {
            this.todayStr = measure.date.substring(0, measure.date.indexOf('T'));

          }
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

            this.fhirService.get('?_getpages='+split[1]).subscribe(result => {
              this.processBundle(<R4.IBundle> result);
            })
          }
        }
        if (!more) {
          this.buildGraph();
        }
      }
    } else {
      // This may be empty
      this.buildGraph();
    }
  }

  processBundleBMD(bundle: R4.IBundle, uk: boolean) {
    if (bundle.entry !== undefined) {
      for (const entry of bundle.entry) {
        if (entry.resource.resourceType === 'MeasureReport') {
          const measure = <IMeasureReport>entry.resource;
          if (this.todayStr === undefined) {
            this.todayStr = measure.date.substring(0, measure.date.indexOf('T'));

          }
          let ident = measure.identifier[0].value;
          let idents = ident.split('-');


          if (uk) {
            if (!this.bmdUKcases.has(idents[0])) {
              this.bmdUKcases.set(idents[0], []);
            }
            var map: IMeasureReport[] = this.bmdUKcases.get(idents[0]);
            map.push(measure);
          } else {
            if (!this.bmdRegionalcases.has(idents[0])) {
              this.bmdRegionalcases.set(idents[0], []);
            }
            var map: IMeasureReport[] = this.bmdRegionalcases.get(idents[0]);
            map.push(measure);
          }
        }
      }
      var more : boolean = false;
      if (bundle.link != undefined) {
        for (const link of bundle.link) {
          if (link.relation == 'next') {
            more = true;
            let split = link.url.split('_getpages=');

            this.fhirService.get('?_getpages='+split[1]).subscribe(result => {
              this.processBundleBMD(<R4.IBundle> result, uk);
            })
          }
        }
        if (!more) {
          this.buildGraphBMD(uk);
        }
      }
    } else {
      // This may be empty
      this.buildGraphBMD(uk);
    }
  }

  buildGraphBMD(uk: boolean) {
      if (uk) {
        this.changeDeathsBMD = [];
        var total: any = {};
        total.name = 'Total Deaths';
        total.series = [];
        var covid: any = {};
        covid.name = 'COVID Deaths';
        covid.series = [];
        var fiveYr: any = {};
        fiveYr.name = '5 Year Avg. Deaths';
        fiveYr.series = [];
        for (const entry of this.bmdUKcases.entries()) {

          var reps: IMeasureReport[] = entry[1];
          for (const rep of reps) {
            var dat = rep.date.split('T');

            for (const gp of rep.group) {
              if (gp.code.coding[0].code == 'covid-deaths') {
                 covid.series.push({
                   name: new Date(dat[0]),
                   value: gp.measureScore.value
                 });
              }
              if (gp.code.coding[0].code == 'all-deaths') {
                total.series.push({
                  name: new Date(dat[0]),
                  value: gp.measureScore.value
                });
              }
              if (gp.code.coding[0].code == '5yr-avg-deaths') {
                fiveYr.series.push({
                  name: new Date(dat[0]),
                  value: gp.measureScore.value
                });
              }
            }
          }
        }
        this.changeDeathsBMD.push(total);
        this.changeDeathsBMD.push(covid);
        this.changeDeathsBMD.push(fiveYr);
        console.log(this.changeDeathsBMD);
      } else {

        this.changeDeathsBMDregional = [];
        this.changeDeathsBMDCovid = [];

        for (const entry of this.bmdRegionalcases.entries()) {
          // Setup the series

          var total: any = {};
          total.name = 'Total Deaths';
          total.series = [];
          var covid: any = {};
          covid.name = 'COVID Deaths';
          covid.series = [];

          // populate series
          var reps: IMeasureReport[] = entry[1];
          for (const rep of reps) {
            var dat = rep.date.split('T');
            total.name = rep.subject.display;
            covid.name = rep.subject.display;
            for (const gp of rep.group) {
              if (gp.code.coding[0].code == 'covid-deaths') {
                covid.series.push({
                  name: new Date(dat[0]),
                  value: gp.measureScore.value
                });
              }
              if (gp.code.coding[0].code == 'all-deaths') {
                total.series.push({
                  name: new Date(dat[0]),
                  value: gp.measureScore.value
                });
              }
            }
          }
          this.changeDeathsBMDregional.push(total);
          this.changeDeathsBMDCovid.push(covid);
        }
        console.log(this.changeDeathsBMDregional);
        console.log(this.changeDeathsBMDCovid);
      }
  }

  buildGraph() {
    this.totalDeaths = [];
    this.totalDeathsPer100k = [];
    this.changeDeaths = [];
    var changeMap = new Map();
    for (let entry of this.cases.entries()) {

      var entDeath: any = {};
      entDeath.name = entry[0];
      entDeath.series = [];

      var entDeathPer100k: any = {};
      entDeathPer100k.name = entry[0];
      entDeathPer100k.series = [];

      var changeDeath: any = {};
      changeDeath.name = entry[0];
      changeDeath.series = [];

      var reps: IMeasureReport[] = entry[1];
      for (const rep of reps) {
        var dat = rep.date.split('T');
        var death: number = undefined;
        var population: number = 0;

        entDeath.name = rep.subject.display;
        entDeathPer100k.name = rep.subject.display;
        changeDeath.name = rep.subject.display;
        for (const gp of rep.group) {
          if (gp.code.coding[0].code == '255619001|419620001') {
           death = gp.measureScore.value;
            if (gp.population != undefined && gp.population.length > 0) {
              population = gp.population[0].count;
            }
          }
        }
        if (death != undefined) {
          var dayDeath = {
            name: new Date(dat[0]),
            value: death,
            extra: {
              id: rep.subject.identifier.value
            }
          };

        if (changeMap.has(rep.subject.identifier.value) ) {
            var dayChange = {
              name: new Date(dat[0]),
              value: changeMap.get(rep.subject.identifier.value) - death,
              extra: {
                id: rep.subject.identifier.value
              }
            };
            changeDeath.series.push(dayChange);

          }
          changeMap.set(rep.subject.identifier.value, death);
          entDeath.series.push(dayDeath);
          if (population > 0) {
            var per100k = (death / population) * 100000;
            var dayDeathPer100k = {
              name: new Date(dat[0]),
              value: per100k,
              extra: {
                id: rep.subject.identifier.value
              }
            };
            entDeathPer100k.series.push(dayDeathPer100k);
          }
        }

      }
      this.changeDeaths.push(changeDeath)
      this.totalDeaths.push(entDeath);
      this.totalDeathsPer100k.push(entDeathPer100k);
    }


    this._loadingService.resolve('overlayStarSyntax');
  }

  onResize(event) {

    this.view = [(event.target.innerWidth)*0.98,  this.view[1]];

  }

}
