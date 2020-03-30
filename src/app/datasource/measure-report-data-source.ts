import {DataSource} from '@angular/cdk/table';

import {BehaviorSubject, Observable} from 'rxjs';
import {IMeasureReport} from "@ahryman40k/ts-fhir-types/lib/R4";
import {MatSort} from "@angular/material/sort";


export class IMeasureReportDataSource extends DataSource<any> {
  constructor(
              public reports: IMeasureReport[],
              private _sort: MatSort
  ) {
    super();
  }

  private dataStore: {
    reports: IMeasureReport[]
  };

  connect(): Observable<IMeasureReport[]> {

    console.log('data source.connect called');



    const _reports: BehaviorSubject<IMeasureReport[]> =<BehaviorSubject<IMeasureReport[]>>new BehaviorSubject([]);

    const displayDataChanges = [
      this.reports,
      this._sort.sortChange
    ];

    this.dataStore = { reports: [] };


    if (this.reports !== []) {
      for (const report of this.reports) {
        this.dataStore.reports.push(<IMeasureReport> report);
      }
      _reports.next(Object.assign({}, this.dataStore).reports);

    }
   return _reports.asObservable();
  }



  disconnect() {}
}
