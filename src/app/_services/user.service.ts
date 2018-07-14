import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http"

interface rapportblattRequest{
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

  constructor(private http: HttpClient) { }

  getZiviData(){
      const localStorageFile = localStorage.getItem("userData");
      if (localStorageFile === null) {
          console.log("No file found in localStorage");
          return false;
      }else{
          return JSON.parse(localStorageFile);
      }
    }

  getSavedRapportblatt(){
    return this.http.get<rapportblattRequest>("/api/php/saveRapportblatt.php")
  }

  saveRapportblatt(rapportblatt: {string}[], month: string){

    const savedRapportblatt = {
                                "rapportblatt": rapportblatt,
                                "month"       : month
                              }
    console.log( JSON.stringify(savedRapportblatt))
    localStorage.setItem("savedRapportblatt", JSON.stringify(savedRapportblatt))

    return this.http.post<rapportblattRequest>("/api/php/saveRapportblatt.php",
        JSON.stringify(savedRapportblatt))
  }

  logout() {
    //Check the php session and clear it
    return this.http.get<logoutStatus>("/api/php/logout.php")
  }

}
