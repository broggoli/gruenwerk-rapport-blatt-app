class Crypto{
    constructor(){
        console.log("loaded crypto");
    }
    //Returns an object with the hashed zivi name
    encryptForDB(data, password){

        return  {
                    ziviDataHeader: this.getZiviDataHeader(data["ziviName"], password),
                    encryptedZiviData: this.encryptData(data, password)
                };
    }
    //returns the name concatonated with the password as a sha256 hash
    getZiviDataHeader(ziviName, password){
                                return CryptoJS.SHA256(ziviName + password)
                                .toString()};

    // Gets an encrypted String that is returned as a parsed Object
    decryptData(encryptedData, password){
                                return CryptoJS.AES.decrypt(encryptedData, password)
                                    .toString(CryptoJS.enc.Utf8)};

    // Gets an object that is being stringyfied then encrypted
    //using the password
    encryptData(data, password) {
                            return CryptoJS.AES.encrypt(JSON.stringify(data), password)
                                .toString()};
}
