import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'

@Injectable({
  providedIn: 'root'
})
export class ExcelService {

  constructor(private http : HttpClient) { }

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
