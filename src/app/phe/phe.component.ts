import {Component, HostListener, OnInit, ViewChild} from '@angular/core';
import {BrowserService, Location} from "../service/browser.service";
import {R4} from "@ahryman40k/ts-fhir-types";
import {IMeasureReport} from "@ahryman40k/ts-fhir-types/lib/R4";
import {TdLoadingService} from "@covalent/core/loading";
import {MatSort} from "@angular/material/sort";
import {MatTableDataSource} from "@angular/material/table";
import {ActivatedRoute, Router} from "@angular/router";
import * as shape from 'd3-shape';
import {TdMediaService} from "@covalent/core/media";
import {MatDrawer} from "@angular/material/sidenav";
import {ILocation} from "@ahryman40k/ts-fhir-types/lib/R4/Resource/RTTI_Location";

import {std} from "mathjs";
import {HttpClient} from "@angular/common/http";
import * as echarts from 'echarts';
import {TdChartSeriesMapComponent} from "@covalent/echarts/map";

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

  newCases :any[] = [];
  dailyChange: any[] = [
    {
      "name": "Area",
      "series": [
      ]
    }
  ];
  dailyChangeRate: any[] = [
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

  dailyCasesReference: any [] = [{
    "name": "UK",
    "value": 0
  }
  ];

  public location: Location = undefined;
  public locations: Location[] = [
  ];

  public regionName = "";
  public regionCode = "";

  public UKJson = undefined;



  public strMapData = "[" +
    "]";
  public rawMapData: any[];



  @ViewChild(MatSort, {static: false}) sort: MatSort;
  @ViewChild(MatDrawer, {static: false}) drawer: MatDrawer;

  @ViewChild(TdChartSeriesMapComponent, {static: false}) chart: TdChartSeriesMapComponent;

  constructor(private fhirService: BrowserService,
              private route: ActivatedRoute,
              private router: Router,
              public media : TdMediaService,
              private _loadingService: TdLoadingService,
              private http: HttpClient) {

  }
  ngOnInit() {
  //
    this.view = [(window.innerWidth / 2)*0.97, this.view[1]];
    this.bview = [(window.innerWidth)*0.96, this.bview[1]];
    this.aview = [(window.innerWidth)*0.98, this.aview[1]];
    this.legendCheck();
    this.doSetup();
    this.setRegionName(this.currentRegion);

    this.route.url.subscribe( url => {
      this.doSetup();
    });

    this.fhirService.locationChange.subscribe(location => {
      this.setRegionName(location.code);

    });

    this.http.get('https://c19pub.azureedge.net/regions.geojson').subscribe(json => {
      var stringified = JSON.stringify(json);
    //  stringified = stringified.replace('"rgn18cd"', '"name"');
      stringified = stringified.split('"rgn18cd"').join('"name"')
      this.UKJson = JSON.parse(stringified);
      echarts.registerMap('UK', this.UKJson);
    })

  }



  setRegionName(onsCode) {
    this.regionCode = onsCode;
    this.fhirService.get("/Location?identifier="+onsCode).subscribe(result => {
      const bundle = <R4.IBundle> result;
      for(const entry of bundle.entry) {
        var fd: ILocation = <ILocation> entry.resource;
        this.regionName= this.nameFix(fd.name);
        if (fd.partOf != undefined && fd.partOf.identifier != undefined) {
          this.getParentLocation(fd.partOf.identifier.value);
        } else {
          this.location = {code:'E92000001', name:'England'};
        }
      }

    })
  }
  getParentLocation(onsCode) {
    this.fhirService.get("/Location?identifier="+onsCode).subscribe(result => {
      const bundle = <R4.IBundle> result;
      for(const entry of bundle.entry) {
        var fd: ILocation = <ILocation> entry.resource;
        this.location = {
          name: fd.name,
          code: fd.identifier[0].value
        }
      }

    })
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

  selected2(location) {

    if (location !== undefined) {
      this.router.navigate(['/phe',location.code]);
    }
  }
  selected(location) {

    if (location !== undefined) {
     this.selected2(location);
      this.drawer.toggle();
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
    var d = new Date();
    var daysago =  new Date(d.setDate(d.getDate() - 4));

    if (region.startsWith('E12') || region.startsWith('E92')) {
      fhirSearchUrl = '/MeasureReport?measure=21263'+
        '&subject.partof.identifier='+region+
        '&_count=100'+
        '&_sort:desc=period'+
        '&date=gt2020-03-09' +
        '&date=le'+daysago.toISOString().split('T')[0];
    } else {
      fhirSearchUrl = '/MeasureReport?measure=21263'+
        '&subject.identifier='+region+
        '&_count=100'+
        '&_sort:desc=period'+
        '&date=gt2020-03-09'+
        '&date=le'+daysago.toISOString().split('T')[0];
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
    } else {
      this.buildGraph();
    }
  }

  buildGraph() {

    this.locations = [];

    this.cases =  [];
    this.casesPer100k = [];
    this.totalCases =[];
    this.totalCases100k = [];
    this.caseTable = [];
    this.newCases = [];

    var mapData:any = [];
  //  var today = undefined;
    for (let entry of this.caseMap.entries()) {
      var entTot :any = {};
      var entPer: any = {};
      entTot.name = entry[0];
      entTot.series = [];
      entPer.name = entry[0];
      entPer.series = [];

      var reps : IMeasureReport[] = entry[1];
      for (const rep of reps) {

        var id = rep.subject.identifier.value;
        var valTot: any = {};
        var dat = rep.date.split('T');

        valTot.name = new Date(dat[0]);
        entTot.name = rep.subject.display;
        valTot.extra = {
          id: id
        };

        entTot.extra = {
          id: id
        };

        valTot.value = rep.group[0].measureScore.value;
        entTot.series.push(valTot);

        var valPer: any = {};

        valPer.name = new Date(dat[0]);
        entPer.name = rep.subject.display;
        entPer.name = rep.subject.display;
        if (rep.group[1].measureScore != undefined) {
          valPer.value = rep.group[1].measureScore.value / 10;
        } else { valPer.value = 0; }
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
          mapData.push( {
            name: rep.subject.identifier.value,
            value: 12, //valPer.value,
            label: {
              name: 'Jorvik Republic'
            },
            itemStyle:{ borderColor : "#777",  color: '#F06C00' }
          });
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
    this.rawMapData=[];
    this.rawMapData.push(mapData);

    var dailyChangeMap = new Map();
    var dailyChangeRatioMap = new Map();
    var dailyChangeRatioTotalMap = new Map();

    // Calculate changes

    for(var ser of this.cases) {

      var dailyEntry: any = {
        name : ser.name,
        series: [],
        extra : {
          id : ser.extra.id
        }
      };
      this.locations.push({
        name: ser.name,
        code: ser.extra.id
      });

      var lastCase = 0;
      var first : boolean =true;

      ser.series.slice().reverse().forEach(entry => {
        if (!dailyChangeMap.has(ser.name.valueOf())) {
          dailyChangeMap.set(ser.name.valueOf(),[]);
       //   console.log(ser.name);
        }
        var dailyChange  = dailyChangeMap.get(ser.name.valueOf());


        var change: number = (entry.value - lastCase);
        if (!first) {
          var daily = {
            name: entry.name,
            value: change,
            extra : {
              id : ser.extra.id
            }
          };
          dailyEntry.series.push(daily);

          dailyChange.push({
            name: entry.name,
            value: change,
            extra : {
              id : ser.extra.id
            }
          });
        }
        first = false;
        lastCase = entry.value;
      });

      // Similar to above section but after the difference
      var lastRatioEntry:any = undefined;
      lastCase = 0;
      first = true;
      ser.series.slice().forEach(entry => {

        if (!dailyChangeRatioMap.has(ser.name.valueOf())) {
          dailyChangeRatioMap.set(ser.name.valueOf(),[]);
        }
        var dailyChangeRatio  = dailyChangeRatioMap.get(ser.name.valueOf());

        var change: number = (entry.value - lastCase);
        var daily = {
          name: new Date(entry.name),
          value: change,
          extra : {
            id : ser.extra.id,
            name : ser.name
          }
        };
        if (lastRatioEntry != undefined) {
          var dailyRatio = change- lastRatioEntry.value;

          var dailyRatioEntry = {
            name: entry.name,
            value: dailyRatio,
            extra : {
              id : ser.extra.id,
              name : ser.name
            }
          };
          if (dailyRatio != undefined && !first) {

            if (!dailyChangeRatioTotalMap.has(entry.name.valueOf())) {
              dailyChangeRatioTotalMap.set(entry.name.valueOf(),dailyRatio);
            } else {
              dailyChangeRatioTotalMap.set(entry.name.valueOf(),dailyRatio + dailyChangeRatioTotalMap.get(entry.name.valueOf()));
            }

            dailyChangeRatio.push(dailyRatioEntry);
          } else {
            first = false;
          }
        }
        lastRatioEntry = daily;
        lastCase = entry.value;
      });
    }

    this.dailyChangeRate = [];
    dailyChangeRatioMap.forEach((value, key) => {
      var dailyEntryRate: any = {
        name : 'insert name here',
        extra: {},
        series : []
      };
      var lastDailyEntry: any = {};
      value.forEach(change => {
         dailyEntryRate.name = change.extra.name;
         dailyEntryRate.extra.id = change.extra.id;

         var day = new Date(change.name);
        day.setDate(day.getDate() + 2);

         change.name = day;
         dailyEntryRate.series.push(change);
      });
      this.dailyChangeRate.push(dailyEntryRate);
    });


    // copy daily new cases map into ngx graph object
    dailyChangeMap.forEach((value, key) => {
      var byUA = {
        name : key,
        series : []
      };
      value.forEach(change => {
         byUA.series.push(change);
      });
      this.newCases.push(byUA)
    });

    var total = 0;
    var cnt = (this.caseMap.size);
    var avg =[];

    dailyChangeRatioTotalMap.forEach( (value, key) => {
      avg.push(value/cnt);
    });
    avg.forEach(value => {
      total += value;
    });


    var stdv = std(avg);
    var avgSeries = total/avg.length;
    this.dailyCasesReference = [];
    this.dailyCasesReference.push({
      name : '0',
      value : avgSeries
    });
    this.dailyCasesReference.push({
      name : '+',
      value : avgSeries+stdv
    });
    this.dailyCasesReference.push({
      name : '-',
      value : avgSeries-stdv
    });


    this.dataSource.data = this.caseTable;
    this.dataSource.sort = this.sort;
    this._loadingService.resolve('overlayStarSyntax');

   // console.log(this.strMapData);
  }
  tooltip(params) {
    //console.log(params);
  //  console.log(this.chart.data);
    if (this.chart.data.length> (params.dataIndex -1)){
    //  console.log(this.chart.data[params.dataIndex-1].value);
   // this.chart.
    }
    //return this.chart.data[params.dataIndex-1].value;
    return params.dataIndex;
  }
  mapClick(event) {
    console.log(event);
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


  /*
  @HostListener('window:resize', ['$event'])
  getScreenSize(event?) {
    //this.screenHeight = window.innerHeight;
    //this.screenWidth = window.innerWidth;

  }

   */
}
