import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TableService {

  constructor() { }

  getTableData(ziviData, monthString) {

    const year = parseInt(monthString.split("-")[0]);
    const month = parseInt(monthString.split("-")[1])-1; // January is 0
    const startDate = new Date(ziviData.date.start);
    const endDate = new Date(ziviData.date.end);

    const dates = this.getDatesOfMonth(month, year);

    let tableData = [];

    for(let date of dates){
      //Only display dates where the zivi was working at Grünwerk
      if(date[1].setHours(0,0,0,0) >= startDate.setHours(0,0,0,0) &&
          date[1].setHours(0,0,0,0) <= endDate.setHours(0,0,0,0)){

        //Change weekends per default to "Frei"
        //true if workday, false if weekend
        const isDefaultDay =  (date[1].getDay() == 6 || date[1].getDay() == 0)
                              ? false : true
        const defaultDay = "Arbeitstag"
        const defaultFallback = "Frei"

        const dayType = isDefaultDay ? defaultDay : defaultFallback

        const row = {
                      dayName: date[0],
                      date: this.getDateString(date[1]),
                      dayType,
                      workPlace : "",
                      spesenChecked: false,
                      ticketProof: "",
                      route : {
                                start: "",
                                destination: ""
                              },
                      price : ""
                  }
        tableData.push(row)
      }
    }
    return tableData
  }
  getDateString(date, separator="."){
    const dd = date.getDate();
    const mm = date.getMonth()+1; //January is 0
    const yy = date.getFullYear().toString().slice(2,4);

    return [dd,mm,yy].join(separator);
  }

  getDatesOfMonth(month, year) {
    /* Returns a 2D array of [nameOfDay, dateObject]*/
    //Make the last month the default month

    function getDaysInMonth(month, year) {
    //Returns all the days of the given month as an array
       var date = new Date(year, month, 1);
       var days = [];
       while (date.getMonth() === month) {
          days.push(new Date(date));
          date.setDate(date.getDate() + 1);
       }
       return days;
    }
    function weekDayName(d){
        let weekday = new Array(7);
        weekday[0] = "So";
        weekday[1] = "Mo";
        weekday[2] = "Di";
        weekday[3] = "Mi";
        weekday[4] = "Do";
        weekday[5] = "Fr";
        weekday[6] = "Sa";
        return weekday[d.getDay()];
    }

    let datesToRepport = getDaysInMonth(month, year);
    let dates = datesToRepport.map((d) => [weekDayName(d), d]);
    return dates;
  }

  getMonthString(date) {
    let padZeros = (n, width) => {
              n = n + '';
              return n.length >= width ? n : new Array(width - n.length + 1).join("0") + n;
          }
    const month = date.getMonth()+1
    const year = date.getFullYear()
    //get the last moth as a string to input into the month chooser
    const dateInputValue = [year, padZeros(month, 2)].join("-")
    return dateInputValue;
  }
}
