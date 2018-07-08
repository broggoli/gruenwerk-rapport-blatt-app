class Register {

    constructor(pageLoader, dbInterface, rapportBlatt){
        this.pageLoader = pageLoader;
        this.dbInterface = dbInterface;
        this.rapportBlatt = rapportBlatt;
    }

    register() {
        const data = this.getFormData();

        if(this.validateRegister(data)){
            const password = this.getRegisterPassword();
            // TODO: validate password
            this.dbInterface.saveNewUser(data, password)
                .done( d => {
                    console.log(d);
                    this.checkRegistry(JSON.parse(d));
                }
            );
        }else {
            console.log("Validation failed!");
        }
    }

    onload() {

      document.getElementById("registerBackButton")
                    .addEventListener("click", (e) => this.pageLoader.pageReload());

       document.getElementById("register")
                    .addEventListener("click", (e) => this.register());
                    // Sets the Dates of the date input fields
                this.setDates();


    }
    setDates() {
        const now = new Date();
        const dateIputValue = now.toJSON().slice(0,10);
        $('#startDate').val(dateIputValue);
        $('#endDate').attr('min', $('#startDate').val());
        $('#endDate').val(dateIputValue);
    }
    checkRegistry(response){
        console.log(response);
        if(response === true){
            alert("Erfolgreich Registriert!");
            this.pageLoader.pageReload();
        }else{
            console.log("Error: "+response);
        }
    }

    getFormData() {
        return {
            ziviName : this.getRegisterUserName(),
            dates: {
                start : this.getSDate(),
                end : this.getEDate()
            },
            email : this.getEmail(),
            abo: this.getAbo()
        }
    }

    // TODO: Validtion of fields
    validateRegister(data){
        return true;
    }

    //Functions for getting the values of the input Fields
    getRegisterUserName() { return $("#registerUserName").val() };
    getRegisterPassword() { return $("#registerPassword").val() };
    getSDate() { return $("#startDate").val() };
    getEDate(){ return $("#endDate").val() };
    getEmail(){ return $("#email").val() };
    getAbo(){ return $("#abo").val() };
}
