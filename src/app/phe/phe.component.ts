import {Component, HostListener, OnInit, ViewChild} from '@angular/core';
import {BrowserService, Location} from "../service/browser.service";
import {R4} from "@ahryman40k/ts-fhir-types";
import {IMeasureReport} from "@ahryman40k/ts-fhir-types/lib/R4";
import {TdLoadingService} from "@covalent/core/loading";
import {MatSort, Sort} from "@angular/material/sort";
import {MatTableDataSource} from "@angular/material/table";
import {ActivatedRoute, Router} from "@angular/router";
import * as shape from 'd3-shape';
import {std} from "mathjs";

//import ukjson from '../../assets/EnglandRed.json';

//import * as echarts from 'echarts';

export interface Case {
  name: string;
  population: number;
  cases: number;
  casesper100k: number;
  healthindex: number;
  depravityindex: number;
  perkmsq: number;
  populationkmsq: number;
  id : string;
}

@Component({
  selector: 'app-body',
  templateUrl: './phe.component.html',
  styleUrls: ['./phe.component.scss']
})
export class PheComponent implements OnInit {

  totalCases: any[] =[
    {
      "name": "UK",
      "value": 0
    }
  ];
  totalCases100k: any[] =[
    {
      "name": "UK",
      "value": 0
    }
  ];

  casesPer100k: any[] = [
    {
      "name": "Area",
      "series": [
      ]
    }
  ];
  cases: any[] = [
    {
      "name": "Area",
      "series": [
      ]
    }
  ];

  dailyChangeByDate :any[] = [];
  dailyChange: any[] = [
    {
      "name": "Area",
      "series": [
      ]
    }
  ];


  // width - height
  view: any[] = [500, 350];
  bview: any[] = [500, 500];
  aview: any[] = [700,200];


  curve: any = shape.curveBasis;

  // options
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

  caseMap = new Map();

  colorScheme = {
    domain: ['#5AA454', '#E44D25', '#CFC0BB', '#7aa3e5', '#a8385d', '#aae3f5']
  };

 // reports: IMeasureReport[] = [];

  caseTable :Case[] = [];

  dataSource = new MatTableDataSource(this.caseTable);

  displayedColumns = ['name', 'cases','casesper100k', 'population', 'healthindex',  'depravityindex','perkmsq', 'populationkmsq'];

  todayStr: string;

  single: any[];


  // options
  agradient: boolean = true;
  ashowLegend: boolean = true;
  ashowLabels: boolean = true;
  isDoughnut: boolean = false;
  currentRegion = undefined;

  @ViewChild(MatSort, {static: false}) sort: MatSort;

  constructor(private fhirService: BrowserService,
              private route: ActivatedRoute,
              private router: Router,
              private _loadingService: TdLoadingService) {

  }
  ngOnInit() {

    this.view = [(window.innerWidth / 2)*0.97, this.view[1]];
    this.bview = [(window.innerWidth)*0.96, this.bview[1]];
    this.aview = [(window.innerWidth)*0.98, this.aview[1]];
    this.legendCheck();
    this.doSetup();

    this.route.url.subscribe( url => {
      this.doSetup();
    });

  }

  doSetup(): void {
  //  echarts.registerMap('UK', ukjson);

    var tempid = this.route.snapshot.paramMap.get('region');
    if (tempid==undefined) {
      tempid= 'E92000001';
    }
    if (tempid !== this.currentRegion) {
      this.currentRegion = tempid;
      this.fhirService.setLocation({ code : tempid, name: 'dummy'});
      this.populate(tempid);

    }

  }

  onResize(event) {
    this.aview = [(event.target.innerWidth)*0.98,  this.aview[1]];
    this.bview = [(event.target.innerWidth)*0.96,  this.bview[1]];
    this.view = [(event.target.innerWidth / 2)*0.97,  this.view[1]];
    this.legendCheck();
  }

  round(num) {
    var no = this.pres(num,1);
    if (no==0) return '';
    return no;
  }
  round2sf(num) {
    var no = this.pres(num,3);
    if (no==0) return '';
    return no;
  }

  pres(value, precision) {
    var multiplier = Math.pow(10, precision || 0);
    return Math.round(value * multiplier) / multiplier;
  }
  populate(region ) {
    this.casesPer100k = [];
    this.cases = [];
    this.caseMap = new Map();
    this._loadingService.register('overlayStarSyntax');

    var fhirSearchUrl: string;
    if (region.startsWith('E12') || region.startsWith('E92')) {
      fhirSearchUrl = '/MeasureReport?measure=21263'+
        '&reporter.partof.identifier='+region+
        '&_count=100'+
        '&_sort:desc=period'+
        '&date=gt2020-03-20';
    } else {
      fhirSearchUrl = '/MeasureReport?measure=21263'+
        '&reporter.identifier='+region+
        '&_count=100'+
        '&_sort:desc=period'+
        '&date=gt2020-03-20';
    }

    this.fhirService.get(fhirSearchUrl)
      .subscribe(
      result => {
        const bundle = <R4.IBundle> result;
        this.processBundle(bundle);
        //this.dataSource = new QuestionnaireDataSource(this.fhirService,  this.questionnaires);
      }
    );
  }

  legendCheck() {
    if (this.view[0]> 500) {
      this.legend = true;
    } else {
      this.legend = false;
    }
  }


