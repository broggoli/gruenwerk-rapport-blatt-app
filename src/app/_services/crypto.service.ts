import { Injectable } from '@angular/core';
import * as crypto from 'crypto-js';

@Injectable({
  providedIn: 'root'
})
export class CryptoService {

  constructor() { }

  encryptForDB(data, password){
    return  {
                ziviDataHeader: this.getZiviDataHeader(data.email, password),
                encryptedZiviData: this.encryptData(data, password)
            }
    }
    //returns the name concatonated with the password as a sha256 hash
    getZiviDataHeader(email, password){
                                return crypto.SHA256(email + password)
                                .toString()}

    // Gets an encrypted String that is returned as a parsed Object
    decryptData(encryptedData, password){
                                return crypto.AES.decrypt(encryptedData, password)
                                    .toString(crypto.enc.Utf8)};

    // Gets an object that is being stringyfied then encrypted
    //using the password
    encryptData(data, password) {
                            return crypto.AES.encrypt(JSON.stringify(data), password)
                                .toString()};
}
