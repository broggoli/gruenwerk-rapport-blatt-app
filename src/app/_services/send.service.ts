import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'

@Injectable({
  providedIn: 'root'
})
export class SendService {

  constructor(private http : HttpClient) {}

  sendRapportblatt(data){
      const ticketProofImages = data.images
      let formData = new FormData()

      formData.append("excelFile[]", data.excel.file, data.excel.name)
      for(const date in data.images){
          //declare the file name
        
          // TODO: change name of images based on settings file
          const fileName = ["Billet_Beleg", data.lastName, data.firstName, date].join("_");
          if(ticketProofImages[date].length > 1) {
              for(let i=0; i < ticketProofImages[date].length; i++){

                  formData.append('ticketProofFiles[]', ticketProofImages[date][i], fileName+"_"+(i+1));
              }
          }else{
              formData.append('ticketProofFiles[]', ticketProofImages[date][0], fileName);
          }
      }
      function padZeros(n, width) {
        n = n + '';
        return n.length >= width ? n : new Array(width - n.length + 1).join("0") + n;
      }

      //for now just a test
      // formData.append("recipients", JSON.stringify([
      //                                 {
      //                                   "mail": "verein@verein-gruenwerk.ch",
      //                                   "name": "Verein-Gruenwerk"
      //                                 },
      //                                 {
      //                                   "mail": "broggoli.nb@gmail.com",
      //                                   "name": "Nick Bachmann"
      //                                 }
      //                               ]));
      formData.append("firstName", data.firstName);
      formData.append("firstName", data.firstName);
      formData.append("lastName", data.lastName);
      formData.append("aboInfo", data.abo);
      formData.append("year", data.month.split("-")[0].slice(-2));
      formData.append("month", data.month.split("-")[1]);

      return this.http.post('/api/php/uploadTicket.php', formData)
      //return this.http.post<myData>('/api/php/uploadTicket.php', formData)
  }
}
