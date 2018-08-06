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
    this.rows = this.table.filterTable(this.rows, this.ziviData.date)
    // If there is no RB saved Locally
    if (locallyStoredRB === null) {
      this.getRblOnline()
    } else {
      const savedRb = JSON.parse(locallyStoredRB);
      console.log('savedRb', savedRb);
      if (savedRb.month === this.monthString) {
        this.rows = this.table.filterTable(savedRb.rbData, this.ziviData.date);
      } else {
        this.getRblOnline()
      }
      console.log('RB loaded locally!');
    }

  }
  getRblOnline() {
    this.user.getSavedRapportblatt(this.monthString).subscribe(savedRapportblatt => {
      console.log(savedRapportblatt);
      if (savedRapportblatt.success) {

        localStorage.setItem('savedRapportblatt', JSON.stringify(savedRapportblatt.data));

        if (savedRapportblatt.data.month === this.monthString) {
          this.rows = this.table.filterTable(savedRapportblatt.data.rbData, this.ziviData.date);

          // //Deletes all the rows, which are not in the given service time
          // this.rows = onlyServiceTime(this.rows)
          console.log(this.rows);
        }
      }
    });
  }
  send() {

    const rapportblattData = {
      ziviName: this.ziviName,
      firstName: this.ziviData.name.firstName,
      lastName: this.ziviData.name.lastName,
      table: this.rows,
      summary: this.getSummary(),
      month: this.monthString
    };
    console.log(rapportblattData);
    // Validate ToDo
    if (true) {
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

      const excel = {
        "file": this.excel.excelForUpload(this.excel.getExcelFile(rapportblattData, fileName)),
        "name": fileName
      }

      this.s.sendRapportblatt({
        excel: excel,
        images: this.imageHandler.getImages,
        firstName: rapportblattData.firstName,
        lastName: rapportblattData.lastName,
        abo: this.ziviData.abo,
        month: rapportblattData.month
      })
        .subscribe((data: SendRbResponse) => {

          this.showLoader(false);
          if (data.success) {
            this.showInputsChecked(true);
            alert("Rapportblatt wurde erfolgreich verschickt!")
            this.sendError = '';
          } else {
            this.showInputsChecked(false);
            this.sendError = data.message;
            console.log(JSON.stringify(data));
          }
        });
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

  onFileSelected(event, date) {
    let target = event.target;
    let filesOnTarget = target.files;
    console.log(filesOnTarget, target, date, event);
    for (const file of filesOnTarget) {
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
      if (o['price'] !== '') { return previous + o['price']; }
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

  totalDaysServing(): number {
    return Math.round((new Date(this.ziviData.date.endDate).getTime()
      - new Date(this.ziviData.date.startDate).getTime())
      / (1000 * 60 * 60 * 24));
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

function showElement(show: boolean, elementClass: string) {
  const element: HTMLElement = document.querySelector(elementClass);
  show ? element.style.display = 'block' :
    element.style.display = 'none';
}
