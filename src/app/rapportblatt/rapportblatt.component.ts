import { Component, OnInit } from '@angular/core';
import { of, Observable } from "rxjs"
import  { flatMap, map, tap } from "rxjs/operators"
import {
  UserService,
  TableService,
  ExcelService,
  ImageHandlerService,
  SendService,
  AutoCompleteService
} from '../_services';
import { ZiviData } from '../models/zivi.model'

import {RapportblattTable, Row} from "../models/rapportblatt.model"


interface SimpleRequest {
  message: string,
  success: boolean
}
interface SendRbResponse {
  data: any;
  message: string;
  success: boolean;
}
interface ValidationObj {
  valid: boolean;
  message: string;
  sourceRow: number;
}

@Component({
  selector: 'app-rapportblatt',
  templateUrl: './rapportblatt.component.html',
  styleUrls: ['./rapportblatt.component.sass']
})
export class RapportblattComponent implements OnInit {
  rows: Row[]
  sendError: string
  ziviData: ZiviData
  monthString: string
  today: string
  ziviName: string
  summary: any
  loading: boolean;
  dayTypeNames: any;
  rowErrorMessages: any = {}
  ticketProofsRemarced: boolean = false
  sendMeToo: boolean
  currentSlideshowImage: string
  slideShowIsOpen: boolean

  constructor(private user: UserService,
    private table: TableService,
    private excel: ExcelService,
    private imageHandler: ImageHandlerService,
    private s: SendService,
    private autoComplete: AutoCompleteService) { 
      this.rows = []
    }

  ngOnInit() {
    this.loading = true
    this.slideShowIsOpen = false
    this.sendMeToo = true
    this.monthString = this.table.getMonthString(new Date())
    this.ziviData = this.user.getZiviData();
    this.monthChanged(this.monthString)
    this.today = this.table.getDateString(new Date());
    this.ziviName = [this.ziviData.name.firstName, this.ziviData.name.lastName].join(' ');
    this.dayTypeNames = {
      "krankTage": "Krankheitstage",
      "freiTage": "Freitage",
      "ferienTage": "Ferientage",
      "urlaubstage": "Urlaubstage",
      "arbeitsTage": "Arbeitstage"
    }
    this.rows.indexOf(this.rows.filter( row => {
      const dateParts = row.date.split("."),
            y = parseInt("20"+dateParts[2]),
            m = parseInt(dateParts[1]) - 1,
            d = parseInt(dateParts[0]),
            date = new Date(y, m ,d)
      if( sameDay(date, new Date()) ) {
        return true
      } else {
        return false
      }
    })[0])

    setTimeout( () => {
      this.scrollToCurrentDay()
    }, 1000)
  }

  workPlaceOptions( thisRowIndex: number ){
    return this.autoComplete.updateOptions(this.rows, thisRowIndex, "workPlace")
  }
  routeStartOptions( thisRowIndex: number ){
    return this.autoComplete.updateOptions(this.rows, thisRowIndex, "start", [], "route")
  }
  destinationOptions( thisRowIndex: number ){
    return this.autoComplete.updateOptions(this.rows, thisRowIndex, "destination", [], "route")
  }
  priceOptions( thisRowIndex: number ){
    return this.autoComplete.updateOptions(this.rows, thisRowIndex, "price", ["5.5","6.5"])
  }
  
