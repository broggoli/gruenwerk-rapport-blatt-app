import { Component, OnInit } from '@angular/core';
import { UserService } from '../_services'
import { TableService } from '../_services'

@Component({
  selector: 'app-rapportblatt',
  templateUrl: './rapportblatt.component.html',
  styleUrls: ['./rapportblatt.component.sass']
})
export class RapportblattComponent implements OnInit {

  constructor(private user: UserService,
              private table: TableService) { }

  ngOnInit() {
    // this.fillInDefaultData(ziviData, this.updateSummary.bind(this));
    console.log(this.ziviData)

  }
    ziviData = this.user.getZiviData();
    todayDate = new Date()
    monthString = this.table.getMonthString(this.todayDate)
    today = this.table.getDateString(this.todayDate)
    ziviName = this.ziviData.ziviName
    rows = table.getTableData(this.ziviData, this.monthString)
    summary = this.getSummary(this.rows)

    send(){
      console.log(this.rows, this.getSummary(this.rows))
    }
    getSummary(rows){
      // Normalentschädigung ist 25Fr./Tag
      const normalPay = 25;
      const urlaubPay = 0;

      return {
        dayTypes:
        {
          krankTage: rows.reduce((previous, o) => (o["dayType"] == "Krank")
                                                          ? previous+1
                                                          : previous, 0),
          freiTage: rows.reduce((previous, o) => (o["dayType"] == "Frei")
                                                          ? previous+1
                                                          : previous, 0),
          ferienTage: rows.reduce((previous, o) => (o["dayType"] == "Ferien")
                                                          ? previous+1
                                                          : previous, 0),
          urlaubstage: rows.reduce((previous, o) => (o["dayType"] == "Urlaub")
                                                          ? previous+1
                                                          : previous, 0),
          arbeitsTage: rows.reduce((previous, o) => (o["dayType"] == "Arbeitstag")
                                                            ? previous+1
                                                            : previous, 0)
        },
        //Add all the 'Fahrspesen' up
        spesenPreis: rows.reduce((previous, o) => {
          if(o["price"] != '')
            { return previous + o["price"] }
          return previous
        }, 0)
      }
    }
}
