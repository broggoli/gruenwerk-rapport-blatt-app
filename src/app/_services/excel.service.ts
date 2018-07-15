import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import * as XLSX from 'xlsx';

interface myData {
    success: boolean,
    message: string,
    data: string
}
interface ParsingOptions {
  type: string,
  bookType: string,
  cellStyles: boolean,
  sheetStubs: boolean,
  cellFormula: boolean
}

@Injectable({
  providedIn: 'root'
})
export class ExcelService {

  constructor(private http : HttpClient) {
    this.getTemplate().subscribe( data => {
      this.excelTemplate = data;
    })
  }

  excelTemplate: ArrayBuffer

  getTemplate() {
    return this.http.get('/api/php/getExcelTemplate.php', {
                            responseType: "arraybuffer"
                          })
  }
  getExcelFile(rapportblattData){

    const sheetTitle = [
                        "RB",
                        rapportblattData["ziviName"].replace(" ","_"),
                        rapportblattData["month"]
                      ].join("_");

    const r_opts = {
                      type: 'array',
                      bookType: 'xlsx',
                      cellStyles: true,
                      sheetStubs: true,
                      cellFormula: true
                    }
    let wb = XLSX.read(this.excelTemplate, {type: 'array'})

    let ws = wb.Sheets["Verein"]
    console.log(ws)
    const cols = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"];
    const tableStartRow = 9;

    console.log(rapportblattData, sheetTitle)
    wb.Props = {
        "Title" : "Verein",
        "Subject" : "Rapportblatt",
        "Author": "Nick Bachmanns Rapportblatt-Programm",
        "CreatedDate": new Date()
    }
    wb.SheetNames.push(sheetTitle)


    ws = addTableData(ws, cols, tableStartRow);
    ws = addHeader(ws);

    function addHeader(ws){
      const vorname: string = rapportblattData["ziviName"].split(" ")[0]
      const nachname: string = rapportblattData["ziviName"].split(" ")[1]
      const monthInt: number = parseInt(rapportblattData["month"].split("-")[1])
      const monathName: string = getMonthName(monthInt)
      const year: number = parseInt(rapportblattData["month"].split("-")[0])

      function getMonthName(i: number): string {
        let m = new Array();
        m[0] = "Januar";
        m[1] = "Februar";
        m[2] = "März";
        m[3] = "April";
        m[4] = "Mai";
        m[5] = "Juni";
        m[6] = "Juli";
        m[7] = "August";
        m[8] = "September";
        m[9] = "Oktober";
        m[10] = "November";
        m[11] = "Dezember";
        return m[i];
      }

      ws = add_cell_to_sheet(ws, "E4", nachname)
      ws = add_cell_to_sheet(ws, "I4", vorname)

      ws = add_cell_to_sheet(ws, "I2", year)
      ws = add_cell_to_sheet(ws, "E2", monathName)
      return ws;
    }
    function addTableData(ws, cols, startRow){

      const dayTypes = ["Arbeitstag","Frei","Krank","Ferien","Urlaub"]

      for(const rowNr in rapportblattData.table){
        const row = rapportblattData.table[rowNr];

        const sheetRow = parseInt(rowNr) + startRow;
        ws = add_cell_to_sheet(ws, "A"+sheetRow, row["dayName"]);
        ws = add_cell_to_sheet(ws, "B"+sheetRow, row["date"]);

        for(const index in dayTypes){
          const rowIndex = parseInt(index) + 3;
          const val = row["dayType"] == dayTypes[index] ? 1 : "";
          ws = add_cell_to_sheet(ws, cols[rowIndex]+sheetRow, val);
        }
        if(row["dayType"] === "Arbeitstag"){
            ws = add_cell_to_sheet(ws, "C"+sheetRow, row["workPlace"])
        }
        if(row["spesenChecked"] === true){
          ws = add_cell_to_sheet(ws, "I"+sheetRow, row["route"]["start"]+" - "+row["route"]["destination"])
          ws = add_cell_to_sheet(ws, "J"+sheetRow, row["price"])
        }
      }
      ws = add_cell_to_sheet(ws, "J49", rapportblattData.shoeMoney)
      return ws;
    }

    function add_cell_to_sheet(worksheet, address, value, currency = false) {
      /* cell object */
      let cell: {t: string, v: string, z: any} = {t: '?', v: value, z: false};
      currency ? cell.z = "##0.00" : false;

      /* assign type */
      if(typeof value == "string") cell.t = 's'; // string
      else if(typeof value == "number") cell.t = 'n'; // number
      else if(value === true || value === false) cell.t = 'b'; // boolean
      else if(value instanceof Date) cell.t = 'd';
      else throw new Error("cannot store value");

      /* add to worksheet, overwriting a cell if it exists */
      worksheet[address] = cell;
      return worksheet;
    }

      /* write workbook (use type 'binary') */
      const w_opt =
                  {
                    bookType: 'xlsx',
                    type: 'binary',
                    bookSST: true,
                    cellDates: true,
                    cellStyles: true,
                    sheetStubs: true,
                    cellFormula: true //, themeXLSX: theme
                  }
      var wbout = XLSX.write(wb, w_opts)

      return wbout
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

  // getExcelFile(rapportblattData){
  //   const sheetTitle = ["RB", tiviData.prename+"_"+tiviData.surname, rapportblattData["month"]].join("_");
  //   let wb = XLSX.utils.book_new();
  //   wb.Props = {
  //       "Title" : sheetTitle,
  //       "Subject" : "Rapportblatt",
  //       "Author": "Nick Bachmanns Rapportblatt-Programm",
  //       "CreatedDate": new Date()
  //   };
  //   wb.SheetNames.push(sheetTitle);
  //
  //   //making an array of arrays out of the table data from the rapportblattData
  //   let wsData = rapportblattData["tableData"].map( e => Object.values(e));
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
