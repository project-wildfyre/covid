import {EventEmitter, Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {Observable} from "rxjs";
import {environment} from "../../environments/environment";

export enum Formats {
    JsonFormatted = 'jsonf',
    Json = 'json',
    Xml = 'xml',
    EprView = 'epr'
}

export interface Location {
  code: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class BrowserService {


    private resource: any;

    private location : Location = {
      code: 'E92000001',
      name: 'England'
    };

    private format: Formats = Formats.JsonFormatted;

    private rawResource: string;

    private resourceChange: EventEmitter<any> = new EventEmitter();
    private rawResourceChange: EventEmitter<any> = new EventEmitter();
    private validationChange: EventEmitter<any> = new EventEmitter();


    public locationChange: EventEmitter<Location> = new EventEmitter();

    constructor(private http: HttpClient) {

    }

    public getResource(search: string): Observable<any> {

        const url = environment.config.baseUrl + search;
        let headers = new HttpHeaders(
        );

        if (this.format === 'xml') {
            headers = headers.append('Content-Type', 'application/fhir+xml');
            headers = headers.append('Accept', 'application/fhir+xml');
            return this.http.get(url, {headers, responseType: 'blob' as 'blob'});
        } else {
            return this.http.get<any>(url, {'headers': this.getHeaders(true)});
        }
    }


    triggerGetRawResource() {
        return this.getRawResourceChangeEmitter().emit(this.rawResource);
    }



    getRawResourceChangeEmitter() {
        return this.rawResourceChange;
    }

    getResourceChangeEmitter() {
        return this.resourceChange;
    }

    getValidationChangeEmitter() {
        return this.validationChange;
    }


    setResource(result) {
        this.resource = result;
        this.resourceChange.emit(result);
    }


    setRawResource(resource) {
        this.rawResource = resource;
        this.getRawResourceChangeEmitter().emit(this.rawResource);
    }

  setLocation(location : Location) {

      this.location  = location;
      this.locationChange.emit(location);
  }
    getLocation() {
      return this.location;
    }



    public postContentType(resource: string, body: any, contentType): Observable<any> {

        let headers: HttpHeaders = this.getHeaders(false);
        headers = headers.append('Content-Type', contentType);
        headers = headers.append('Accept', 'application/fhir+json');

        return this.http.post<any>(environment.config.baseUrl + resource, body, {headers: headers});
    }

    getHeaders(contentType: boolean = true): HttpHeaders {

        let headers = new HttpHeaders(
        );
        if (contentType) {
            headers = headers.append('Content-Type', 'application/fhir+json');
            headers = headers.append('Accept', 'application/fhir+json');
        }
        return headers;
    }

    public get(search: string): Observable<any> {

        const url: string = environment.config.baseUrl + search;
        let headers = new HttpHeaders(
        );

        if (this.format === 'xml') {
            headers = headers.append('Content-Type', 'application/fhir+xml');
            headers = headers.append('Accept', 'application/fhir+xml');
            return this.http.get(url, {headers, responseType: 'blob' as 'blob'});
        } else {
            return this.http.get<any>(url, {'headers': headers});
        }
    }

}
