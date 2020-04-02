import {Component, OnInit, ViewChild} from '@angular/core';
import {MatTableDataSource} from "@angular/material/table";
import {MatSort} from "@angular/material/sort";
import {BrowserService} from "../service/browser.service";
import {TdLoadingService} from "@covalent/core/loading";
import {Case} from "../body/body.component";
import {R4} from "@ahryman40k/ts-fhir-types";
import {ActivatedRoute, Router} from "@angular/router";
import {IMeasureReport} from "@ahryman40k/ts-fhir-types/lib/R4";


export interface Nhs111 {
  name: string;
  cases: number;
  id : string;
}

@Component({
  selector: 'app-nhs-oneoneone',
  templateUrl: './nhs-oneoneone.component.html',
  styleUrls: ['./nhs-oneoneone.component.scss']
})
export class NhsOneoneoneComponent implements OnInit {

  totalSymptoms : any[] =[
    {
      "name": "UK",
      "value": 0
    }
  ];
  totalSuspected: any[] =[
    {
      "name": "UK",
      "value": 0
    }
  ];

  dailySymptoms: any[] = [
    {
      "name": "Area",
      "series": [
      ]
    }
  ];
  dailySuspected: any[] = [
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

  displayedColumns = ['name', 'cases','casespermillion', 'population', 'healthindex',  'depravityindex','perkmsq', 'populationkmsq'];

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

    var today = new Date() ;

    this.view = [(window.innerWidth / 2)*0.97, this.view[1]];
    this.aview = [(window.innerWidth)*0.98, this.aview[1]];
    today.setDate(today.getDate()-2);
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = today.getFullYear();

    this.todayStr = yyyy+ '-' + mm + '-' + dd;
    console.log(this.todayStr);
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

    this.fhirService.get('/MeasureReport?measure=21264&reporter.partof.identifier='+region+'&_count=100&_sort=period&date=le'+this.todayStr).subscribe(
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

    this.totalSymptoms = [];
    this.totalSuspected = [];
    this.dailySuspected = [];
    this.dailySymptoms = [];
    this.caseTable = [];
    for (let entry of this.cases.entries()) {
      var entSymptom :any = {};
      var entSuspected: any = {};

      entSymptom.name = entry[0];
      entSymptom.series = [];
      entSuspected.name = entry[0];
      entSuspected.series = [];

      var reps : IMeasureReport[] = entry[1];
      for (const rep of reps) {
        var ids = rep.identifier[0].value.split('-');
        var id = ids[0];
        var valTot :any = {};
        var dat = rep.date.split('T');
        rep.reporter.display = rep.reporter.display.replace('NHS England ','');
        valTot.name = new Date(dat[0]);
        entSymptom.name = rep.reporter.display;
        entSuspected.name = rep.reporter.display;
        var symptom = 0;
        var suspected = 0;

        for (const gp of rep.group) {
          if (gp.code.coding[0].code == '840544004') {
            suspected=gp.measureScore.value;
          }
          if (gp.code.coding[0].code == 'online-total') {
            symptom=gp.measureScore.value;
          }
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
        entSuspected.series.push(susday);
        entSymptom.series.push(symday);

        if (rep.date.startsWith(this.todayStr)) {
          var sus = {
            name : rep.reporter.display,
            value : suspected,
            extra : {
              id : id
            }
          };
          this.totalSuspected.push(sus);
          var sym = {
            name : rep.reporter.display,
            value : symptom,
            extra : {
              id : id
            }
          };
          this.totalSymptoms.push(sym);

        }
      }
      this.dailySymptoms.push(entSymptom);
      this.dailySuspected.push(entSuspected);
    }
    //console.log(JSON.stringify(this.totalSuspected));
    this.dataSource.data = this.caseTable;
    this.dataSource.sort = this.sort;
    this._loadingService.resolve('overlayStarSyntax');
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
  }
}