   processBundle(bundle: R4.IBundle) {
    if (bundle.entry !== undefined) {
      for (const entry of bundle.entry) {
        if (entry.resource.resourceType === 'MeasureReport') {
          const measure = <IMeasureReport> entry.resource;
          if (this.todayStr === undefined) {
            this.todayStr = measure.date.substring(0, measure.date.indexOf('T'));
            console.log(this.todayStr);
          }
          let ident = measure.identifier[0].value;
          let idents = ident.split('-');
          if (!this.caseMap.has(idents[0])) {
            this.caseMap.set(idents[0],[]);
          };
          var map : IMeasureReport[] = this.caseMap.get(idents[0]);

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
      } else {
      // This may be empty
      this.buildGraph();
     }
    }
  }

  buildGraph() {
    this.cases =  [];
    this.casesPer100k = [];
    this.totalCases =[];
    this.totalCases100k = [];
    this.caseTable = [];
    this.dailyChangeByDate = [];
    for (let entry of this.caseMap.entries()) {
      var entTot :any = {};
      var entPer: any = {};
      entTot.name = entry[0];
      entTot.series = [];
      entPer.name = entry[0];
      entPer.series = [];

      var reps : IMeasureReport[] = entry[1];
      for (const rep of reps) {
         // var ids = rep.identifier[0].value.split('-');
          var id = rep.subject.identifier.value;
          var valTot :any = {};
          var dat = rep.date.split('T');

          valTot.name = new Date(dat[0]);
          entTot.name = rep.subject.display;
          valTot.extra = {
             id : id
          };
        entTot.extra = {
          id : id
        };

          valTot.value = rep.group[0].measureScore.value;
          entTot.series.push(valTot);

        var valPer:any = {};

        valPer.name = new Date(dat[0]);
        entPer.name = rep.subject.display;
        entPer.name = rep.subject.display;
        valPer.value = rep.group[1].measureScore.value / 10;
        valPer.extra = {
          id : id
        };

        entPer.series.push(valPer);
        if (rep.date.startsWith(this.todayStr)) {
          // TODO  this.reports.push(rep);

          var hi = 0;
          var mdi = 0;
          var perhect = 0;
          var populationkmsq = 0;
          for (const gp of rep.group) {
           if (gp.code.coding[0].code == 'HI') {
             hi=gp.measureScore.value;
           }
            if (gp.code.coding[0].code == 'MDI') {
              mdi=gp.measureScore.value;
            }
            if (gp.code.coding[0].code == 'PERHECT') {
              perhect = gp.measureScore.value * 100;
              if (gp.measureScore.value > 0) {
                populationkmsq = rep.group[0].population[0].count / gp.population[0].count
              }
            }
          }
          var report : Case = {
            name : rep.subject.display,
            population : rep.group[0].population[0].count,
            cases : valTot.value,
            casesper100k : valPer.value ,
            healthindex : hi,
            depravityindex :mdi,
            perkmsq : perhect,
            populationkmsq : populationkmsq,
            id: id
          };
          this.caseTable.push(report);
          var tot = {
            name : rep.subject.display,
            value : valTot.value,
            extra : {
              id : id
            }
          };
          this.totalCases.push(tot);
          var totMillion = {
            name : rep.subject.display,
            value : valPer.value,
            extra : {
              id : id
            }
          };
          this.totalCases100k.push(totMillion);
        }
      }
      this.cases.push(entTot);
      this.casesPer100k.push(entPer);

    }
    this.dailyChange = [];


    var dailyChangeMap = new Map();

    for(var ser of this.cases) {

      var dailyEntry: any = {
        name : ser.name,
        series: [],
        extra : {
          id : ser.extra.id
        }
      };
      var lastCase = 0;
      var first : boolean =true;
      ser.series.slice().reverse().forEach(function(entry) {
        if (!dailyChangeMap.has(entry.name.valueOf())) {
          dailyChangeMap.set(entry.name.valueOf(),[]);
        }
        var dailyChange  = dailyChangeMap.get(entry.name.valueOf());

        var change: number = (entry.value - lastCase);
        if (!first) {
          dailyEntry.series.push({
            name: entry.name,
            value: change,
            extra : {
              id : ser.extra.id
            }
          });
          dailyChange.push({
            name: ser.name,
            value: change,
            extra : {
              id : ser.extra.id
            }
          });
        }
        first = false;
        lastCase = entry.value;
      });
      this.dailyChange.push(dailyEntry);

    }
    dailyChangeMap.forEach((value, key) => {
      var day = new Date(key);
      const month = day.toLocaleString('default', { month: 'short' });
      var byDay = {
        name : month+' ' + day.getDate(),
        series : []
      };
      value.forEach(change => {
         byDay.series.push(change);
      });

      this.dailyChangeByDate.push(byDay);
    });



    this.dataSource.data = this.caseTable;
    this.dataSource.sort = this.sort;
    this._loadingService.resolve('overlayStarSyntax');
  }


  onDoubleClick(event) {
    console.log(event);
  }
  onSelectAdv(event): void {
    if (event !== undefined
      && event.extra !== undefined
   //   && event.extra.id.startsWith('E12')
    ) {
      var location = {code: event.extra.id, name: event.name};

      if (location !== undefined) {
        this.router.navigate(['/phe',event.extra.id]);

      }
    }
  }


  /*
  @HostListener('window:resize', ['$event'])
  getScreenSize(event?) {
    //this.screenHeight = window.innerHeight;
    //this.screenWidth = window.innerWidth;

  }

   */
}
