import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http"
import { CryptoService } from './crypto.service'
import { ZiviData } from '../ziviData'

// interface row{
//
// }
interface savedRb{
  month: string,
  rbData: any[]
}
interface rapportblattRequest{
    message: string,
    success: boolean,
    data: savedRb
}
interface simpleRequest{
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
          console.log("No file found in localStorage");
          alert("An error occured!")
      }else{
          return <ZiviData>JSON.parse(localStorageFile);
      }
    }

  getSavedRapportblatt(month: string){
    return this.http.post<rapportblattRequest>("/api/php/saveRapportblatt.php",
                                            {
                                              month       : month,
                                              task        : "getRb"
                                            })
  }

  changeServiceTime(newEndDate: string, password: string){
    let userDataForDB = this.getZiviData().date.endDate = newEndDate;
    //hashing the name and encrypt with password so it can't easily be read out of the db
    const dbData = JSON.stringify({'dbData': this.crypto.encryptForDB(userDataForDB, password)})
    return this.http.post<simpleRequest>("/api/php/changeUser.php",
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

    return this.http.post<rapportblattRequest>("/api/php/saveRapportblatt.php",
        JSON.stringify(savedRapportblatt))
  }

  logout() {
    //Check the php session and clear it
    return this.http.get<logoutStatus>("/api/php/logout.php")
  }

}
