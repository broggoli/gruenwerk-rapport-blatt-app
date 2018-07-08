class DBInterface {
    constructor(crypto){
        this.crypto = crypto;
    }

    saveNewUser(data, password){
        //hashing the name and encrypt with password so it can't easily be read out of the db
        const dbData = this.crypto.encryptForDB(data, password);

        return $.ajax({
            url: 'php/register.php',
            data: {dbData: dbData},
            type: "POST",
        });
    }
    getZiviData(ziviName, password, callback) {
      const ziviDataHeader = this.crypto.getZiviDataHeader(ziviName, password);
      return $.ajax({
          url: 'php/login.php',
          data: {ziviDataHeader: ziviDataHeader},
          type: "POST"
      }).done((d) => {
          console.log(d);
          const data = JSON.parse(d);
          const success = data[0];

          //If the ziviName and the password were put in correctly,
          //the php script returns an array where the first entry is true,
          // otherwhise it's false
            if(success === true){
            const encryptedZiviData = data[1];
            const decryptedZiviData =
                this.crypto.decryptData(encryptedZiviData, password);

            callback(decryptedZiviData);

          }else{
            alert("Login Failed!");
          }
      })
    .fail( (jqXHR, textStatus, errorMessage) => console.log(errorMessage));
    }
}
