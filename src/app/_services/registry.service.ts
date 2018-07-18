import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { CryptoService } from './crypto.service'

interface registryData {
    success: boolean,
    message: string
}
@Injectable({
  providedIn: 'root'
})
export class RegistryService {

  constructor(private crypto: CryptoService,
              private http : HttpClient) { }

  saveNewUser(userDataForDB, password){
        //hashing the name and encrypt with password so it can't easily be read out of the db
    const dbData = JSON.stringify({'dbData': this.crypto.encryptForDB(userDataForDB, password)})
    // post these details to API server return user info if correct
    return this.http.post<registryData>('/api/php/register.php', dbData)
  }
}
