import { Injectable } from '@angular/core';
import * as crypto from 'crypto-js';

interface userData{
    surname: string ,
    prename: string,
    email: string
}
interface enryptedData {
  ziviDataHeader: string,
  encryptedZiviData: string
}

@Injectable({
  providedIn: 'root'
})
export class CryptoService {

  constructor() { }

  encryptForDB(data: userData, password: string): enryptedData{
    return  {
                ziviDataHeader: this.getZiviDataHeader(data.email, password),
                encryptedZiviData: this.encryptData(data, password)
            }
    }
    //returns the name concatonated with the password as a sha256 hash
    getZiviDataHeader(email: string, password: string): string{
                                return crypto.SHA256(email + password)
                                .toString<string>()}

    // Gets an encrypted String that is returned as a parsed Object
    decryptData(encryptedData: string, password: string): string{
                                return crypto.AES.decrypt(encryptedData, password)
                                    .toString<string>(crypto.enc.Utf8)};

    // Gets an object that is being stringyfied then encrypted
    //using the password
    encryptData(data: userData, password: string): string {
                            return crypto.AES.encrypt(JSON.stringify(data), password)
                                .toString<string>()};
}
