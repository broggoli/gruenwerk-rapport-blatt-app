class PageLoader{
    constructor() {
        // window.onpopstate = function(e) {
        //     let pageToLoad = history.state["page"]
        //     loadPage(pageToLoad)
        // }
    }

    loadPage(page, onload){
        $( "#content" ).load( "pages/"+page+".html", function() {
            history.pushState({page}, page, page+".html");
            $( "#content" ).attr("class", page);
            console.log( "Loaded "+page+".");

            onload();
        });
    }
    pageReload() {window.location.href = '.'};

    redirectToMainSite(rapportBlatt){
        $("#logOutButton").toggleClass("loggedOut");
        this.loadPage("rapportBlattPage", rapportBlatt.onload.bind(rapportBlatt));
    }
}
