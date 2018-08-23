import { Component, OnInit } from '@angular/core';
import { Observable, throwError } from "rxjs"
import  { tap, catchError } from "rxjs/operators"
import {
  UserService,
  TableService,
  ExcelService,
  ImageHandlerService,
  SendService,
  AutoCompleteService
} from '../_services';
import { ZiviData } from '../models/zivi.model'

import { Row, ValidationObj } from "../models/rapportblatt.model"


interface SimpleRequest {
  message: string,
  success: boolean
}
interface SendRbResponse {
  data: any;
  message: string;
  success: boolean;
}

@Component({
  selector: 'app-rapportblatt',
  templateUrl: './rapportblatt.component.html',
  styleUrls: ['./rapportblatt.component.sass']
})
export class RapportblattComponent implements OnInit {
  rows: Row[] = []
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
  //rbFileSize: number

  constructor(
    private user: UserService,
    private table: TableService,
    private excel: ExcelService,
    private imageHandler: ImageHandlerService,
    private s: SendService,
    private autoComplete: AutoCompleteService) {}

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

    setTimeout( () => {
      scrollToCurrentDay(this.rows)
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
  
  downloadRb(event) {
    this.loading = true
    let imageElement = event.target.getElementsByTagName("img")[0]
    if( !imageElement ) {
      imageElement = event.target
    }
    imageElement.classList.toggle("loading");
    const forceDownload = true
    this.table.getTable( this.monthString, this.user.getZiviData(), forceDownload).subscribe(res => {
      this.rows = res
      //For backwardscompatibility
      this.rows.map( row => {
        if( !row.medicalCertificate ) {
          row.medicalCertificate = []
        }
      })
      console.log(this.rows)
      this.loading = false
      imageElement.classList.toggle("loading");
    });
  }
  monthChanged(monthString): void {
    this.loading = true
    this.monthString = monthString;
    this.table.getTable( this.monthString, this.user.getZiviData()).subscribe(res => {
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
    const rapportblattTableVal: ValidationObj[] = this.table.validateTable(this.rows);
    const rbIsValid = rapportblattTableVal.reduce( (previous: ValidationObj, valObj: ValidationObj) => {
      return {
        valid: valObj.valid && previous.valid,
        message: valObj.valid && previous.valid ? previous.message: valObj.message,
        sourceRow: valObj.valid && previous.valid ? previous.sourceRow: valObj.sourceRow
      }
    }, {valid: true, message:"", sourceRow: null})


    //If all is valid send the rapportblatt
    if ( rbIsValid.valid === true ) {

      console.log("Before cleaning: " ,this.rows)
      this.rows = this.table.cleanTable(this.rows)
      console.log("After cleaning: " ,this.rows)

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
              .pipe(
                catchError( err => {
                      if (err.status == 200) {
                        alert("Rapportblatt konnte nicht gesendet werde. Kontaktieren Sie bitte ihren Administrator um das Problem zu beheben.")
                        this.showErrorIcon(true)
                      }
                    return throwError(err);
                })
            ).subscribe( (data: SendRbResponse) => {

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
    } else {
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
  onSaveFileBttnClick() {
    this.save().subscribe( res => {
      if( res.success === true) {
      }
      console.log(res.message)
    })
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
      target.value = "";
  }
  
  onMCSelected(event, rowIndex) {
    let target = event.target;
    let filesOnTarget = target.files;
    for ( const file of filesOnTarget) {
      this.saveImageInRows(file, rowIndex, "medicalCertificate")
    }
    target.value = "";
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

    const spesenPreis: number = Math.round(this.rows.reduce((previous, o) => {
      if (o['price'] &&
          o['price'] !== '' && 
          o['spesenChecked'] === true && 
          o['dayType'] === "Arbeitstag") {
            return previous + <number>parseFloat(o['price']); 
          }
      return previous;
    }, 0) * 100)/100;

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
      setTimeout(() => showElement(false, '.errorIcon'), 5000)
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

  getMb(rows: Row[]) {
    const byteL = byteLength(JSON.stringify(rows))
    const mbs = byteL / 1000 / 1000
    const rounded = Math.round(mbs * 1000) / 1000
    return rounded
  }
  
}
function byteLength(str: string) {
  // returns the byte length of an utf8 string
  var s = str.length;
  for (var i=str.length-1; i>=0; i--) {
    var code = str.charCodeAt(i);
    if (code > 0x7f && code <= 0x7ff) s++;
    else if (code > 0x7ff && code <= 0xffff) s+=2;
    if (code >= 0xDC00 && code <= 0xDFFF) i--; //trail surrogate
  }
  return s;
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

function scrollToCurrentDay(rows: Row[]) {
  let currentDayIndex = -1
    for(let row of rows) {
      const dateParts = row.date.split("."),
            y = parseInt("20"+dateParts[2]),
            m = parseInt(dateParts[1]) - 1,
            d = parseInt(dateParts[0]),
            date = new Date(y, m ,d)
      currentDayIndex = rows.indexOf(row)
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