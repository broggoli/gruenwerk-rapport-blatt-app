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
  getExcelFile(rapportblattData, sheetTitle){
    const r_opts = {
                      type: 'array',
                      bookType: 'xlsx',
                      cellStyles: true,
                      sheetStubs: true,
                      cellFormula: true
                    }
    let wb = XLSX.read(this.excelTemplate, {type: 'array'})

    let ws = wb.Sheets["Verein"]
    const cols = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"];
    const tableStartRow = 9;
    var wscols = [
                  {wch: 2.5},
                  {wch: 6},
                  {wch: 12},
                  {wch: 9},
                  {wch: 9},
                  {wch: 9},
                  {wch: 9},
                  {wch: 9},
                  {wch: 9},
                  {wch: 9}
                ]

    ws['!cols'] = wscols

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
        ws = add_cell_to_sheet(ws, "B"+sheetRow, row["date"], false, true);

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

    function add_cell_to_sheet(worksheet, address, value, currency = false, date=false) {
      /* cell object */
      let cell: any = {t: "s", v: value, z: false};

      if( typeof value == "number" ) cell.t = 'n';
      currency ? cell.z = "##0.00": cell.z="0";
      if( date ) {
        cell.t = 'd'
        cell.z = 'dd/mm'
        const d: number = parseInt(value.split(".")[0])
        const m: number = parseInt(value.split(".")[1])-1
        const y: number = parseInt("20"+value.split(".")[2])

        cell.v = new Date(y, m , d)
        XLSX.utils.format_cell(cell); // this refreshes the formatted text.
      }

      /* add to worksheet, overwriting a cell if it exists */
      worksheet[address] = cell;
      return worksheet;
    }

      /* write workbook (use type 'binary') */
      const w_opts: any =
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
  excelForUpload(wbout){
      const now = new Date();

      function s2ab(s) {
          var buf = new ArrayBuffer(s.length);
          var view = new Uint8Array(buf);
          for (var i=0; i!=s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
          return buf;
      }

      return new Blob([s2ab(wbout)], {type:"application/octet-stream"})
  }
}
