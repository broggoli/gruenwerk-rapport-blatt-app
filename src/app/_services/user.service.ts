import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http"
import { CryptoService } from './crypto.service'
import { ZiviData } from '../models/zivi.model'

import {RapportblattTable, Row} from "../models/rapportblatt.model"

interface RapportblattRequest{
    message: string,
    success: boolean,
    data: RapportblattTable
}
interface SimpleRequest{
      message: string,
      success: boolean
}
interface logoutStatus{
    success: boolean
}

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private http: HttpClient,
              private crypto: CryptoService) { }

  
  getZiviData(){
      const localStorageFile = localStorage.getItem("userData");
      if (localStorageFile === null) {
          console.log("No user data found in localStorage");
          alert("No user data found in localStorage")
      }else{
          return <ZiviData>JSON.parse(localStorageFile);
      }
  }

  getSavedRapportblatt(month: string){
    return this.http.post<RapportblattRequest>("/api/php/saveRapportblatt.php",
                                            {
                                              month       : month,
                                              task        : "getRb"
                                            })
  }

  changeServiceTime(newStartDate: string, newEndDate: string, password: string){
    let userDataForDB = this.getZiviData()
    userDataForDB.date.startDate = newStartDate;
    userDataForDB.date.endDate = newEndDate;
    //hashing the name and encrypt with password so it can't easily be read out of the db
    const dbData = JSON.stringify({'dbData': this.crypto.encryptForDB(userDataForDB, password)})
    return this.http.post<SimpleRequest>("/api/php/changeUser.php",
                                            {
                                              dbData,
                                              task  : "changeServiceTime"
                                            })
  }
  saveRapportblatt(rapportblatt, month: string){

    const savedRapportblatt = {
                                rbData      : rapportblatt,
                                month       : month,
                                task        : "setRb"
                              }
    console.log( JSON.stringify(savedRapportblatt))
    localStorage.setItem("savedRapportblatt",
                JSON.stringify({
                                rbData      : rapportblatt,
                                month       : month}
                              ))
    console.log(savedRapportblatt)
    return this.http.post<SimpleRequest>("/api/php/saveRapportblatt.php",
        savedRapportblatt)
  }

  deleteAccount(password) {
    const ziviEmail = this.getZiviData().email;
    const dataHeader = this.crypto.getZiviDataHeader(ziviEmail, password);

    return this.http.post<SimpleRequest>("/api/php/changeUser.php",
                                            {
                                              dataHeader,
                                              task  : "deleteUser"
                                            })
  }

  logout() {
    //Check the php session and clear it
    return this.http.get<logoutStatus>("/api/php/logout.php")
  }

}
