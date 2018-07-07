class Table {
    constructor(imageHandler){
        this.imageHandler = imageHandler;
    }

    fillInDefaultData(ziviData, callback) {
        const fillInTodayDate = (date) => $("#today").text(this.getDateString(date));
        const fillInName = (name) => $("#ziviName").text(name);
        const fillInLastMonth = (date) => {
            let padZeros = (n, width) => {
                n = n + '';
                return n.length >= width ? n : new Array(width - n.length + 1).join("0") + n;
            }
            const month = date.getMonth()
            const year = date.getFullYear()
            //get the last moth as a string to input into the month chooser
            const dateInputValue = [year, padZeros(month, 2)].join("-")
            $("#rapportBlattMonth").val(dateInputValue);
        }
        const today = new Date();

        fillInTodayDate(today);
        fillInName(ziviData["ziviName"]);
        fillInLastMonth(today);

        this.fillInTable($("#rapportBlattMonth").val(), ziviData["dates"], callback);


    }
    fillInTable(yyyy_mm, startEndDates, callback){
        const tableDiv = $("#table");

        const year = parseInt(yyyy_mm.split("-")[0]);
        const month = parseInt(yyyy_mm.split("-")[1])-1; // January is 0

        const startDate = new Date(startEndDates["start"]);
        const endDate = new Date(startEndDates["end"]);

        const dates = this.getDatesOfMonth(month, year);
        //clearing the table
        tableDiv.html("")

        for(let i=0; i<dates.length; i++){
            //Only display dates where the zivi was working at Grünwerk
            if(dates[i][1].setHours(0,0,0,0) >= startDate.setHours(0,0,0,0) &&
                dates[i][1].setHours(0,0,0,0) <= endDate.setHours(0,0,0,0)){

                const dayName = dates[i][0];
                const d = dates[i][1];
                const date = this.getDateString(d);

                let rowHTML = $("<div/>").addClass("rapportBlattRow").attr("id",date).load( "pages/tableRow.html" ,
                    (e) => {
                        this.fillRow(rowHTML, dayName, d);
                        //If this is the last row
                        if(i == dates.length-1){
                            callback();
                        }
                });

                tableDiv.append(rowHTML);
            }
        }
    }
    fillRow(rowHTML, dayName, date){

        function getDefaultDayType(day){
            const dayNumber = day.getDay();
            if(dayNumber == 6 || dayNumber == 0){ return false }
            return true;
        }
        //Fill in the name and date of the row
        rowHTML.children(".dayName").text(dayName);
        rowHTML.children(".date").text(this.getDateString(date));

        //Change weekends per default to "Frei"

        //true if workday, false if weekend
        const isDefaultDay = getDefaultDayType(date);
        const defaultDay = "Arbeitstag";
        const defaultFallback = "Frei";

        rowHTML.children(".dayType").val(isDefaultDay ? defaultDay : defaultFallback);
        //If it's a workday, add workplaceInputs
        isDefaultDay ? this.addWorkPlaceInput(rowHTML): false;

        //Add in eventhandlers because this code is asyncronus
        this.addEventListeners(rowHTML);
    }
    addEventListeners(rowHTML){
        rowHTML.children(".dayType").change( (e) => {
            const parentElement = $(e.currentTarget).parent();
            this.addWorkPlaceInput(parentElement);
        });
        rowHTML.find(".spesenCheckbox")
        .change( (e) => {
            const p =  $(e.currentTarget).parent();
            const row = p.parent();
            p.children(".knob").toggleClass("checked");

            row.children(".fahrspesenDiv").toggleClass("notVisible");
            row.children(".spesenText").toggleClass("notVisible");
        });

        rowHTML.find(".ticketProof")
                .change( (e) => {

            const thisElement = $(e.currentTarget);
            const files = $(thisElement)[0].files;

            const rowDateString = rowHTML.children(".date").text().split(".").join("-");

            //loop through all added Files
            for (const file of files) {
                this.imageHandler.addImage(file, rowDateString, thisElement);
            }
        });
    }
    addWorkPlaceInput(row){
        if(row.children(".dayType").val() == "Arbeitstag"){
            row.children(".workPlace").removeClass("notVisible");
            row.children(".spesenInputs").removeClass("notVisible");
            row.children(".spesenText").removeClass("notVisible");
        }else{
            row.children(".workPlace").addClass("notVisible");
            row.children(".spesenInputs").addClass("notVisible");
            row.children(".spesenText").addClass("notVisible");
        }
    }
    getDateString(date, separator="."){
        const dd = date.getDate();
        const mm = date.getMonth()+1; //January is 0
        const yy = date.getFullYear().toString().slice(2,4);

        return [dd,mm,yy].join(separator);
    }
    getDatesOfMonth(month, year) {
        /* Returns a 2D array of [nameOfDay, dateObject]*/
        //Make the last month the default month

        function getDaysInMonth(month, year) {
             var date = new Date(year, month, 1);
             var days = [];
             while (date.getMonth() === month) {
                days.push(new Date(date));
                date.setDate(date.getDate() + 1);
             }
             return days;
        }
        function weekDayName(d){
            let weekday = new Array(7);
            weekday[0] = "So";
            weekday[1] = "Mo";
            weekday[2] = "Di";
            weekday[3] = "Mi";
            weekday[4] = "Do";
            weekday[5] = "Fr";
            weekday[6] = "Sa";
            return weekday[d.getDay()];
        }

        let datesToRepport = getDaysInMonth(month, year);
        let dates = datesToRepport.map((d) => [weekDayName(d), d]);
        return dates;
    }
}
