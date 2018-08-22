import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http"
import { CryptoService } from './crypto.service'
import { ZiviData } from '../models/zivi.model'
import { Router } from '@angular/router';

import { Row } from "../models/rapportblatt.model"

interface RapportblattRequest {
  message: string,
  success: boolean,
  data: string
}
interface SavedRb {
  month: string
  rbData: Row[]
}
interface SimpleRequest {
  message: string,
  success: boolean
}
interface logoutStatus {
  success: boolean
}

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private http: HttpClient,
    private crypto: CryptoService,
    private router: Router) { }

  getZiviData(): ZiviData {
    const localStorageFile = localStorage.getItem("userData");
    if (localStorageFile === null) {
      console.log("No user data found in localStorage");
      alert("No user data found in localStorage")
      this.router.navigate(['logout']);
    } else {
      return <ZiviData>JSON.parse(localStorageFile);
    }
  }

  getSavedRapportblatt(month: string) {
    return this.http.post<RapportblattRequest>("/api/php/saveRapportblatt.php",
      {
        month,
        task: "getRb"
      })
  }

  changeServiceTime(newStartDate: string, newEndDate: string, password: string) {
    let userDataForDB = this.getZiviData()
    userDataForDB.date.startDate = newStartDate;
    userDataForDB.date.endDate = newEndDate;
    //hashing the name and encrypt with password so it can't easily be read out of the db
    const dbData = JSON.stringify({ 'dbData': this.crypto.encryptForDB(userDataForDB, password) })
    return this.http.post<SimpleRequest>("/api/php/changeUser.php",
      {
        dbData,
        task: "changeServiceTime"
      })
  }
  saveRapportblatt(rapportblatt: Row[], month: string) {

    // If the user has saved Rbs it is guaranteed that they are encrypted
    let newEncryptedRb: string

    const ziviData = this.getZiviData()

    // Resave the rb with the same pointer
    // Not very secure hashing, but at least it is un readable and uses some of time to reverse engeneer the encryption
    // Still could be done bettter But I'm not sure wheter it is save to save the plain text password in the local storage
    newEncryptedRb = this.encryptRb(rapportblatt, ziviData.email+month)

    const postRequest = {
      rbData: newEncryptedRb,
      month: month,
      task: "setRb"
    }

    this.saveRbLocally(rapportblatt, month)
    return this.http.post<SimpleRequest>("/api/php/saveRapportblatt.php", postRequest)
  }

  saveRbLocally(rb: Row[], month: string) {
    if(rb.length > 0) {
      const lsRbs: SavedRb[] = JSON.parse(localStorage.getItem("savedRbs"))
      let rbs = lsRbs
      if( lsRbs ) {
        let index = -1
        for(const lsRb of lsRbs) {
          if(lsRb.month === month){
            index = lsRbs.indexOf(lsRb)
          }
        }
        
        if(index !== -1) {
          rbs[index] = {
            rbData: rb,
            month: month
          }
        }else {
          rbs.push({
            rbData: rb,
            month: month
          })
        }
        console.log(rbs)
      }else{
        rbs = [{
          rbData: rb,
          month: month
        }]
      }
      localStorage.setItem("savedRbs", JSON.stringify(rbs) )
    } else {
      console.log("Didn't dave Rb because the rb has no content")
    }
  }
  encryptRb(rows: Row[], password: string): string {
    return this.crypto.encryptData(JSON.stringify(rows),
    password)
  }
  decryptRb(encryptedRb: string, password: string): string {
    return this.crypto.decryptData(encryptedRb,
      password)
  }
  deleteAccount(password) {
    const ziviEmail = this.getZiviData().email;
    const dataHeader = this.crypto.getZiviDataHeader(ziviEmail, password);

    return this.http.post<SimpleRequest>("/api/php/changeUser.php",
      {
        dataHeader,
        task: "deleteUser"
      })
  }

  logout() {
    //Check the php session and clear it
    return this.http.get<logoutStatus>("/api/php/logout.php")
  }

}
