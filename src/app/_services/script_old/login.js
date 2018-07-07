class Login {
    constructor(pageLoader, dbInterface, register, rapportBlatt){
        this.pageLoader = pageLoader;
        this.dbInterface = dbInterface;
        this.register = register;
        this.rapportBlatt = rapportBlatt

        document.getElementById("logOutButton").addEventListener("click", (e) => this.logout());
    }

    login() {
        const redirect = (decryptedZiviData) => {
            //loging in
            if (typeof(Storage) !== "undefined") {
              localStorage.setItem('ziviData', decryptedZiviData);
              this.pageLoader.redirectToMainSite(this.rapportBlatt);
            } else {
              alert("no storage support");
              // No Web Storage support..
              //sessionStorage.setItem('ziviData', decryptedZiviData);
            }
      }

      if(this.validateLogin() === true){
          this.dbInterface.getZiviData(this.getUserName(), this.getPassword(), redirect);
      }

    }
    logout(){
        localStorage.removeItem("ziviData");
        $("#logOutButton").toggleClass("loggedOut");
        console.log("logged out!");
        this.pageLoader.loadPage("loginPage", this.onload.bind(this));
    }

    signInAutomatically() {
        if(localStorage.getItem('ziviData')){
            console.log(localStorage.getItem('ziviData'));
            this.pageLoader.redirectToMainSite(this.rapportBlatt);
        }else{
            //load login form into content div
            this.pageLoader.loadPage("loginPage", this.onload.bind(this));
        }
    }

    onload(){
        let l = () => this.login();
        $('input').keypress(function (e) {
            if (e.which == 13) {
                l();
                return false;
            }
        });
        document.getElementById("toRegisterButton")
            .addEventListener("click", (e) =>
            this.pageLoader.loadPage('registerPage', this.register.onload.bind(this.register)));
        document.getElementById("login")
            .addEventListener("click", (e) => this.login());
    }

    // TODO: WHole validation
    validateLogin(){
      if(false){
          return false;
      }else{
          return true;
      }
    }

    getUserName() {return $("#userName").val()};
    getPassword() {return $("#password").val()};
}
