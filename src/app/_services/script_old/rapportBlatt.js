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

    }

    validateRapportBlatt(rapportBlattData){

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
                                alert("Du musst ein Ticketbeleg für den "+this.getDateString(row["date"])+" hochladen.");
                                return false;
                            }else{
                                return true;
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
                    console.log(workPlaceVal);
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
           alert(response);
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

        //making an array of arrays out of the table data from the rapportBlattData
        let wsData = rapportBlattData["tableData"].map( e => Object.values(e));

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
                };
    }
    getDateString(date, separator="."){
        const dd = date.getDate();
        const mm = date.getMonth()+1; //January is 0
        const yy = date.getFullYear().toString().slice(2,4);

        return [dd,mm,yy].join(separator);
    }
}
