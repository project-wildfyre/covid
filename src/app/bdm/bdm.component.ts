import {Component, HostListener, OnInit, ViewChild} from '@angular/core';
import {BrowserService} from "../service/browser.service";
import {R4} from "@ahryman40k/ts-fhir-types";
import {IMeasureReport} from "@ahryman40k/ts-fhir-types/lib/R4";
import {TdLoadingService} from "@covalent/core/loading";
import {ActivatedRoute, Router} from "@angular/router";
import * as shape from 'd3-shape';

export interface POD {
  home: number;
  hospital: number;
  hospice: number;
  careHome: number;
  other: number;
  elsewhere: number;
}

@Component({
  selector: 'app-bdm',
  templateUrl: './bdm.component.html',
  styleUrls: ['./bdm.component.scss']
})
export class BdmComponent implements OnInit {


  curve: any = shape.curveBasis;


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
  pods: any[] = [];


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

  podCases = new Map();

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
          var pod: POD = {
            home :0,
            hospice: 0,
            hospital :0,
            careHome:0,
            other:0,
            elsewhere:0
          };
          var podPresent = false;
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
            if (gp.code.coding[0].code == 'home') {
              pod.home = gp.measureScore.value;
              podPresent = true;
            }
            if (gp.code.coding[0].code == 'hospital') {
              pod.hospital = gp.measureScore.value;
              podPresent = true;
            }
            if (gp.code.coding[0].code == 'hospice') {
              pod.hospice = gp.measureScore.value;
              podPresent = true;
            }
            if (gp.code.coding[0].code == 'carehome') {
              pod.careHome = gp.measureScore.value;
              podPresent = true;
            }
            if (gp.code.coding[0].code == 'other') {
              pod.other = gp.measureScore.value;
              podPresent = true;
            }
            if (gp.code.coding[0].code == 'elsewhere') {
              pod.elsewhere = gp.measureScore.value;
              podPresent = true;
            }
          }
          if (podPresent) {
            this.podCases.set(new Date(dat[0]), pod);

          }
        }

      }

      this.changeDeathsBMD.push(total);
      this.changeDeathsBMD.push(covid);
      this.changeDeathsBMD.push(fiveYr);

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

    }
    var tpods = [];
    tpods.push({
      name: 'home',
      series : []
    });
    tpods.push({
      name: 'hospital',
      series : []
    });
    tpods.push({
      name: 'hospice',
      series : []
    });
    tpods.push({
      name: 'carehome',
      series : []
    });
    tpods.push({
      name: 'other',
      series : []
    });
    tpods.push({
      name: 'elsewhere',
      series : []
    });
    var fd = false;
    this.podCases.forEach( (value,key) => {
      fd=true;

      tpods[0].series.push(
        {
          name : new Date(key),
          value : value.home
        }
      );
      tpods[1].series.push(
        {
          name : new Date(key),
          value : value.hospital
        }
      );
      tpods[2].series.push(
        {
          name : new Date(key),
          value : value.hospice
        }
      );
      tpods[3].series.push(
        {
          name : new Date(key),
          value : value.careHome
        }
      );
      tpods[4].series.push(
        {
          name : new Date(key),
          value : value.other
        }
      );
      tpods[5].series.push(
        {
          name : new Date(key),
          value : value.elsewhere
        }
      );
   });
    if (fd) {
      this.pods = tpods;
    }
    this._loadingService.resolve('overlayStarSyntax');
  }


  onResize(event) {

    this.view = [(event.target.innerWidth)*0.98,  this.view[1]];

  }

}
