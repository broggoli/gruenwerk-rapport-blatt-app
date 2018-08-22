import { Injectable } from '@angular/core';
import { of, Observable } from "rxjs"
import  { flatMap, map } from "rxjs/operators"

import { ValidationObj, Row} from "../models/rapportblatt.model"
import { ZiviData } from '../models/zivi.model';
import { UserService } from './user.service';

interface EncryptedRB {
  encrypted: boolean
  data: string
}

@Injectable({
  providedIn: 'root'
})
export class TableService {

  ticketProofsRemarced: boolean

  constructor(private user: UserService) { }

  getTable(monthS: string, ziviData: ZiviData, forceDownload=false): Observable<Row[]> {
    // default rows config
    let loadedRows: Row[] = []
    if( monthS ) {

      const locallyStoredRBs = JSON.parse(localStorage.getItem('savedRbs'));

      const defaultRows = this.getDefaultTable(ziviData, monthS);
      loadedRows = this.filterTable(defaultRows, ziviData.date);
      
      const localRB = getlocalRb(locallyStoredRBs, monthS)
     
      if( localRB && forceDownload === false ) {

        // for(const lsRb of locallyStoredRBs) {
        //   console.log(lsRb)
        // }
        console.log("there is a locally stored Rb for the month: "+monthS)
      
        loadedRows = this.filterTable(localRB, ziviData.date);
        
        if(loadedRows.length !== defaultRows.length) {
          // The saved RB is too small
          console.log("the saved RB is too small")
          loadedRows = loadedRows.concat(defaultRows.slice(loadedRows.length))
        }
        console.log('RB loaded locally!');
        return of(loadedRows)
      } else {

        // There is no rb saved locally so look online to download a potentially saved rb
        console.log("No rb saved locally")
        return this.getRblOnline(defaultRows, monthS, ziviData).pipe(map( loadedRows => {

          if(loadedRows.length !== defaultRows.length) {
            // The saved RB is too small
            console.log("the saved RB is too small")
            loadedRows = loadedRows.concat(defaultRows.slice(loadedRows.length))
          }
          this.user.saveRbLocally(loadedRows, monthS)
          return loadedRows
        }))
      }
    }else{
      console.log("There was no Month input!")
      return of(loadedRows)
    }
  }
  getRblOnline(defaultRows: Row[], monthS: string, ziviData: ZiviData): Observable<Row[]> {
    return this.user.getSavedRapportblatt(monthS).pipe(flatMap(savedRapportblatt => {
      

      let loadedRows: Row[] = []
      if (savedRapportblatt.success) {
        console.log(savedRapportblatt.data)
        const rbData: any = JSON.parse(JSON.stringify(savedRapportblatt.data)).rbData
        if( rbData.encrypted ) {
          console.log("encrypted")
          const decryptedRb: Row[] = JSON.parse(JSON.parse(this.user.decryptRb( rbData.data, ziviData.email + monthS)))
          loadedRows = this.filterTable(decryptedRb, ziviData.date);
        } else {
          console.log("not encrypted")
          loadedRows = this.filterTable(rbData, ziviData.date);
        }
      }

      return of(loadedRows)
    }));
  }
  filterTable(tableData, dates){
  const startDate = new Date(Date.parse(dates.startDate))
  const endDate = new Date(Date.parse(dates.endDate))

    let filteredTable = tableData.filter(row => {
      const dParts = row.date.split(".");
      const d = parseInt(dParts[0]);
      const m = parseInt(dParts[1])-1;
      const y = parseInt("20"+dParts[2]);

      const date = new Date(y, m, d)
      if(date.setHours(0,0,0,0) >= startDate.setHours(0,0,0,0) &&
          date.setHours(0,0,0,0) <= endDate.setHours(0,0,0,0)){
            return true;
          }else{
            return false;
          }
    });
    return filteredTable
  }

  validateTable(rows: Row[]): ValidationObj[] {
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
          }
          break
        case "Krank":
          console.log("Check whether Medical certificate is needed!")
          break
      }
      validArray.push(validationObj);
      i++
    }
    return validArray;
  }
  
  cleanTable(rows: Row[]) {

    let cleanedTable:Row[] = []
    for(const row of rows) {
      switch( row.dayType ) {
        case "Arbeitstag":
          if( row.spesenChecked ) {
            cleanedTable.push(this.clearRow(row, ["workPlace", "route", "price", "ticketProof", "spesenChecked"]))
          } else {
            cleanedTable.push(this.clearRow(row, ["workPlace"]))
          }
          break
        case "Frei":
          cleanedTable.push(this.clearRow(row))
          break
        case "Krank":
          cleanedTable.push(this.clearRow(row, ["medicalCertificate"]))
          break
        case "Ferien":
          cleanedTable.push(this.clearRow(row))
          break
        case "Urlaub":
          cleanedTable.push(this.clearRow(row))
          break
      }
    }

    console.log(rows)
    console.log(cleanedTable)
    return cleanedTable
  }
  clearRow(row: Row, leaveTheSame: string[] = []): Row {
    const stdLeaveSame = ["dayType", "dayName", "date"]
    if(leaveTheSame.length > 0) {
      leaveTheSame = leaveTheSame.concat(stdLeaveSame)
    }else {
      leaveTheSame = stdLeaveSame
    }
    let newRow = row
    for(const item in row) {
      if( leaveTheSame.indexOf(item) === -1 ) {
        if(item === "route") {
          newRow[item] = {start: "", destination: ""}
        }
        if(typeof newRow[item] === "string"){
          newRow[item] = "";
        }else if(typeof row[item] === "boolean"){
          newRow[item] = false;
        }else if(Array.isArray(row[item])) {
          newRow[item] = [];
        }
      }
    }
    return newRow
  }
  getDefaultTable(ziviData, monthString) {

    const year: number = parseInt(monthString.split("-")[0]);
    const month: number = parseInt(monthString.split("-")[1])-1; // January is 0
    const startDate: Date = new Date(Date.parse(ziviData.date.startDate))
    const endDate: Date = new Date(Date.parse(ziviData.date.endDate))

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

  getDatesOfMonth(month: number, year:number) {
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
function getlocalRb(locallyStoredRBs, monthS) {
  if( locallyStoredRBs ) {
    for(const lsRb of locallyStoredRBs) {
      if( lsRb.month === monthS ) {
        return lsRb.rbData
      }
    }
  }
  return null
}