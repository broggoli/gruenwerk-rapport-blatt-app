import { Component, OnInit } from '@angular/core';
import {
  UserService,
  TableService,
  ExcelService,
  ImageHandlerService,
  SendService
} from '../_services';
import { ZiviData } from '../ziviData'

// tslint:disable-next-line:class-name
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
interface Row {
  date: string;
  dayName: string;
  dayType: string;
  price: string
  route: {
    start: string;
    destination: string
  }
  spesenChecked: boolean
  ticketProof: string       //Maybe save Images as strings in here
  workPlace: string
}

@Component({
  selector: 'app-rapportblatt',
  templateUrl: './rapportblatt.component.html',
  styleUrls: ['./rapportblatt.component.sass']
})
export class RapportblattComponent implements OnInit {
  rows: any
  sendError: string
  ziviData: ZiviData
  todayDate: Date
  monthString: string
  today: string
  ziviName: string
  summary: any
  loading: boolean;
  dayTypeNames: any;
  rowErrorMessages: any = {}
  ticketProofsRemarced: boolean = false

  workPlaceOptions: string[] = [];

  constructor(private user: UserService,
    private table: TableService,
    private excel: ExcelService,
    private imageHandler: ImageHandlerService,
    private s: SendService) { }

  ngOnInit() {
    this.loading = true
    this.ziviData = this.user.getZiviData();
    this.todayDate = new Date()
    this.monthString = this.table.getMonthString(this.todayDate);
    this.today = this.table.getDateString(this.todayDate);
    this.ziviName = [this.ziviData.name.firstName, this.ziviData.name.lastName].join(' ');
    this.getTable();
    this.loading = false
    this.dayTypeNames = {
      "krankTage": "Krankheitstage",
      "freiTage": "Freitage",
      "ferienTage": "Ferientage",
      "urlaubstage": "Urlaubstage",
      "arbeitsTage": "Arbeitstage"
    }
    //["Winterthur", "Zürich", "Dätlikon", "Bülach", "Katzensee", "Ossingen"]
  }

