import { Component, OnInit } from '@angular/core';
import { UserService } from '../_services'
import { TableService } from '../_services'
import { ExcelService } from '../_services'

@Component({
  selector: 'app-rapportblatt',
  templateUrl: './rapportblatt.component.html',
  styleUrls: ['./rapportblatt.component.sass']
})
export class RapportblattComponent implements OnInit {

  constructor(private user: UserService,
              private table: TableService,
              private excel: ExcelService) { }

  ngOnInit() {
    // this.fillInDefaultData(ziviData, this.updateSummary.bind(this));
    this.rows = this.table.getTableData(this.ziviData, this.monthString)

  }
  ziviData = this.user.getZiviData();
  console.log(this.ziviData)
  todayDate = new Date()
  monthString = this.table.getMonthString(this.todayDate)
  today = this.table.getDateString(this.todayDate)
  ziviName = this.ziviData.name.prename+" "+this.ziviData.name.surname

  send(){
    const rapportblattData =  {
                                ziviName: this.ziviName,
                                table: this.rows,
                                summary: this.getSummary(this.rows)
                              }
    console.log(rapportblattData)

    if(this.validateRapportBlatt(rapportblattData) === true){
        const sheetTitle = "Rapportblatt_" +
                            rapportblattData.ziviName.replace(" ","_");
        const excel = this.excel.getExcelFile(rapportblattData)

        this.sendRapportBlatt(excel,
                    rapportBlattData["ziviName"],
                    ziviData["abo"],
                    rapportBlattData["month"]);
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
      //Add all the 'Fahrspesen' up
      spesenPreis: spesenPreis,

      shoes: shoeMoney,

      total: spesenPreis + pay + shoeMoney
    }
    return this.summary
  }

  validateRapportBlatt(rapportblatt) {
    return true // TODO: Validierung
  }

  getPercentage(a, b){ return b > 0 ?  Math.floor(a/b*100).toString()+"%" : "0%" }
}
