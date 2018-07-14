class Rapportblatt {
    constructor(table){
        this.table = table;
    }
    //when document is loaded start the code
    onload() {
        const ziviData = this.getZiviData();

        this.table.fillInDefaultData(ziviData, this.updateSummary.bind(this));
        this.startEventHandlers();

    }
    getZiviData(){
        const localStorageFile = localStorage.getItem("ziviData");
        if (localStorageFile === null) {
            console.log("No file found in localStorage");
            return false;
        }else{
            return JSON.parse(localStorageFile);
        }
    }
    startEventHandlers(){
        $("#rapportBlattMonth").change((e) => {
            this.table.fillInTable($("#rapportBlattMonth").val(), JSON.parse(localStorage.getItem('ziviData'))["dates"], this.updateSummary.bind(this));
        });

        //If a value in the 'rapportBlatt div' chnages update the summary
        $("#rapportBlatt").change( (e) => {
            this.updateSummary();
        });

        $("#sendButton").click( (e) => {

            const ziviData = JSON.parse(localStorage.getItem('ziviData'));
            const rapportBlattData = this.getRapportBlattObject(ziviData);

            if(this.validateRapportBlatt(rapportBlattData) === true){
                const sheetTitle = "Rapportblatt_" +
                                rapportBlattData["ziviName"].replace(" ","_");
                const excel = this.excelForUpload(
                                this.getExcelFile(rapportBlattData),
                                rapportBlattData["ziviName"],
                                rapportBlattData["month"]);

                this.sendRapportBlatt(excel,
                            rapportBlattData["ziviName"],
                            ziviData["abo"],
                            rapportBlattData["month"]);
            }
        });
    }

    getRapportBlattObject(ziviData){
        const tableDiv = $("#table");
        const rapportBlattRows = tableDiv.children(".rapportBlattRow");

        let tableData = [];

        rapportBlattRows.each(function(i) {

            //To save the date as a date object and not as a string it has to be parsed first.
            const dateStringArray = $(this).children(".date").text().split(".");
            const millenium = "20";
            const day = parseInt(dateStringArray[0]);
            const month = parseInt(dateStringArray[1]) - 1;
            const year = parseInt(millenium + dateStringArray[2]);

            const date = new Date (year, month, day);

            //Parsing the string in the event that the user has left the input blank (string ="")
            const priceString = $(this).find(".price").val();
            const price = priceString == "" || priceString == "Preis" ? 0 : parseFloat(priceString);

            const rowObject = {
                dayName: $(this).find(".dayName").text(),
                date : date,
                dayType : $(this).find(".dayType").val(),
                workPlace : validate.prettify( $(this).find(".workPlace").val() ),
                ticketProof: $(this).find(".spesenCheckbox")[0].checked,
                route : validate.prettify( $(this).find(".route").val() ).replace(" ", "-"),
                price : price
            };

            tableData.push(rowObject);
        });

        let rapportBlattData = {
            ziviName : ziviData["ziviName"],
            tableData : tableData,
            month: $("#rapportBlattMonth").val(),
            summary : {
                dayTypes: {
                    krankTage: tableData.reduce((previous, o) => (o["dayType"] == "Krank")
                                                                    ? previous+1
                                                                    : previous, 0),
                    freiTage: tableData.reduce((previous, o) => (o["dayType"] == "Frei")
                                                                    ? previous+1
                                                                    : previous, 0),
                    ferienTage: tableData.reduce((previous, o) => (o["dayType"] == "Ferien")
                                                                    ? previous+1
                                                                    : previous, 0),
                    urlaubstage: tableData.reduce((previous, o) => (o["dayType"] == "Urlaub")
                                                                    ? previous+1
                                                                    : previous, 0),
                    arbeitsTage: tableData.reduce((previous, o) => (o["dayType"] == "Arbeitstag")
                                                                    ? previous+1
                                                                    : previous, 0)
                },
                spesenPreis: tableData.reduce((previous, o) => previous + o["price"], 0)
            }
        }
        return rapportBlattData;
    }
    updateSummary(){

        const ziviData = this.getZiviData();

        // Normalentschädigung ist 25Fr./Tag
        const normalPay = 25;
        const urlaubPay = 0;

        const rapportBlattData = this.getRapportBlattObject(ziviData);
        const summary = rapportBlattData["summary"];

        const wds     =   summary["dayTypes"]["arbeitsTage"];
        const frds    =   summary["dayTypes"]["freiTage"];
        const sds     =   summary["dayTypes"]["krankTage"];
        const feds    =   summary["dayTypes"]["ferienTage"];
        const uds     =   summary["dayTypes"]["urlaubstage"]
        const totalDayCompensation = normalPay * (feds + sds + frds + wds)

        $(".workDaySummary").text(wds);
        $(".workDayPay").text(wds * normalPay);

        $(".freeDaySummary").text(frds);
        $(".freeDayPay").text(frds * normalPay);

        $(".sickDaySummary").text(sds);
        $(".sickDayPay").text(sds * normalPay);

        $(".ferientageSummary").text(feds);
        $(".holidayPay").text(feds * normalPay);

        $(".urlaubstageSummary").text(uds);
        //Allways 0
        $(".urlaubPay").text(uds * urlaubPay);

        $("#totalDayCompensation").text(totalDayCompensation);

        $("#totalFahrspesenCompensation").text(summary["spesenPreis"])

        $("#totalPay").text(summary["spesenPreis"]+totalDayCompensation);

    }

    validateRapportBlatt(rapportBlattData, test=false){
        if(test){
            return true;
        }
        const workPlaceConstraints = {
                        workPlace: {
                            presence: {
                                    allowEmpty: false,
                                    message: "Der Arbeitsort für den #date# muss angegeben werden."
                                }
                        }
                    };
        const ticketProofConstraints = {
                        route: {
                            presence: {
                                    allowEmpty: false,
                                    message: "Die Route für den #date# muss angegeben werden."
                                }
                        },
                        price: {
                            presence: {
                                allowEmpty: false,
                                message: "Der Preis für das Billet vom #date# muss angegeben werden."
                            },
                            numericality: {
                                onlyInteger: false,
                                greaterThan: 0,
                                lessThanOrEqualTo: 100,
                                message: "Der Preis für das Billet vom #date# muss angegeben werden."
                            }
                        }
                    };

        for(const row of rapportBlattData["tableData"]){
            //If the day is a workday, there must be a wokplace defined
            if(row["dayType"] == "Arbeitstag"){

                const workPlaceVal = validate({workPlace: row["workPlace"]},
                                            workPlaceConstraints,
                                            {fullMessages: false,
                                            format: "flat"});

                if(workPlaceVal === undefined){

                    //If the toggle to put in a ticket proof has been put in
                    //only allow sending if the user has put in at least one image
                    //and a price and route
                    if(row["ticketProof"] === true){

                        const ticketProofVal = validate({
                                                        route: row["route"],
                                                        price: row["price"]
                                                    }, ticketProofConstraints,
                                                    {fullMessages: false,
                                                    format: "flat"});
                        if(ticketProofVal === undefined){
                            const amountOfTicketProofFiles = this.table.imageHandler
                                                                .images[this.getDateString(
                                                                            row["date"])
                                                                            .split(".")
                                                                            .join("-")];
                            if( amountOfTicketProofFiles == undefined){
                                alert("Du musst ein Ticketbeleg für den "+
                                    this.getDateString(row["date"])+" hochladen.");
                                return false;
                            }

                        }else{
                            const errorText = ticketProofVal[0]
                                                    .toString()
                                                    .replace("#date#",
                                                        this.getDateString(row["date"]));
                            alert(errorText);
                            return false;
                        }
                    }
                }else{
                    const errorText = workPlaceVal[0]
                                            .toString()
                                            .replace("#date#",
                                                this.getDateString(row["date"]));
                    alert(errorText);
                    return false;
                }
            }
        }
        return true;
    }
    sendRapportBlatt(excel, ziviName, aboInfo, rapportBlattMonth){

        const ticketProofImages = this.table.imageHandler.images;
        let formData = new FormData();

        formData.append("excelFile[]", excel["file"], excel["name"]);
        for(const date in ticketProofImages){

            //declare the file name
            const fileName = ["Billet_Beleg", ziviName.split(" ").join("_"), date].join("_");
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
        formData.append("ziviName", ziviName);
        formData.append("aboInfo", aboInfo);
        formData.append("month", rapportBlattMonth);

        $.ajax({
           url: "php/uploadTicket.php",
           type: "POST",
           data: formData,
           processData: false,
           contentType: false
       }).done( response => {
           alert(response)
           alert("Rapportblatt wurde verschickt.");
           console.log(response);
       }).fail( (jqXHR, textStatus, errorMessage) =>{
           console.log(errorMessage); // Optional
       });
    }
    getExcelFile(rapportBlattData){

        const sheetTitle = ["RB", rapportBlattData["ziviName"].replace(" ","_"), rapportBlattData["month"]].join("_");
        let wb = XLSX.utils.book_new();
        wb.Props = {
            "Title" : sheetTitle,
            "Subject" : "Rapportblatt",
            "Author": "Nick Bachmanns Rapportblatt-Programm",
            "CreatedDate": new Date()
        };
        wb.SheetNames.push(sheetTitle);

        let cols = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"];
        let ws = {};
        ws = getWs( {r: 45, c: 12} );

        ws = addHeader(ws, cols);
        const tableStartRow = 6;
        ws = addTableData(ws, cols, tableStartRow);
        ws = addSummary(ws, cols, tableStartRow);

        wb.Sheets[sheetTitle] = ws;

        /* write workbook (use type 'binary') */
        let wbout = XLSX.write(wb, {bookType:'xlsx', type:'binary'});

        return wbout;

        function getWs(e){
            const range = {s:{r: 0, c: 0},
                        e: e};

            ws['!ref'] = XLSX.utils.encode_range(range);
            const wscols = [
                {wch:3},
                {wch:30},
                {wch:12},
                {wch:12},
                {wch:12},
                {wch:12},
                {wch:12},
                {wch:12},
                {wch:12},
                {wch:12}
            ];
            ws['!cols'] = wscols;
            return ws;
        }
        function addHeader(ws, cols){
            const TitleRow = ["","Verrein Grünwerk Zivildienst", "Rapportblatt",
                            "Von:", rapportBlattData["ziviName"],
                            "Monat:", rapportBlattData["month"]];
            const overHeader =    [""    ,""     ,""      ,"Entschädigung",""     ,""         ,""     ,"Fahrspesen"];
            const header =    ["Tag"  ,"Datum","Arbeitstag"   ,"Frei"        ,"Krank","Ferien"   ,"Urlaub" ,"Arbeitsort","Strecke","Preis"];
            for(const index in TitleRow){
                ws = add_cell_to_sheet(ws, cols[index]+"1", TitleRow[index]);
            }
            for(const index in overHeader){
                ws = add_cell_to_sheet(ws, cols[index]+"3", overHeader[index]);
            }
            for(const index in header){
                ws = add_cell_to_sheet(ws, cols[index]+"4", header[index]);
            }
            return ws;
        }
        function addTableData(ws, cols, startRow){

            const dayTypes = ["Arbeitstag","Frei","Krank","Ferien","Urlaub"]

            for(const rowNr in rapportBlattData["tableData"]){
                const row = rapportBlattData["tableData"][rowNr];

                const sheetRow = parseInt(rowNr) + startRow;
                ws = add_cell_to_sheet(ws, "A"+sheetRow, row["dayName"]);
                ws = add_cell_to_sheet(ws, "B"+sheetRow, row["date"]);

                for(const index in dayTypes){
                    const rowIndex = parseInt(index) + 2;
                    const val = row["dayType"] == dayTypes[index] ? 1 : "";
                    ws = add_cell_to_sheet(ws, cols[rowIndex]+sheetRow, val);
                }

                if(row["ticketProof"] === true){
                    ws = add_cell_to_sheet(ws, "H"+sheetRow, row["workPlace"]);
                    ws = add_cell_to_sheet(ws, "I"+sheetRow, row["route"]);
                    ws = add_cell_to_sheet(ws, "J"+sheetRow, row["price"]);
                }
            }
            return ws;
        }
        function addSummary(ws, cols, tableStartRow){


            const summaryStartRow = tableStartRow + 31 + 2;
            const dayTypes = {  "Arbeitstag": 25,
                                "Frei": 25,
                                "Krank": 25,
                                "Ferien": 25,
                                "Urlaub": 0
                        }

            ws = add_cell_to_sheet(ws, "B"+(summaryStartRow), "Total Tage");
            ws = add_cell_to_sheet(ws, "B"+(summaryStartRow+1), "Betrag");
            let colIndex = 2;
            for(const dayType in dayTypes){

                const sumAddress = cols[colIndex]+summaryStartRow;
                const betragAdress = cols[colIndex]+(summaryStartRow+1);

                const sumCol = cols[colIndex];
                ws = add_formula_to_sheet(ws, sumAddress,
                        "SUM("+ sumCol+tableStartRow+":"+sumCol+(tableStartRow+31) +")",
                        true);
                ws = add_formula_to_sheet(ws, betragAdress,
                                    dayTypes[dayType]+"*"+sumAddress,
                                    true);

                colIndex++;
            }

            //The sum of all the paied days
            ws = add_cell_to_sheet(ws, "B"+(summaryStartRow+2), "Total Entschädigung");
            ws = add_formula_to_sheet(ws, "C"+(summaryStartRow+2),
                        "SUM(C"+(summaryStartRow+1)+":G"+(summaryStartRow+1)+")",
                        true);

            //The sum of all the ticket prices
            ws = add_cell_to_sheet(ws, "B"+(summaryStartRow+3), "Total Fahrspesen");
            ws = add_formula_to_sheet(ws, "C"+(summaryStartRow+3),
                "SUM("+ "J"+tableStartRow+":"+"J"+(tableStartRow+31) +")", true);

            //Just so this is there to manipulate
            ws = add_cell_to_sheet(ws, "B"+(summaryStartRow+4), "Total Entschädigung Schuhwerk");
            ws = add_cell_to_sheet(ws, "C"+(summaryStartRow+4), 0, true);

            //The total pay
            ws = add_cell_to_sheet(ws, "B"+(summaryStartRow+5), "Total zur Auszahlung");
            ws = add_formula_to_sheet(ws,
                    "C"+(summaryStartRow+5), "SUM(C"+(summaryStartRow+2)+":C"+(summaryStartRow+4)+")",
                    true);

            return ws;
        }
        function add_cell_to_sheet(worksheet, address, value, currency = false) {

            /* cell object */
        	let cell = {t:'?', v:value};
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
        function add_formula_to_sheet(worksheet, address, formula, currency = false){
            /* cell object */
        	let cell = {f: formula};

            currency ? cell.z = "##0.00" : false;
        	/* add to worksheet, overwriting a cell if it exists */
        	worksheet[address] = cell;
            return worksheet;
        }
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
                };
    }
    getDateString(date, separator="."){
        const dd = date.getDate();
        const mm = date.getMonth()+1; //January is 0
        const yy = date.getFullYear().toString().slice(2,4);

        return [dd,mm,yy].join(separator);
    }
}
