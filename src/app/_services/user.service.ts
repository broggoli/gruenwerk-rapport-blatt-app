import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http"

interface myData {
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

  logout() {
    return this.http.get<logoutStatus>("/api/php/logout.php")
  }

}
