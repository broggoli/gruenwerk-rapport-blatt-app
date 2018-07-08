import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { CryptoService } from './crypto.service'

interface myData {
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

  saveData(data: string, password: string){
      const decryptedData = this.crypto.decryptData(data, password)
      console.log(decryptedData)
      console.log(this.crypto.decryptData(data, password), data, password)
      localStorage.setItem("userData", decryptedData)
  }
  // get acts like a property name even thiugh it's a function
  get isLoggedIn(){
    return localStorage.getItem("userData") ? true : false
  }

  getEncryptedData(userName, password) {
    const dataHeader= JSON.stringify(
                      {
                        'ziviDataHeader': this.crypto.
                              getZiviDataHeader(userName, password)
                      })
    // post these details to API server return user info if correct
    return this.http.post<myData>('/api/php/auth.php', dataHeader)
  }

}
