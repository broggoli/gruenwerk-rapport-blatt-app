import { Component, OnInit } from '@angular/core';
import { UserService,
        TableService,
        ExcelService,
        ImageHandlerService } from '../_services'


@Component({
  selector: 'app-rapportblatt',
  templateUrl: './rapportblatt.component.html',
  styleUrls: ['./rapportblatt.component.sass']
})
export class RapportblattComponent implements OnInit {

  constructor(private user: UserService,
              private table: TableService,
              private excel: ExcelService,
              private imageHandler: ImageHandlerService) { }

  ngOnInit() {
    this.getTable()
  }
  ziviData = this.user.getZiviData();
  todayDate = new Date()
  monthString = this.table.getMonthString(this.todayDate)
  today = this.table.getDateString(this.todayDate)
  ziviName = this.ziviData.name.prename+" "+this.ziviData.name.surname

  monthChanged(event) {
    const target = event.target
    this.monthString = target.value
    this.getTable()
  }
  getTable(){
    const locallyStoredRB = localStorage.getItem("savedRapportblatt")
    console.log(JSON.parse(locallyStoredRB))

    //default rows config
    this.rows = this.table.getTableData(this.ziviData, this.monthString)
    //If there is no RB saved Locally
    if( locallyStoredRB === null ) {
      this.user.getSavedRapportblatt().subscribe( savedRapportblatt => {
        if( savedRapportblatt.success ){
          localStorage.setItem("savedRapportblatt", JSON.stringify(savedRapportblatt.data))
          if( savedRapportblatt.data.month  === this.monthString ){
            this.rows = savedRapportblatt.data.rapportblatt
          }
        }
      })
    }else{
      const savedRB = JSON.parse(locallyStoredRB)
      if( savedRB.month  === this.monthString ){
        this.rows = savedRB.rapportblatt
      }
      console.log("RB loaded locally!")
    }

  }
  send(){
    const rapportblattData =  {
                                ziviName: this.ziviName,
                                table: this.rows,
                                summary: this.getSummary(this.rows),
                                month: this.monthString,
                                shoeMoney: 0 // TODO: Clculate shoemoney
                              }
    console.log(rapportblattData)
    if(this.validateRapportblatt(rapportblattData) === true){
        const sheetTitle = "Rapportblatt_" +
                            rapportblattData.ziviName.replace(" ","_");
        const excel = this.excel.excelForUpload(
                        this.excel.getExcelFile(rapportblattData),
                        rapportblattData.ziviName,
                        rapportblattData.month)

        this.excel.sendRapportblatt({   excel:      excel,
                                        excelName:  sheetTitle,
                                        images:     this.imageHandler.getImages,
                                        ziviName:   rapportblattData.ziviName,
                                        abo:        this.ziviData.abo,
                                        month:      rapportblattData.month})
            .subscribe(data => {
                console.log(JSON.stringify(data))
            })
    }
  }

  save(){
    /** Saves the rows Object on the server and in localStorage**/
    this.user.saveRapportblatt(this.rows, this.monthString).subscribe( data => {
      console.log(data)
    })
  }

  onFileSelected(event, date) {
      const target = event.target;
      const filesOnTarget = target.files
      for(const file of filesOnTarget){
          this.imageHandler.addImage(file, date, target)
      }
  }

  daySummary(sort=false) {
    const dayTypes = this.getSummary(this.rows).dayTypes
    const dayTypesArray  = Object.keys(dayTypes)
            .map((key, index) => {
              return [key, dayTypes[key]]
            })
    return sort ? dayTypesArray.sort((a, b) => a[1] < b[1]) :
                  dayTypesArray
  }

  openSlideshow(){
      console.log("openSlideshow!")
  }

  getSummary(){
    // Normalentschädigung ist 25Fr./Tag
    const normalPay = 25;
    const urlaubPay = 0;

    const spesenPreis = this.rows.reduce((previous, o) => {
      if(o["price"] != '')
        { return previous + o["price"] }
      return previous
    }, 0)

    const pay = this.rows.reduce((previous, o) => {
      if(o["dayType"] != 'Urlaub')
        { return previous + normalPay }
      return previous
    }, 0)

    const shoeMoney = 0 // TODO: schuhgeld berechnung

    this.summary =  {
      dayTypes:
      {
        krankTage: this.rows.reduce((previous, o) => (o["dayType"] == "Krank")
                                                        ? previous+1
                                                        : previous, 0),
        freiTage: this.rows.reduce((previous, o) => (o["dayType"] == "Frei")
                                                        ? previous+1
                                                        : previous, 0),
        ferienTage: this.rows.reduce((previous, o) => (o["dayType"] == "Ferien")
                                                        ? previous+1
                                                        : previous, 0),
        urlaubstage: this.rows.reduce((previous, o) => (o["dayType"] == "Urlaub")
                                                        ? previous+1
                                                        : previous, 0),
        arbeitsTage: this.rows.reduce((previous, o) => (o["dayType"] == "Arbeitstag")
                                                          ? previous+1
                                                          : previous, 0)
      },

      //total daily compensation
      compensation: pay,
      //Add all the 'Fahrspesen' up
      spesenPreis: spesenPreis,

      shoes: shoeMoney,

      total: spesenPreis + pay + shoeMoney
    }
    return this.summary
  }

  validateRapportblatt(rapportblatt) {
    return true // TODO: Validierung
  }

  getPercentage(a, b){ return b > 0 ?  Math.floor(a/b*100).toString()+"%" : "0%" }
}
