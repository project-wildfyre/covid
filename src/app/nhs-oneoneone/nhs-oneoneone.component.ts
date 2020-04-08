import {Component, OnInit, ViewChild} from '@angular/core';
import {MatTableDataSource} from "@angular/material/table";
import {MatSort} from "@angular/material/sort";
import {BrowserService} from "../service/browser.service";
import {TdLoadingService} from "@covalent/core/loading";
import {R4} from "@ahryman40k/ts-fhir-types";
import {ActivatedRoute, Router} from "@angular/router";
import {IMeasureReport} from "@ahryman40k/ts-fhir-types/lib/R4";
import * as shape from 'd3-shape';
import { std } from 'mathjs';

export interface Nhs111 {
  name: string;
  triagetotal: number;
  onlinetotal : number;
  maletotal : number;
  femaletotal : number;
  maletotalonline : number;
  femaletotalonline : number;
  population : number;
  triagetotalper100k: number;
  onlinetotalper100k : number;
  triagedayper: number;
  onlinedayper : number;
  nhsCost: number;
  riskFactor: number;
  id : string;
}

@Component({
  selector: 'app-nhs-oneoneone',
  templateUrl: './nhs-oneoneone.component.html',
  styleUrls: ['./nhs-oneoneone.component.scss']
})
export class NhsOneoneoneComponent implements OnInit {


  curve: any = shape.curveBasis;

  totalOnline : any[] =[
    {
      "name": "UK",
      "value": 0
    }
  ];
  totalTriaged: any[] =[
    {
      "name": "UK",
      "value": 0
    }
  ];

  totalOnlinePer100k : any[] =[
    {
      "name": "UK",
      "value": 0
    }
  ];
  totalTriagedPer100k: any[] =[
    {
      "name": "UK",
      "value": 0
    }
  ];


  dailyOnline: any[] = [
    {
      "name": "Area",
      "series": [
      ]
    }
  ];

  dailyOnlineReference: any [] = [{
    "name": "UK",
    "value": 0
  }
];
  dailyTriaged: any[] = [
    {
      "name": "Area",
      "series": [
      ]
    }
  ];
  dailyTriageReference: any [] = [{
    "name": "UK",
    "value": 0
  }
  ];


  view: any[] = [500, 350];
  aview: any[] = [700,200];
  bview: any[] = [500,200];

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

  lowLevelHide = false;

  cases = new Map();

  colorScheme = {
    domain: ['#5AA454', '#E44D25', '#CFC0BB', '#7aa3e5', '#a8385d', '#aae3f5']
  };

  // reports: IMeasureReport[] = [];

  caseTable :Nhs111[] = [];

  dataSource = new MatTableDataSource(this.caseTable);

  displayedColumns = ['name',
    'triagetotal',
    'onlinetotal',
    'triagetotalper100k',
    'onlinetotalper100k',
    'triagedayper',
    'onlinedayper',
    'population',
    'nhsCost',
    'riskFactor'

   //  'maletotal',
 //   'femaletotal',
   // 'ratiototal',
   // 'maletotalonline',
  //  'femaletotalonline',
  //  'ratiototalonline'
  ];

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
    this.bview = [(window.innerWidth / 2)*0.97, this.bview[1]];
    this.aview = [(window.innerWidth)*0.98, this.aview[1]];

    this.legendCheck();
    this.doSetup();

