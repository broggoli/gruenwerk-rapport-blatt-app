import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http"
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
interface logoutStatus{
    success: boolean
}

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private http: HttpClient) { }

  getZiviData(): ZiviData{
      const localStorageFile = localStorage.getItem("userData");
      if (localStorageFile === null) {
          console.log("No file found in localStorage");
          return false;
      }else{
          return JSON.parse(localStorageFile);
      }
    }

  getSavedRapportblatt(month: string){
    return this.http.post<rapportblattRequest>("/api/php/saveRapportblatt.php",
                                            {
                                              month       : month,
                                              task        : "getRb"
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