  monthChanged(monthString): void {

    this.loading = true
    this.monthString = monthString;
    this.getTable(this.monthString).subscribe(res => {
      this.rows = res
      this.rows.map( row => {
        if( !row.medicalCertificate ) {
          row.medicalCertificate = []
        }
      })
      console.log(this.rows)
    });
    this.loading = false
  }
  getTable(monthS: string): Observable<Row[]> {
    // default rows config
    let loadedRows: Row[] = []
    if( monthS ) {
      const ziviDataSnap = this.user.getZiviData()
      const locallyStoredRB = localStorage.getItem('savedRapportblatt');

      const defaultRows = this.table.getTableData(ziviDataSnap, monthS);
      loadedRows = this.table.filterTable(defaultRows, ziviDataSnap.date)
      
      // If there is no RB saved Locally
      if ( locallyStoredRB === null ) {
        return this.getRblOnline(defaultRows, monthS, ziviDataSnap).pipe(map( loadedRows => {

          if(loadedRows.length !== defaultRows.length) {
            // The saved RB is too small
            console.log("the saved RB is too small")
            loadedRows = loadedRows.concat(defaultRows.slice(loadedRows.length))
          }
          this.loading = false
          localStorage.setItem('savedRapportblatt', 
            JSON.stringify({
            month: monthS,
            rbData: loadedRows
          }));
          return loadedRows
        }))
      } else {
        const savedRb = JSON.parse(locallyStoredRB);
        
        if ( savedRb.month  === monthS ) {
          console.log(savedRb)
          loadedRows = this.table.filterTable(savedRb.rbData, ziviDataSnap.date);
          
          if(loadedRows.length !== defaultRows.length) {
            // The saved RB is too small
            console.log("the saved RB is too small")
            loadedRows = loadedRows.concat(defaultRows.slice(loadedRows.length))
          }
          this.loading = false
          
          console.log('RB loaded locally!');
          return of(loadedRows)
        } else {
          return of(loadedRows)
        }
      }
    }else{
      console.log("There was no Month input!")
      return of(loadedRows)
    }
  }
  getRblOnline(defaultRows: Row[], monthS: string, ziviDataSnap: ZiviData): Observable<Row[]> {
    return this.user.getSavedRapportblatt(monthS).pipe(flatMap(savedRapportblatt => {
      
      let loadedRows: Row[] = []
      if (savedRapportblatt.success) {
          if ( savedRapportblatt.data.month === monthS ) {
            console.log(savedRapportblatt)
            loadedRows = this.table.filterTable(savedRapportblatt.data.rbData, ziviDataSnap.date);
          }
      }

      return of(loadedRows)
    }));
  }

