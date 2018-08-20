import { Injectable } from '@angular/core';
import * as crypto from 'crypto-js';
import { ZiviData } from '../models/zivi.model'

interface enryptedData {
  ziviDataHeader: string,
  encryptedZiviData: string
}

@Injectable({
  providedIn: 'root'
})
export class CryptoService {

  constructor() { }

  encryptForDB(data: ZiviData, password: string): enryptedData {
    return {
      ziviDataHeader: this.getZiviDataHeader(data.email, password),
      encryptedZiviData: this.encryptData(JSON.stringify(data), password)
    }
  }
  //returns the name concatonated with the password as a sha256 hash
  getZiviDataHeader(email: string, password: string): string {
    return crypto.SHA256(email + password)
      .toString<string>()
  }

  // Gets an encrypted String that is returned as a parsed Object
  decryptData(encryptedData: string, password: string): string {
    return crypto.AES.decrypt(encryptedData, password)
      .toString<string>(crypto.enc.Utf8)
  };

  // Gets an object that is being stringyfied then encrypted
  //using the password
  encryptData(data: string, password: string): string {
    return crypto.AES.encrypt(JSON.stringify(data), password)
      .toString<string>()
  };

  generatePointer(length: number) {
    var code = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789ÄÖÜäöü!£&%{}";
  
    for (var i = 0; i < length; i++)
      code += possible.charAt(Math.floor(Math.random() * possible.length));
  
    return code;
  }
}