    this.route.url.subscribe( url => {
      this.doSetup();
    });

  }

  doSetup(): void {
    //  echarts.registerMap('UK', ukjson);

    var tempid = this.route.snapshot.paramMap.get('nhsregion');
    if (tempid==undefined) {
      tempid= 'E40000000';
    }
    if (tempid !== this.currentRegion) {
      this.currentRegion = tempid;
      this.populate(tempid);

    }

  }

  populate(region) {
    this.fhirService.setLocation({ code : region, name: 'dummy'});
    this.cases = new Map();
    this._loadingService.register('overlayStarSyntax');


    var fhirSearchUrl: string;

    if ( region.startsWith('E39') ||  region.startsWith('E40')) {
      this.lowLevelHide = false;
      fhirSearchUrl = '/MeasureReport'
        + '?measure=21264'
        + '&subject.partof.identifier='+region
        + '&_count=100'
        + '&_sort:desc=period';
    } else {
      this.lowLevelHide = true;
      fhirSearchUrl = '/MeasureReport'
        + '?measure=21264'
        + '&subject.identifier='+region
        + '&_count=100'
        + '&_sort:desc=period';
    }
    this.fhirService.get(fhirSearchUrl).subscribe(
      result => {
        const bundle = <R4.IBundle> result;
        this.processBundle(bundle);

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
            console.log(this.todayStr);
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

  buildGraph() {

    this.totalOnline = [];
    this.totalTriaged = [];
    this.dailyTriaged = [];
    this.dailyOnline = [];
    this.totalOnlinePer100k = [];
    this.totalTriagedPer100k = [];
    this.caseTable = [];
    for (let entry of this.cases.entries()) {
      var entOnline :any = {};
      var entTriaged: any = {};


      entOnline.name = entry[0];
      entOnline.series = [];
      entTriaged.name = entry[0];
      entTriaged.series = [];

      var reps : IMeasureReport[] = entry[1];
      for (const rep of reps) {
        var ids = rep.identifier[0].value.split('-');
        var id = ids[0];
        var valTot :any = {};
        var dat = rep.date.split('T');
        rep.subject.display = this.nameFix(rep.subject.display);
        valTot.name = new Date(dat[0]);
        entOnline.name = rep.subject.display;
        entTriaged.name = rep.subject.display;


        var symptom = 0;
        var suspected = 0;
        var femaletotal = 0;
        var maletotal = 0;
        var femaletotalonline = 0;
        var maletotalonline = 0;
        var pop= 0;
        var symptomper100k = undefined;
        var suspectedper100k = undefined;
        var dayonline=0;
        var daytriage=0;
        var dayonlineper=undefined;
        var daytriageper=undefined;
        var nhsCost = undefined;
        var riskFactor = undefined;

        for (const gp of rep.group) {
          if (gp.code.coding[0].code == '840544004') {
            suspected=gp.measureScore.value;
            if (gp.population != undefined && gp.population.length>0) {
              pop = gp.population[0].count;
            }
          }
          if (gp.code.coding[0].code == 'online-total') {
            symptom=gp.measureScore.value;

            if (gp.population != undefined && gp.population.length>0) {
              pop = gp.population[0].count;
            }
          }
          if (gp.code.coding[0].code == 'daily-triage') {
            daytriage=gp.measureScore.value;
          }
          if (gp.code.coding[0].code == 'daily-online') {
            dayonline=gp.measureScore.value;
          }
          if (gp.code.coding[0].code == 'female-triage-total') {
            femaletotal=gp.measureScore.value;
          }
          if (gp.code.coding[0].code == 'femalel-online-total') {
            femaletotalonline=gp.measureScore.value;
          }
          if (gp.code.coding[0].code == 'male-triage-total') {
            maletotal=gp.measureScore.value;
          }
          if (gp.code.coding[0].code == 'male-online-total') {
            maletotalonline=gp.measureScore.value;
          }
          if (gp.code.coding[0].code == 'nhs-cost') {
            nhsCost=gp.measureScore.value;
          }
          if (gp.code.coding[0].code == 'risk-factor') {
            riskFactor=gp.measureScore.value;
          }
        }
        if (pop > 0) {
          suspectedper100k = Math.round((suspected / pop) * 100000);
         // console.log(suspectedpermillion);
          symptomper100k = Math.round((symptom / pop) * 100000);
          dayonlineper = Math.round((dayonline/pop) * 100000);
          daytriageper = Math.round((daytriage/pop) * 100000);


          var dayTriage = {
            name : new Date(dat[0]),
            value : daytriageper,
            extra : {
              id : id
            }
          };
          var dayOnline = {
            name : new Date(dat[0]),
            value : dayonlineper,
            extra : {
              id : id
            }
          };

          entTriaged.series.push(dayTriage);
          entOnline.series.push(dayOnline);
        }

        if (rep.date.startsWith(this.todayStr)) {
          var sus = {
            name : rep.subject.display,
            value : suspected,
            extra : {
              id : id
            }
          };
          this.totalTriaged.push(sus);
          var sym = {
            name : rep.subject.display,
            value : symptom,
            extra : {
              id : id
            }
          };
          this.totalOnline.push(sym);

          if (suspectedper100k !== undefined) {
            var susPM = {
              name: rep.subject.display,
              value: suspectedper100k,
              extra: {
                id: id
              }
            };
            this.totalTriagedPer100k.push(susPM);
          }

          if (symptomper100k !== undefined) {
            var symPM = {
              name: rep.subject.display,
              value: symptomper100k,
              extra: {
                id: id
              }
            };
            this.totalOnlinePer100k.push(symPM);
          }

          var nhs: Nhs111 = {
            name: rep.subject.display,
            femaletotal: femaletotal,
            maletotal: maletotal,
            femaletotalonline: femaletotalonline,
            maletotalonline: maletotalonline,
            triagetotal: suspected,
            onlinetotal: symptom,
            population: pop,
            triagetotalper100k: suspectedper100k,
            onlinetotalper100k: symptomper100k,
            onlinedayper: dayonlineper,
            triagedayper: daytriageper,
            nhsCost: nhsCost,
            riskFactor: (riskFactor*1000),
            id : id
          };
          if (pop == 0) {
            console.log(rep.identifier[0].value);
            console.log(rep);
          }
          this.caseTable.push(nhs);
        }
      }
      this.dailyOnline.push(entOnline);
      this.dailyTriaged.push(entTriaged);
    }




    var total = 0;
    var cnt = 0;
    var avg: number[] =[];

    for(var ref of this.dailyOnline) {
      var seriestotal: number = 0;
      var count: number =0;
      for(var series of ref.series) {
        cnt++;
        count++;
        total += series.value;
        seriestotal += series.value;
      }
      if (count>0) {
        avg.push(seriestotal/count);
      }
    }

    var stdv = std(avg);
    this.dailyOnlineReference = [];

    this.dailyOnlineReference.push({
      name : '0',
      value : total/cnt
    });
    this.dailyOnlineReference.push({
      name : '+',
      value : (total/cnt) + stdv
    });
    this.dailyOnlineReference.push({
      name : '-',
      value : (total/cnt) - stdv
    });

    total = 0;
    cnt = 0;
    avg =[];
    for(var ref of this.dailyTriaged) {
      var seriestotal: number = 0;
      var count: number =0;
      for(var series of ref.series) {
        cnt++;
        count++;
        total += series.value;
        seriestotal += series.value;
      }
      if (count>0) {
        avg.push(seriestotal/count);
      }
    }
    stdv = std(avg);
    this.dailyTriageReference = [];
    this.dailyTriageReference.push({
      name : '0',
      value : total/cnt
    });
    this.dailyTriageReference.push({
      name : '+',
      value : (total/cnt)+stdv
    });
    this.dailyTriageReference.push({
      name : '-',
      value : (total/cnt)-stdv
    });



    this.dataSource.data = this.caseTable;
    this.dataSource.sort = this.sort;
    this._loadingService.resolve('overlayStarSyntax');
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
  onSelectAdv(event): void {
    // Only drill into regions
   // console.log(event);
    if (event !== undefined && event.extra !== undefined
    //  && !event.extra.id.startsWith('E38')
    ) {
      var location = {code: event.extra.id, name: event.name};

      if (location !== undefined) {
        this.router.navigate(['/nhs111',event.extra.id]);

      }
    }
  }

  onResize(event) {
    this.aview = [(event.target.innerWidth)*0.98,  this.aview[1]];
    this.view = [(event.target.innerWidth / 2)*0.97,  this.view[1]];
    this.bview = [(event.target.innerWidth / 2)*0.97,  this.bview[1]];
    this.legendCheck();
  }
  round(num) {
    var no = this.pres(num,1);
    if (no==0) return '';
    return no;
  }
  legendCheck() {
    if (this.view[0]> 500) {
      this.legend = true;
    } else {
      this.legend = false;
    }
  }
  pres(value, precision) {
    var multiplier = Math.pow(10, precision || 0);
    return Math.round(value * multiplier) / multiplier;
  }
}