  validateTable(rows: Row[]): ValidationObj[]{
    // Validates the table data and fixes small errors in the data like e.g
    // When there is still a workPlace defined even though the user had a free day
    let validArray: ValidationObj[] = []

    let i = 0;
    for(let row of rows) {
      let validationObj: ValidationObj = {
        valid: true,
        message: "",
        sourceRow: i
      }
      switch(row.dayType){
        case "Arbeitstag":
          if( !row.workPlace || row.workPlace === "" ){
            validationObj.valid = false
            validationObj.message = "Sie müssen einen Arbeitsort eingeben."
            validationObj.sourceRow = i
          }else if( row.spesenChecked === true ) {
            // If the user has checked the spesenInputs there must be inputs
            if( (!row.route.start || row.route.start === "") 
              || (!row.route.destination || row.route.destination === "") ) {
                validationObj.valid = false
                validationObj.message = "Sie müssen einen Abfahrts- und einen Zielort eingeben."
                validationObj.sourceRow = i
            }else if( !row.price || row.price === "" || row.price === "0"){
              validationObj.valid = false
              validationObj.message = "Sie müssen einen Preis für Ihr Billet eingeben."
              validationObj.sourceRow = i
            }else if( row.ticketProof.length == 0 ) {
              if(!this.ticketProofsRemarced)
              {
                validationObj.valid = false
                validationObj.message = `Laden Sie bitte entweder einen Billet-Beleg hier hoch, `+
                                          `oder schicken Sie ihn per Mail an verein@verein-gruenwerk.ch.`+
                                          ` Billette werden nur mit Beleg zurückerstattet!`
                validationObj.sourceRow = i
                this.ticketProofsRemarced = true
              }
            }
          }else{
            
            this.clearRow(i, ["dayType", "dayName", "date", "workPlace"])
          }
          break
        case "Frei":
        this.clearRow(i, ["dayType", "dayName", "date"])
          break
        case "Krank":
        this.clearRow(i, ["dayType", "dayName", "date", "medicalCertificate"])
          break
        case "Ferien":
        this.clearRow(i, ["dayType", "dayName", "date"])
          break
        case "Urlaub":
        this.clearRow(i, ["dayType", "dayName", "date"])
          break
      }
      validArray.push(validationObj);
      i++
    }
    return validArray;
  }
  clearRow(rowIndex, leaveTheSame: string[]) {
    for(const item in this.rows[rowIndex]) {
      if( leaveTheSame.indexOf(item) === -1 ) {
        if(typeof this.rows[rowIndex][item] === "string"){
          this.rows[rowIndex][item] = "";
        }else if(typeof this.rows[rowIndex][item] === "boolean"){
          this.rows[rowIndex][item] = false;
        }else if(Array.isArray(item)) {
          this.rows[rowIndex][item] = [];
        }
      }
    }
  }
  send() {
    const rapportblattData =  {
                                ziviName: this.ziviName,
                                firstName: this.ziviData.name.firstName,
                                lastName: this.ziviData.name.lastName,
                                table: this.rows,
                                summary: this.getSummary(),
                                month: this.monthString
                              };
    // Validate ToDo
    const rapportblattTableVal: ValidationObj[] = this.validateTable(this.rows);
    const rbIsValid = rapportblattTableVal.reduce( (previous: ValidationObj, valObj: ValidationObj) => {
      return {
        valid: valObj.valid && previous.valid,
        message: valObj.valid && previous.valid ? previous.message: valObj.message,
        sourceRow: valObj.valid && previous.valid ? previous.sourceRow: valObj.sourceRow
      }
    }, {valid: true, message:"", sourceRow: null})

    if ( rbIsValid.valid === true ) {
      
      const rowElements = document.getElementsByClassName("rapportBlattRow")
      for(let i=0; i < rowElements.length ;i++){
        rowElements[i].classList.remove("error")
      }
      this.save(false).subscribe( res => {
        if( res.success === true) {
          console.log(res.message)
        }
      })
      this.showLoader(true);
      this.showInputsChecked(false);

      //// TODO: add auto format change
      const fileName = [
                          "Rbl_Zivi",
                          rapportblattData["month"].split("-")[0].slice(-2),
                          rapportblattData["month"].split("-")[1],
                          rapportblattData["lastName"],
                          rapportblattData["firstName"],
                        ].join("_");

        const excel = { "file": this.excel.excelForUpload( this.excel.getExcelFile(rapportblattData, fileName) ),
                        "name": fileName}
        
        const images = this.imageHandler.getImages(this.rows)

        const ccMe = {
          yes: this.sendMeToo, 
          email: this.sendMeToo ? this.ziviData.email : null
        }
        this.s.sendRapportblatt({       excel:      excel,
                                        images,
                                        firstName:  rapportblattData.firstName,
                                        lastName:   rapportblattData.lastName,
                                        ccMe,
                                        abo:        this.ziviData.abo,
                                        month:      rapportblattData.month})
            .subscribe((data: SendRbResponse) => {

              this.showLoader(false);
              if ( data.success ) {
                this.showInputsChecked(true);
                  alert("Rapportblatt wurde erfolgreich verschickt!")
                this.sendError = '';
              }else{
                this.showInputsChecked( false );
                this.sendError = data.message;
                console.log(JSON.stringify( data ));
              }
            });
    }else{
      let firstErrorElement = null
      for(let rowVal of rapportblattTableVal) {
        const rowElement = document.getElementsByClassName("rowIndex" + rowVal.sourceRow)[0];
        if( !rowVal.valid ){
          if( !firstErrorElement ){
            // To scroll to the first element
            firstErrorElement = rowElement
          }
          rowElement.classList.add("error");
          this.rowErrorMessages[rowVal.sourceRow] = rowVal.message

          console.log(this.rowErrorMessages)
          firstErrorElement.scrollIntoView({ 
            behavior: 'smooth' 
          });
        }else{
          rowElement.classList.remove("error")
        }
      }
    }
  }

