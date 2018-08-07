import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { CryptoService } from './crypto.service'
import { ZiviData } from '../ziviData'

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
      console.log(data, password)
      const decryptedData: ZiviData = JSON.parse(this.crypto.decryptData(data, password))
      localStorage.setItem("userData", JSON.stringify(decryptedData))
      console.log(localStorage.getItem("userData"))
  }
  // get acts like a property name even thiugh it's a function
  get isLoggedIn(): LoginStatus {
    if( localStorage.getItem("userData") !== null ){
      return {  
                local: true,
                online: this.http.post<Response>('/api/php/auth.php', JSON.stringify({task: 'isLoggedIn'}))
            }
    }else{
      return {  
          local: false,
          online: null
        }
    }
  }

  login(userName: string, password: string) {
    const dataHeader= JSON.stringify({
                        data: 
                          {
                            'ziviDataHeader': this.crypto.
                                  getZiviDataHeader(userName, password)
                          },
                        task: "login"
                      })
    // post these details to API server return user info if correct
    return this.http.post<Response>('/api/php/auth.php', dataHeader)
  }

}
