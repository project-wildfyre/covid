import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent implements OnInit {

  datasourceMarkdown: string = `
  ## About

   This site is populated from two sources of information:

   * [Public Health England](https://www.gov.uk/government/publications/covid-19-track-coronavirus-cases)
   * [NHS Pathways and 111 online Potential Symptoms](https://digital.nhs.uk/data-and-information/publications/statistical/mi-potential-covid-19-symptoms-reported-through-nhs-pathways-and-111-online/latest)
   * Office for National Statistics - for UK organisational and geographic data.

<br>
   This sources are updated daily and export the data using a mixture of Comma Separated Values (CSV) and Excel files.
   The formats are quite difficult for an application to work with directly, so they are converted into a modern health standard called [HL7 FHIR](https://www.hl7.org/fhir/).
   An open source [HAPI FHIR server](https://hapifhir.io/) is used to store the data and can be queried directly (the FHIR server endpoint is [https://fhir.test.xgenome.co.uk/R4/](https://fhir.test.xgenome.co.uk/R4/))

   Unfortunately this site does not contain detailed information of Wales, Northern Ireland or Scotand. Sites where this information is available include:

   * [Public Health Wales](https://public.tableau.com/profile/public.health.wales.health.protection#!/vizhome/RapidCOVID-19virology-Public/Headlinesummary)
   * [Scottish Government](https://www.gov.scot/coronavirus-covid-19/)

<br>
   Also of note is the COVID Symptoms tracker:

   * [COVID Symptom Tracker](https://covid.joinzoe.com/data)
   * [COVID-19 World Statistics](https://www.worldometers.info/coronavirus/)

 `;

  technicalMarkdown: string = `
  ## Technical Resources

  The use of FHIR MeasureReports in the API was influenced by international efforts around COVID. One of the main forums is:

  * [FHIR Chat COVID-19](https://chat.fhir.org/#narrow/stream/226195-Covid-19-Response)

  ### COVID-19 Clinical Coding

  This server uses a small element of clinical codes (they may not be correct and feedback is welcome). Sources I've found on this subject are:

  * [Logica COVID-19](https://covid-19-ig.logicahealth.org/index.html) This is US healthcare provider site. Pathology, LOINC and SNOMED CT
  * [NHS Digital and PRSB](https://hscic.kahootz.com/connect.ti/COVID19_info_sharing/grouphome) Pathology, ICD-10 and SNOMED CT

  `;
  constructor() { }

  ngOnInit(): void {
  }

}
