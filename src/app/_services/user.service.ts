import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http"
import { CryptoService } from './crypto.service'
import { ZiviData, SavedRb } from '../models/zivi.model'

import {RapportblattTable, Row} from "../models/rapportblatt.model"

interface RapportblattRequest{
    message: string,
    success: boolean,
    data: string
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

  getZiviData(): ZiviData {
      const localStorageFile = localStorage.getItem("userData");
      if (localStorageFile === null) {
          console.log("No user data found in localStorage");
          alert("No user data found in localStorage")
      }else{
          return <ZiviData>JSON.parse(localStorageFile);
      }
  }

  getSavedRapportblatt(pointer: string){
    return this.http.post<RapportblattRequest>("/api/php/saveRapportblatt.php",
                                            {
                                              pointer       : pointer,
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
  saveRapportblatt(rapportblatt: Row[], month: string){

    let newSavedRbs: SavedRb = {
      month,
      pointer: "",
      encrypted: true
    }
    let newEncryptedRb: string

    const ziviData = this.getZiviData(),
          savedRbs = ziviData.savedRbs
    if(savedRbs) {
      // Find the rapportblatt pointer if one exists
      for(const rb of savedRbs) {
        if(rb.month === month) {
          newSavedRbs = rb
          break;
        }
      }
      if( newSavedRbs.pointer === "" ) {
        // The rb is not saved yet
        newSavedRbs.pointer = this.crypto.generatePointer(8)
        console.log("create New pointer")
      }

    }else{
      console.log("Need to save user with the new savedRbs Field!!!!")
    }

    // Resave the rb with the same pointer
    // Not very secure hashin, but at least it is un readable and uses some of time to reverse engeneer the encryption
    // Still could be done bettter But I'm not sure wheter it is save to save the plain text password in the local storage
    newEncryptedRb = this.crypto.encryptData( JSON.stringify(rapportblatt), month+newSavedRbs.pointer )

    const postRequest = {
                                rbData      : newEncryptedRb,
                                task        : "setRb"
                              }
    localStorage.setItem("savedRapportblatt",
                JSON.stringify({
                                rbData      : rapportblatt,
                                month       : month}
                              ))
    
    console.log( JSON.stringify(postRequest))
    console.log(this.getZiviData())
    
    return this.http.post<SimpleRequest>("/api/php/saveRapportblatt.php", postRequest)
  }

  decryptRb (encryptedRb:string, savedRb: SavedRb ): Row[] {
    return JSON.parse(this.crypto.decryptData(encryptedRb, savedRb.month+savedRb.pointer))
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