  save(show=true): Observable<SimpleRequest> {
    show ? this.showLoader(true) : null
    /** Saves the rows Object on the server and in localStorage**/
    return this.user.saveRapportblatt(this.rows, this.monthString).pipe(tap(data => {
      show ? this.showLoader(false) : null
      console.log(show)
      if( data.success === true ) {
        show ? this.showInputsChecked(true) : null
      }else {
        show ? this.showErrorIcon(true) : null
      }
    }));
  }
  saveImageInRows(file, rowIndex, imageType) {
    console.log(this.rows[rowIndex])
    const callback = (imageDataURL) => {
      if( this.rows[rowIndex][imageType].length > 0 ) {
        this.rows[rowIndex][imageType].push(imageDataURL)
      } else {
        this.rows[rowIndex][imageType] = [imageDataURL]
      }
    }
    this.imageHandler.scaleFile(file, callback)
  }
  onFileSelected(event, rowIndex) {
      let target = event.target;
      let filesOnTarget = target.files;
      for ( const file of filesOnTarget) {
        this.saveImageInRows(file, rowIndex, "ticketProof")
      }
  }
  
  onMCSelected(event, rowIndex) {
    let target = event.target;
    let filesOnTarget = target.files;
    for ( const file of filesOnTarget) {
      this.saveImageInRows(file, rowIndex, "medicalCertificate")
    }
}

  daySummary(sort = false) {
    const dayTypes = this.getSummary().dayTypes;
    const dayTypesArray = Object.keys(dayTypes)
      .map((key, index) => {
        return [key, dayTypes[key]];
      });
    function sortedArray(dayTypesArray) {
      return dayTypesArray.sort((a, b) => {
        if (a[1] < b[1]) {
          return 1;
        }
        if (a[1] < b[1]) {
          return -1;
        }
        return 0;
      });
    }
    return sort ? sortedArray(dayTypesArray) : dayTypesArray;
  }

  getSummary() {
    // Normalentschädigung ist 25Fr./Tag
    const normalPay = 25;
    const urlaubPay = 0;

    const spesenPreis: number = this.rows.reduce((previous, o) => {
      if (o['price'] &&
          o['price'] !== '' && 
          o['spesenChecked'] === true && 
          o['dayType'] === "Arbeitstag") {
            return previous + <number>parseInt(o['price']); 
          }
      return previous;
    }, 0);

    const pay = this.rows.reduce((previous, o) => {
      if (o['dayType'] !== 'Urlaub') { return previous + normalPay; }
      return previous;
    }, 0);

    const shoeMoney = this.isFirstMonth() ? this.calculateShoeMoney() : 0; // TODO: schuhgeld berechnung

    this.summary = {
      dayTypes:
      {
        krankTage: this.rows.reduce((previous, o) => (o['dayType'] === 'Krank')
          ? previous + 1
          : previous, 0),
        freiTage: this.rows.reduce((previous, o) => (o['dayType'] === 'Frei')
          ? previous + 1
          : previous, 0),
        ferienTage: this.rows.reduce((previous, o) => (o['dayType'] === 'Ferien')
          ? previous + 1
          : previous, 0),
        urlaubstage: this.rows.reduce((previous, o) => (o['dayType'] === 'Urlaub')
          ? previous + 1
          : previous, 0),
        arbeitsTage: this.rows.reduce((previous, o) => (o['dayType'] === 'Arbeitstag')
          ? previous + 1
          : previous, 0)
      },

      // total daily compensation
      compensation: pay,
      // Add all the 'Fahrspesen' up
      spesenPreis: spesenPreis,

      shoes: shoeMoney,

      total: spesenPreis + pay + shoeMoney
    };
    return this.summary;
  }

