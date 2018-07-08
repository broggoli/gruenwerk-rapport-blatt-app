$.getScript('script/login.js')
.pipe($.getScript('script/register.js'))
.pipe($.getScript('script/rapportBlatt.js'))
.pipe($.getScript('script/table.js'))
.pipe($.getScript('script/imageHandler.js'))
.pipe($.getScript('script/pageLoader.js'))
//cryptoFiles
.pipe($.getScript('script/cryptography.js'))
.pipe($.getScript('script/dbInterface.js'))
//dependencies
.pipe($.getScript("script/lib/validate.min.js"))
.pipe($.getScript('script/lib/sha256.js'))
.pipe($.getScript('script/lib/aes.js'))
.pipe($.getScript('script/lib/xlsx.full.min.js', () => {

    console.log("All scripts loaded!");
    //Start the App now that all the files are loaded
    start();
}));

function start() {

    const pageLoader = new PageLoader();
    const crypto = new Crypto();
    const dbInterface = new DBInterface(crypto);
    const imageHandler = new ImageHandler();
    const table = new Table(imageHandler);
    const rapportBlatt = new Rapportblatt(table);
    const register = new Register(pageLoader, dbInterface, rapportBlatt);
    const login = new Login(pageLoader, dbInterface, register, rapportBlatt);

    //try to sign in automattically
    login.signInAutomatically();

}
