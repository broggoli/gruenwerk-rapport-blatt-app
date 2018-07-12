import { Injectable } from '@angular/core';
import { HttpClient, HttpRequest } from '@angular/common/http'
import * as XLSX from 'xlsx';

interface myData {
    success: boolean,
    message: string,
    data: string
}

@Injectable({
  providedIn: 'root'
})
export class ExcelService {

  constructor(private http : HttpClient) { }

  getExcelFile(rapportBlattData){

      const sheetTitle = ["RB", rapportBlattData.ziviName.replace(" ","_"), rapportBlattData["month"]].join("_");
      let wb = XLSX.utils.book_new();
      wb.Props = {
          "Title" : sheetTitle,
          "Subject" : "Rapportblatt",
          "Author": "Nick Bachmanns Rapportblatt-Programm",
          "CreatedDate": new Date()
      };
      wb.SheetNames.push(sheetTitle);

      //making an array of arrays out of the table data from the rapportBlattData
      let wsData = rapportBlattData.table.map( e => Object.values(e));

      let ws = XLSX.utils.aoa_to_sheet(wsData);
      wb.Sheets[sheetTitle] = ws;

      /* write workbook (use type 'binary') */
      var wbout = XLSX.write(wb, {bookType:'xlsx', type:'binary'});

      return wbout;
  }
  excelForUpload(wbout, ziviName, month){
      const now = new Date();
      //Sheet title in the Form: Rapportblatt_Max_Mustermann_12-4-18
      const fileName = ["RB", ziviName.replace(" ","_"), month].join("_");

      function s2ab(s) {
          var buf = new ArrayBuffer(s.length);
          var view = new Uint8Array(buf);
          for (var i=0; i!=s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
          return buf;
      }

      return  {
                  "file": new Blob([s2ab(wbout)], {type:"application/octet-stream"}),
                  "name": fileName
              }
  }
  sendRapportblatt(data){
      const ticketProofImages = data.images
      let formData = new FormData()

      formData.append("excelFile[]", data.excel.file, data.excel.name)
      for(const date in data.images){
          //declare the file name
          const fileName = ["Billet_Beleg", data.ziviName.split(" ").join("_"), date].join("_");
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
      formData.append("receiver", JSON.stringify({
                                      "mail": "broggoli.nb@gmail.com",
                                      "name": "Nick Bachmann"}));
      formData.append("ziviName", data.ziviName);
      formData.append("aboInfo", data.abo);
      formData.append("month", data.month);

      return this.http.post('/api/php/uploadTicket.php', formData)
      //return this.http.post<myData>('/api/php/uploadTicket.php', formData)
  }
  // getExcelFile(rapportBlattData){
  //   const sheetTitle = ["RB", tiviData.prename+"_"+tiviData.surname, rapportBlattData["month"]].join("_");
  //   let wb = XLSX.utils.book_new();
  //   wb.Props = {
  //       "Title" : sheetTitle,
  //       "Subject" : "Rapportblatt",
  //       "Author": "Nick Bachmanns Rapportblatt-Programm",
  //       "CreatedDate": new Date()
  //   };
  //   wb.SheetNames.push(sheetTitle);
  //
  //   //making an array of arrays out of the table data from the rapportBlattData
  //   let wsData = rapportBlattData["tableData"].map( e => Object.values(e));
  //
  //   let ws = XLSX.utils.aoa_to_sheet(wsData);
  //   wb.Sheets[sheetTitle] = ws;
  //
  //   /* write workbook (use type 'binary') */
  //   var wbout = XLSX.write(wb, {bookType:'xlsx', type:'binary'});
  //
  //   return wbout;
  //   }
  //
  // excelForUpload(wbout, ziviName, month){
  //     const now = new Date();
  //     //Sheet title in the Form: Rapportblatt_Max_Mustermann_12-4-18
  //     const fileName = ["RB", ziviName.replace(" ","_"), month].join("_");
  //
  //     function s2ab(s) {
  //         var buf = new ArrayBuffer(s.length);
  //         var view = new Uint8Array(buf);
  //         for (var i=0; i!=s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
  //         return buf;
  //     }
  //     return  {
  //                 "file": new Blob([s2ab(wbout)], {type:"application/octet-stream"}),
  //                 "name": fileName
  //             };
  // }
}