  showLoader(show: boolean) {
    
    showElement(show, '.loadingAnim')
    if (show === true) {
      this.showErrorIcon(false)
      this.showInputsChecked(false)
    }
  }
  showInputsChecked(show: boolean) {
    showElement(show, '.inputsChecked');
    if (show === true) {
      this.showLoader(false)
      this.showErrorIcon(false)
      setTimeout(() => showElement(false, '.inputsChecked'), 2000)
    }
  }
  showErrorIcon(show: boolean) {
    showElement(show, '.errorIcon')
    if (show === true) {
      this.showLoader(false)
      this.showInputsChecked(false)
    }
  }

  isFirstMonth(): boolean {

    if (this.monthString.split("-")[1] === this.ziviData.date.startDate.split("-")[1]) {
      return true
    } else {
      return false
    }
  }
  calculateShoeMoney(): number {
    // TODO: outsource these values for easier mnipulation
    const daysInGW: number = this.totalDaysServing(),
      shoeMoneyPerMonth = 60,
      monthLength = 26,
      maxMoney = 4 * 60

    let shoeMoney: number = shoeMoneyPerMonth * Math.floor(daysInGW / monthLength);
    if (shoeMoney <= maxMoney) {
      return shoeMoney;
    } else {
      return maxMoney
    }
  }
  totalDaysServing(): number{
    return Math.round( (new Date(this.ziviData.date.endDate).getTime()
                        - new Date(this.ziviData.date.startDate).getTime())
                        / ( 1000*60*60*24) );
  }
  getPercentage(a, b) { return b > 0 ? Math.floor(a / b * 100).toString() + '%' : '0%'; }

  toggleDropDown(event: Event) {
    const target = <HTMLInputElement>event.target;
    if (target.nextElementSibling !== null) {
      target.nextElementSibling.classList.toggle("invisible");
    }
  }
  disableDropDown(event: Event) {
    const target = <HTMLInputElement>event.target;
    //target.nextElementSibling.classList.add("windUp")
    setTimeout(() => {
      if (target.nextElementSibling !== null) {
        target.nextElementSibling.classList.add("invisible");
      }
    }, 200);
  }
  
  deleteImage( rowIndex, imageIndex ) {
    const imageToDel = this.rows[rowIndex].ticketProof[imageIndex]
    const imgIndex = this.rows[rowIndex].ticketProof.indexOf(imageToDel)
    if( imgIndex !== -1 ) {
      this.rows[rowIndex].ticketProof.splice(imgIndex, 1);
    }
  }
  deleteMCImage( rowIndex, imageIndex ) {
    const imageToDel = this.rows[rowIndex].medicalCertificate[imageIndex]
    const imgIndex = this.rows[rowIndex].medicalCertificate.indexOf(imageToDel)
    if( imgIndex !== -1 ) {
      this.rows[rowIndex].medicalCertificate.splice(imgIndex, 1);
    }
  }
  openSlideshow( rowIndex, imageIndex ) {
    console.log('openSlideshow!', rowIndex, imageIndex);
    this.currentSlideshowImage = this.rows[rowIndex].ticketProof[imageIndex]

    this.slideShowIsOpen = true
  }

  scrollToCurrentDay() {
    let currentDayIndex = -1
      for(let row of this.rows) {
        const dateParts = row.date.split("."),
              y = parseInt("20"+dateParts[2]),
              m = parseInt(dateParts[1]) - 1,
              d = parseInt(dateParts[0]),
              date = new Date(y, m ,d)
        currentDayIndex = this.rows.indexOf(row)
        if( sameDay(date, new Date()) ) {
          break;
        }
      }
      if( currentDayIndex !== -1 ) {
        let currentDateElement = document.getElementsByClassName("rowIndex"+currentDayIndex)[0];
        currentDateElement.scrollIntoView({ 
          behavior: 'smooth' 
        });
      }
  }
}
function showElement( show: boolean, elementClass: string) {
    const element : HTMLElement = document.querySelector(elementClass);
    show ? element.style.display = 'block' :
          element.style.display = 'none';
}

function sameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}