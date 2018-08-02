import { Component, OnInit } from '@angular/core';
import { UserService,
        TableService,
        ExcelService,
        ImageHandlerService,
        SendService } from '../_services';
import { ZiviData } from '../ziviData'

// tslint:disable-next-line:class-name
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

  rows: any
  sendError: string
  ziviData: ZiviData
  todayDate: Date
  monthString: string
  today: string
  ziviName: string
  summary: any
  loading: boolean;

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
  }

  monthChanged(event: Event): void {

    const target = <HTMLInputElement>event.target;
    console.log(target.value);
    this.monthString = target.value;
    this.loading = true
    this.getTable();
    this.loading = false
  }
  getTable() {
    const locallyStoredRB = localStorage.getItem('savedRapportblatt');

    // default rows config
    this.rows = this.table.getTableData(this.ziviData, this.monthString);
    // If there is no RB saved Locally
    if ( locallyStoredRB === null ) {
      this.getRblOnline()
    } else {
      const savedRb = JSON.parse(locallyStoredRB);
      console.log('savedRb', savedRb);
      if ( savedRb.month  === this.monthString ) {
        this.rows = savedRb.rbData;
        console.log(this.rows);
      }else{
        this.getRblOnline()
      }
      console.log('RB loaded locally!');
    }

  }
  getRblOnline() {
    this.user.getSavedRapportblatt(this.monthString).subscribe( savedRapportblatt => {
      console.log(savedRapportblatt);
        if ( savedRapportblatt.success ) {

          localStorage.setItem('savedRapportblatt', JSON.stringify(savedRapportblatt.data));

          if ( savedRapportblatt.data.month === this.monthString ) {
            this.rows = savedRapportblatt.data.rbData;
            console.log(this.rows);
          }
        }
      });
  }
  send() {

    const rapportblattData =  {
                                ziviName: this.ziviName,
                                firstName: this.ziviData.name.firstName,
                                lastName: this.ziviData.name.lastName,
                                table: this.rows,
                                summary: this.getSummary(),
                                month: this.monthString,
                                shoeMoney: 0 // TODO: Clculate shoemoney
                              };
    console.log(rapportblattData);
    // Validate ToDo
    if ( true ) {
      this.showLoader(true);
      this.showInputsChecked(false);

      //// TODO: add auto format change
      const fileName = [
                          "Rbl_Zivi",
                          rapportblattData["lastName"],
                          rapportblattData["firstName"],
                          rapportblattData["month"].split("-")[0].slice(-2),
                          rapportblattData["month"].split("-")[1]
                        ].join("_");

        const excel = { "file": this.excel.excelForUpload( this.excel.getExcelFile(rapportblattData, fileName) ),
                        "name": fileName}

        this.s.sendRapportblatt({       excel:      excel,
                                        images:     this.imageHandler.getImages,
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
    }
  }

  save() {
    this.showLoader(true)
    /** Saves the rows Object on the server and in localStorage**/
    this.user.saveRapportblatt(this.rows, this.monthString).subscribe( data => {
      console.log(data);
        this.showLoader(false)
        this.showInputsChecked(true)
    });
  }

  onFileSelected(event, date) {
      let target = event.target;
      let filesOnTarget = target.files;
      console.log(filesOnTarget, target, date, event);
      for ( const file of filesOnTarget) {
          this.imageHandler.addImage(file, date, target);
      }
  }

  daySummary(sort= false) {
    const dayTypes = this.getSummary().dayTypes;
    const dayTypesArray  = Object.keys(dayTypes)
            .map((key, index) => {
              return [key, dayTypes[key]];
            });
    function sortedArray( dayTypesArray ) {
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
      if (o['price'] !== '') { return previous + o['price']; }
      return previous;
    }, 0);

    const pay = this.rows.reduce((previous, o) => {
      if (o['dayType'] !== 'Urlaub') { return previous + normalPay; }
      return previous;
    }, 0);

    const shoeMoney = this.isFirstMonth() ? this.calculateShoeMoney(): 0; // TODO: schuhgeld berechnung

    this.summary =  {
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

  showLoader( show: boolean ) {
    showElement( show, ".loadingAnim");
  }
  showInputsChecked( show: boolean ) {
    showElement( show, '.inputsChecked');
    if( show === true){
      setTimeout(() => showElement( false, '.inputsChecked'), 2000)
    }
  }

  isFirstMonth(): boolean {

    if(this.monthString.split("-")[1] === this.ziviData.date.startDate.split("-")[1]){
      return true
    }else {
      return false
    }
  }
  calculateShoeMoney(): number {
    const daysInGW: number = this.calculateDaysServed();

    let shoeMoney: number = 60 * Math.floor(daysInGW / 26);
    if( shoeMoney <= 4 * 60){
      return shoeMoney;
    }else{
      return 4 * 60
    }
  }

  totalDaysServing(): number{
    console.log(new Date(this.ziviData.date.startDate), this.ziviData.date.endDate)
    return Math.round( (new Date(this.ziviData.date.endDate).getTime()
                        - new Date(this.ziviData.date.startDate).getTime())
                        / ( 1000*60*60*24) );
  }
  getPercentage(a, b) { return b > 0 ?  Math.floor(a / b * 100).toString() + '%' : '0%'; }
}

function showElement( show: boolean, elementClass: string) {
    const element : HTMLElement = document.querySelector(elementClass);
    show ? element.style.display = 'block' :
          element.style.display = 'none';
}
