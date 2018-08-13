import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { CryptoService } from './crypto.service'
import { ZiviData } from '../ziviData'
import { Observable, of } from "rxjs"
import { map, tap } from 'rxjs/operators';

interface Response {
    success: boolean,
    message: string,
    data: string
}
interface LoginStatus {
  local: boolean,
  online: any
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private crypto: CryptoService,
              private http : HttpClient) { }

  saveData(data: string, password: string){
      const decryptedData: ZiviData = JSON.parse(this.crypto.decryptData(data, password))
      localStorage.setItem("userData", JSON.stringify(decryptedData))
      console.log(localStorage.getItem("userData"))
  }
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
                })).pipe(tap( res => {
                  return res
                }))
    }else{
      return of(false)
    }
  }

  login(userName: string, password: string) {
    const dataHeader= JSON.stringify({
                        data: 
                          {
                            'ziviDataHeader': this.crypto.getZiviDataHeader(userName, password)
                          },
                        task: "login"
                      })
    // post these details to API server return user info if correct
    return this.http.post<Response>('/api/php/auth.php', dataHeader)
  }

}
