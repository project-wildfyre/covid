import {Component, HostListener, OnInit, ViewChild} from '@angular/core';
import {BrowserService} from "../service/browser.service";
import {R4} from "@ahryman40k/ts-fhir-types";
import {IMeasureReport} from "@ahryman40k/ts-fhir-types/lib/R4";
import {TdLoadingService} from "@covalent/core/loading";
import {IMeasureReportDataSource} from "../datasource/measure-report-data-source";
import {MatSort, Sort} from "@angular/material/sort";
import {MatTableDataSource} from "@angular/material/table";


export interface Case {
  name: string;
  population: number;
  cases: number;
  casespermillion: string;
}

@Component({
  selector: 'app-body',
  templateUrl: './body.component.html',
  styleUrls: ['./body.component.scss']
})
export class BodyComponent implements OnInit {

  totalCases: any[] =[
    {
      "name": "UK",
      "value": 0
    }
  ];
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
  view: any[] = [500, 450];

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

  caseTable :Case[] = [];

  dataSource = new MatTableDataSource(this.caseTable);

  displayedColumns = ['name', 'population','cases','casespermillion'];

  todayStr: string;

  @ViewChild(MatSort, {static: false}) sort: MatSort;

  constructor(private fhirService: BrowserService,
              private _loadingService: TdLoadingService) {

  }

  ngOnInit(): void {
    var today = new Date() ;
    console.log('innerWidth initial = '+window.innerWidth);
    this.view = [(window.innerWidth / 2)*0.97, 450];
    today.setDate(today.getDate()-1);
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = today.getFullYear();

    this.todayStr = yyyy+ '-' + mm + '-' + dd;

    this.populate('E92000001');
  }

  round(num) {
    return this.pres(num,1);
  }

  pres(value, precision) {
    var multiplier = Math.pow(10, precision || 0);
    return Math.round(value * multiplier) / multiplier;
  }
  populate(region ) {
    this.multiCasesPerMillion = [];
    this.multiTotalCases = [];
    this.cases = new Map();
    this._loadingService.register('overlayStarSyntax');

    this.fhirService.get('/MeasureReport?reporter.partof.identifier='+region+'&_count=100&_sort=period&date=le'+this.todayStr).subscribe(
      result => {
        const bundle = <R4.IBundle> result;
        this.processBundle(bundle);
        //this.dataSource = new QuestionnaireDataSource(this.fhirService,  this.questionnaires);
      }
    );
  }

  sortData(sort: Sort) {
    console.log(sort);
/*
    this.sortedData = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'name': return compare(a.name, b.name, isAsc);
        case 'calories': return compare(a.calories, b.calories, isAsc);
        case 'fat': return compare(a.fat, b.fat, isAsc);
        case 'carbs': return compare(a.carbs, b.carbs, isAsc);
        case 'protein': return compare(a.protein, b.protein, isAsc);
        default: return 0;
      }
    });*/
  }

  selected(event) {
 //   console.log(event);
    this.populate(event.value);
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
    }
  }

  buildGraph() {
    this.multiTotalCases =  [];
    this.multiCasesPerMillion = [];
    this.totalCases =[];
    this.caseTable = [];
    for (let entry of this.cases.entries()) {
      var entTot :any = {};
      var entPer: any = {};
      entTot.name = entry[0];
      entTot.series = [];
      entPer.name = entry[0];
      entPer.series = [];
      var reps : IMeasureReport[] = entry[1];
      for (const rep of reps) {
          var valTot :any = {};
          var dat = rep.date.split('T');

          valTot.name = new Date(dat[0]);
          entTot.name = rep.subject.display;

          valTot.value = rep.group[0].measureScore.value;
          entTot.series.push(valTot);

        var valPer:any = {};

        valPer.name = new Date(dat[0]);
        entPer.name = rep.subject.display;
        entPer.name = rep.subject.display;
        valPer.value = rep.group[1].measureScore.value;
        entPer.series.push(valPer);
        if (rep.date.startsWith(this.todayStr)) {
          // TODO  this.reports.push(rep);
          var report : Case = {
            name : rep.subject.display,
            population : rep.group[0].population[0].count,
            cases : valTot.value,
            casespermillion : valPer.value
          };
          this.caseTable.push(report);
          var tot = {
            name : rep.subject.display,
            value : valTot.value
          }
          this.totalCases.push(tot);
        }
      }
      this.multiTotalCases.push(entTot);
      this.multiCasesPerMillion.push(entPer);

    }
   // this.dataSource = new IMeasureReportDataSource(this.reports, this.sort);
    this.dataSource.data = this.caseTable;
    this.dataSource.sort = this.sort;
    this._loadingService.resolve('overlayStarSyntax');
  }
  onSelect(data): void {
   // console.log('Item clicked', JSON.parse(JSON.stringify(data)));
  }

  onActivate(data): void {
   // console.log('Activate', JSON.parse(JSON.stringify(data)));
  }

  onDeactivate(data): void {
  //  console.log('Deactivate', JSON.parse(JSON.stringify(data)));
  }
  onResize(event) {
    //console.log(event);
    //console.log(event.target.innerWidth);
    this.view = [(event.target.innerWidth / 2)*0.97, 450];
  }

  /*
  @HostListener('window:resize', ['$event'])
  getScreenSize(event?) {
    //this.screenHeight = window.innerHeight;
    //this.screenWidth = window.innerWidth;
    console.log('innerWidth = '+window.innerWidth);
  }

   */
}
