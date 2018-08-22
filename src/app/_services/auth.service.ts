import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { CryptoService } from './crypto.service'
import { ZiviData } from '../models/zivi.model'
import { Observable, of } from "rxjs"
import { map, tap } from 'rxjs/operators';

interface Response {
    success: boolean,
    message: string,
    data: string
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private crypto: CryptoService,
              private http : HttpClient) { }

  // Saves the user data in local storage
  saveData(data: string, password: string){
      const decryptedData: ZiviData = JSON.parse(this.crypto.decryptData(data, password))
      localStorage.setItem("userData", JSON.stringify(decryptedData))
      console.log(localStorage.getItem("userData"))
  }

  // Returns a boolean as an observable telling the login status of the user
  get isLoggedIn(): Observable<boolean> {
    if( localStorage.getItem("userData") !== null ){

      return this.http.post<Response>('/api/php/auth.php', JSON.stringify({task: 'isLoggedIn'})).pipe(map( res => {
                    if( res.success === true ) {
                      if( JSON.parse(res.data) === true ) {
                        return true
                      }else {
                        return false
                      }
                    }
                }))
    }else{
      return of(false)
    }
  }

  // Logs the user in and initiates a user session on the server nd saves the user data locally
  login(userName: string, password: string) {
    const dataHeader= JSON.stringify({
                        data: 
                          {
                            'ziviDataHeader': this.crypto.getZiviDataHeader(userName, password)
                          },
                        task: "login"
                      })
    // post these details to API server return user info if correct
    console.log(dataHeader, userName, password)
    return this.http.post<Response>('/api/php/auth.php', dataHeader).pipe(tap( res => {
      if( res.success === true ) {
        const userData: string = res.data['encryptedZiviData'];
        this.saveData(userData, password)
      }else {
        console.log("Error: Could not locally store data!")
      }
    }))
  }

}
