import {Component, OnInit, ViewChild} from '@angular/core';
import {MatTableDataSource} from "@angular/material/table";
import {MatSort} from "@angular/material/sort";
import {BrowserService} from "../service/browser.service";
import {TdLoadingService} from "@covalent/core/loading";
import {R4} from "@ahryman40k/ts-fhir-types";
import {ActivatedRoute, Router} from "@angular/router";
import {IMeasureReport} from "@ahryman40k/ts-fhir-types/lib/R4";


export interface Nhs111 {
  name: string;
  triagetotal: number;
  onlinetotal : number;
  maletotal : number;
  femaletotal : number;
  maletotalonline : number;
  femaletotalonline : number;
  population : number;
  triagetotalpermillion: number;
  onlinetotalpermillion : number;
  triagedayper: number;
  onlinedayper : number;
  id : string;
}

@Component({
  selector: 'app-nhs-oneoneone',
  templateUrl: './nhs-oneoneone.component.html',
  styleUrls: ['./nhs-oneoneone.component.scss']
})
export class NhsOneoneoneComponent implements OnInit {

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

  totalOnlinePM : any[] =[
    {
      "name": "UK",
      "value": 0
    }
  ];
  totalTriagedPM: any[] =[
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
  dailyTriaged: any[] = [
    {
      "name": "Area",
      "series": [
      ]
    }
  ];


  view: any[] = [500, 350];
  aview: any[] = [700,200];

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
    'triagetotalpermillion',
    'onlinetotalpermillion',
    'triagedayper',
    'onlinedayper',
    'population',
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

    this.fhirService.get('/MeasureReport?measure=21264&subject.partof.identifier='+region+'&_count=100&_sort:desc=period').subscribe(
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
    this.totalOnlinePM = [];
    this.totalTriagedPM = [];
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
        var symptompermillion = undefined;
        var suspectedpermillion = undefined;
        var dayonline=0;
        var daytriage=0;
        var dayonlineper=undefined;
        var daytriageper=undefined;

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
        }
        if (pop > 0) {
          suspectedpermillion = Math.round((suspected / pop) * 1000000);
         // console.log(suspectedpermillion);
          symptompermillion = Math.round((symptom / pop) * 1000000);
          dayonlineper = Math.round((dayonline/pop) * 1000000);
          daytriageper = Math.round((daytriage/pop) * 1000000);
        }

        var susday = {
          name : new Date(dat[0]),
          value : suspected,
          extra : {
            id : id
          }
        };
        var symday = {
          name : new Date(dat[0]),
          value : symptom,
          extra : {
            id : id
          }
        };

        entTriaged.series.push(susday);
        entOnline.series.push(symday);

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

          if (suspectedpermillion !== undefined) {
            var susPM = {
              name: rep.subject.display,
              value: suspectedpermillion,
              extra: {
                id: id
              }
            };
            this.totalTriagedPM.push(susPM);
          }

          if (symptompermillion !== undefined) {
            var symPM = {
              name: rep.subject.display,
              value: symptompermillion,
              extra: {
                id: id
              }
            };
            this.totalOnlinePM.push(symPM);
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
            triagetotalpermillion: suspectedpermillion,
            onlinetotalpermillion: symptompermillion,
            onlinedayper: dayonlineper,
            triagedayper: daytriageper,
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
    if (event !== undefined && event.extra !== undefined && !event.extra.id.startsWith('E38') ) {
      var location = {code: event.extra.id, name: event.name};

      if (location !== undefined) {
        this.router.navigate(['/nhs111',event.extra.id]);

      }
    }
  }

  onResize(event) {
    this.aview = [(event.target.innerWidth)*0.98,  this.aview[1]];
    this.view = [(event.target.innerWidth / 2)*0.97,  this.view[1]];
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