  // Ths function see to it that the first element in the list will be the option that is above it
  sortIndividually( optionsArray: string[],
                    thisRow: any, 
                    previousFieldName: string){
    
    const previousRowIndex = this.rows.indexOf(thisRow)-1

    if( previousRowIndex > -1){
      const previousRow = this.rows[ previousRowIndex ]
      const previousInput = previousRow[previousFieldName]

      if( previousInput && previousInput !== ""){

        const indexOfArrayItem = optionsArray.indexOf(previousInput);
        
        if( indexOfArrayItem >= 0 ){
          let swap = optionsArray[indexOfArrayItem]
          optionsArray[indexOfArrayItem] = optionsArray[0]
          optionsArray[0] = swap
        }
      }else{
        return this.sortIndividually(optionsArray, previousRow, previousFieldName)
      }
    }
    return optionsArray
  }
  updateWorkPlaceOptions(thisRow) {
    let options =  removeDuplicates(
                      this.sortIndividually(
                            this.rows.map(row =>
                              row.workPlace !== ""
                                ? row.workPlace
                                : undefined)
                              .filter(workPlace =>
                                workPlace
                                  ? true
                                  : false),
                          thisRow,
                          "workPlace")
                        )
    this.workPlaceOptions = options;

    function removeDuplicates(arr) {
      let unique_array = []
      for (let i = 0; i < arr.length; i++) {
        if (unique_array.indexOf(arr[i]) == -1) {
          unique_array.push(arr[i])
        }
      }
      return unique_array
    }
  }
  monthChanged(event: Event): void {

    const target = <HTMLInputElement>event.target;
    this.monthString = target.value;
    this.loading = true
    this.getTable();
    this.loading = false
  }
  getTable() {
    const locallyStoredRB = localStorage.getItem('savedRapportblatt');

    // default rows config
    const defaultRows = this.table.getTableData(this.ziviData, this.monthString);
    this.rows = this.table.filterTable(defaultRows, this.ziviData.date)

    // If there is no RB saved Locally
    if ( locallyStoredRB === null ) {
      this.rows = this.getRblOnline(defaultRows)
    } else {
      const savedRb = JSON.parse(locallyStoredRB);
      
      if ( savedRb.month  === this.monthString ) {
        this.rows = this.table.filterTable(savedRb.rbData, this.ziviData.date);

        if(this.rows.length !== defaultRows.length) {
          // The saved RB is too small
          console.log("the saved RB is too small")
          this.rows = this.rows.concat(defaultRows.slice(this.rows.length))
        }
      }else{
        this.rows = this.getRblOnline(defaultRows)
      }
      console.log('RB loaded locally!');
    }
  }
  getRblOnline(defaultRows) {
    this.user.getSavedRapportblatt(this.monthString).subscribe( savedRapportblatt => {
      console.log(savedRapportblatt);
      if (savedRapportblatt.success) {

        localStorage.setItem('savedRapportblatt', JSON.stringify(savedRapportblatt.data));

          if ( savedRapportblatt.data.month === this.monthString ) {
            this.rows = this.table.filterTable(savedRapportblatt.data.rbData, this.ziviData.date);
            
          if(this.rows.length !== defaultRows.length) {
            // The saved RB is too small
            console.log("the saved RB is too small")
            this.rows = this.rows.concat(defaultRows.slice(this.rows.length))
          }
          }
        }
      });
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
            }else if( (!row.ticketProof || row.ticketProof === "") && !this.ticketProofsRemarced) {
              validationObj.valid = false
              validationObj.message = `Laden Sie bitte entweder einen Billet-Beleg hier hoch, `+
                                        `oder schicken Sie ihn per Mail an verein@verein-gruenwerk.ch.`+
                                        ` Billette werden nur mit Beleg zurückerstattet!`
              validationObj.sourceRow = i
              this.ticketProofsRemarced = true
            }
          }else{
            
            this.clearRow(i, ["dayType", "dayName", "date", "workPlace"])
          }
          break
        case "Frei":
        this.clearRow(i, ["dayType", "dayName", "date"])
          break
        case "Krank":
        this.clearRow(i, ["dayType", "dayName", "date"])
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
        }else  if(typeof this.rows[rowIndex][item] === "boolean"){
          this.rows[rowIndex][item] = false;
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
    console.log(rapportblattTableVal, )
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
      this.save()
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
        
        const images = this.imageHandler.getImages

        this.s.sendRapportblatt({       excel:      excel,
                                        images,
                                        firstName:   rapportblattData.firstName,
                                        lastName:   rapportblattData.lastName,
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
          if(!firstErrorElement){
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

  save() {
    this.showLoader(true)
    /** Saves the rows Object on the server and in localStorage**/
    this.user.saveRapportblatt(this.rows, this.monthString).subscribe(data => {
      console.log(data);
      this.showLoader(false)
      this.showInputsChecked(true)
    });
  }
  saveImageInRows(file, rowIndex) {
    const callback = (image) => this.rows[rowIndex].ticketProof += image+"|seperator|"
    this.imageHandler.scaleFile(file, callback, true)
  }
  onFileSelected(event, date, rowIndex) {
      let target = event.target;
      let filesOnTarget = target.files;
      for ( const file of filesOnTarget) {
        //this.saveImageInRows(file, rowIndex)
        this.rows[rowIndex].ticketProof += file.name+"|"
        this.imageHandler.addImage(file, date, target);
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

  openSlideshow() {
    console.log('openSlideshow!');
  }

  getSummary() {
    // Normalentschädigung ist 25Fr./Tag
    const normalPay = 25;
    const urlaubPay = 0;

    const spesenPreis = this.rows.reduce((previous, o) => {
      if (o['price'] !== '' && 
          o['spesenChecked'] === true && 
          o['dayType'] === "Arbeitstag") { return previous + o['price']; }
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
    showElement(show, ".loadingAnim");
  }
  showInputsChecked(show: boolean) {
    showElement(show, '.inputsChecked');
    if (show === true) {
      setTimeout(() => showElement(false, '.inputsChecked'), 2000)
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
    }, 300);
  }
  
}
function showElement( show: boolean, elementClass: string) {
    const element : HTMLElement = document.querySelector(elementClass);
    show ? element.style.display = 'block' :
          element.style.display = 'none';
}
