<?php
  $GLOBALS["ziviDBPath"]                  = "../db/zivi_db.json";
  $GLOBALS["logDBPath"]                   = "../db/log_db.json";
  $GLOBALS["savedRapportblattDBPath"]     = "../db/saved_rapportblatt.json";
  $GLOBALS["settings"]                    = "../db/settings.json";

  function getSettings(){
    //Get the data base as a string
    $settingsStr = file_get_contents($GLOBALS["settings"]);
    if($settingsStr == "" || $settingsStr == "null"){
      $settingsStr = "{}";
    }
    //convert JSON string to object
    $settingsObject =  (object) json_decode($settingsStr, true);

    return $settingsObject;
  }

  /* returns the Data saved in the jsn data base with the $ziviDataHeader as key*/
  function getUserData($ziviDataHeader) {

    $response = new StdClass();
    $response->success = false;
    //Getting the DB as an object
    $ziviDBObject = getZiviDB();

    //Check whether the data header exists
    if(property_exists($ziviDBObject, $ziviDataHeader)){
      $response->message = "Data header exists!";
      //returning the encryptedZiviData
      $response->data = $ziviDBObject->{$ziviDataHeader};
      $response->success = true;
    }else{
      $response->message = "No users with this credentials found!";
    }
    return $response;
  }

  function deleteUserData($ziviDataHeader, $deleteRB) {

    $response = new StdClass();
    $response->success = false;

    $ziviDBObject = getZiviDB();
    $rapportBlattDataObject = getSavedRapportblattDB();

    $userData = getUserData($ziviDataHeader);
    $rapportBlattData = getSavedRapportblatt($ziviDataHeader, "all");
    if($userData->success == true){

      //delete the element form the object
      unset($ziviDBObject->{$ziviDataHeader});

      // encode array to json and save to file
      file_put_contents($GLOBALS["ziviDBPath"], json_encode($ziviDBObject));

      $response->message = "User data successsfully deleted";
      if( property_exists($rapportBlattDataObject, $ziviDataHeader )
           && $deleteRB == true) {
        unset($rapportBlattDataObject->{$ziviDataHeader});

        // encode array to json and save to file
        file_put_contents($GLOBALS["savedRapportblattDBPath"], json_encode($rapportBlattDataObject));

        $response->message = "User data and rapports successsfully deleted.";
      }else{
        $response->message = "User data successsfully deleted. But rapports remain!!";
      }

      $response->success = true;
    }else{
      $response = $userData;
    }
    return $response;
  }

  function saveUser($registerData){

    $userData = new stdClass();
    $response = new StdClass();
    $response->success = false;
    //Getting the DB as an object
    $ziviDBObject = getZiviDB();

    //Check whether the data header already exists
    if(property_exists($ziviDBObject, $registerData->ziviDataHeader)){
      $response->message = "User already exists!";
    }else{
      //User doesn't exist -> Save User
      $response->success = true;
    }

    //If everything is allright save the new user intop the json DB
    if($response->success == true){

      //Getting the Dataheader to use as key for the json object
      $dataHeader = (string)$registerData->ziviDataHeader;

      //setting the expiration date to approximately one year
      $monthsUntilExpiration = 40;
      $userData->expirationDate = time() + ($monthsUntilExpiration * 7 * 24 * 60 * 60);
      $userData->encryptedZiviData = $registerData->encryptedZiviData;

      $ziviDBObject->{$dataHeader} = $userData;

      // encode array to json and save to file
      file_put_contents($GLOBALS["ziviDBPath"], json_encode($ziviDBObject));

      $response->message = "Successfully registerd!";
    }
    return $response;
  }

  function replaceUserData( $registerData){

    $response = new StdClass();
    $response->success = false;

    $deleteUserData = deleteUserData($registerData->ziviDataHeader, false);

    if( $deleteUserData->success ){
      $saveUser = saveUser($registerData);

      if( $saveUser->success ){
        $response->success = true;
        $response->message = "Successfully Deleted and resaved User.";
      }else{
          $response->message = "Could not resave the user.";
      }
    }else{
      $response->message = "No User with these credentials found.";
    }

    return $response;
  }
/* returns the whole zivi data base as an object */
  function getZiviDB(){
    //Get the data base as a string
    $ziviDBStr = file_get_contents($GLOBALS["ziviDBPath"]);
    if($ziviDBStr == "" || $ziviDBStr == "null"){
      $ziviDBStr = "{}";
    }
    //convert JSON string to object
    $ziviDBObject =  (object) json_decode($ziviDBStr, true);

    return $ziviDBObject;
  }

  /* returns the Data saved in the jsn data base with the $ziviDataHeader as key*/
  function getSavedRapportblatt($ziviDataHeader, $month) {
    
    $response = new StdClass();
    $response->success = false;
    //Getting the DB as an object
    $savedRapportblattObj = getSavedRapportblattDB();

    //Check whether the data header exists
    if(property_exists($savedRapportblattObj, $ziviDataHeader)) {
      $response->message = "Data header exists!";

      if( !isset($month) || trim($month) == '' || trim($month) == 'all') {
        // Return all rapports of the user
        $responseData = new stdClass();
        $responseData->rbData = $savedRapportblattObj->{$ziviDataHeader};
        $responseData->month = "all";
        //returning the encryptedZiviData
        $response->data = $responseData;
        $response->message = "Successfully retrieved all rapports.";
        $response->success = true;
      }else{
        // Return Rapportblatt for specific month
        if(array_key_exists($month, $savedRapportblattObj->{$ziviDataHeader})){
          $responseData = new stdClass();
          $responseData->rbData = $savedRapportblattObj->{$ziviDataHeader}[$month];
          $responseData->month = $month;
          //returning the encryptedZiviData
          $response->data = $responseData;
          $response->message = "Successfully retrieved the rapportblatt for month: ".$month;
          $response->success = true;
        }else{
          $response->message = "No rapportblatt for this month found!";
        }
      }
    }else{
      $response->message = "No rapportblatt with this credentials found!";
      $response->data = json_encode(new stdClass());
    }
    return $response;
  }

  function saveRapportblatt($ziviDataHeader, $rbData, $month){

    $rapportBlattData = new stdClass();
    $response = new StdClass();
    //Getting the rapportblatt DB as an object
    $savedRapportblattObj = getSavedRapportblattDB();

    //Check whether the data header already exists
    if( property_exists($savedRapportblattObj, $ziviDataHeader) ){

      $rbForMonth = $savedRapportblattObj->{$ziviDataHeader};
      $savedRb = [];
      $savedRb["encrypted"] = true;
      $savedRb["data"] = $rbData;
      $rbForMonth[$month] = $savedRb;
      $savedRapportblattObj->{$ziviDataHeader} = $rbForMonth;

      $response->message = "Successfully saved the rapportblatt!";
    }else{
      $rbForMonth = [];
      $rbForMonth[$month] = $rbData;
      $savedRapportblattObj->{$ziviDataHeader} = $rbForMonth;

      $response->message = "Successfully saved the rapportblatt!";
    }


    // encode array to json and save to file
    file_put_contents($GLOBALS["savedRapportblattDBPath"], json_encode($savedRapportblattObj));

    $response->success = true;
    return $response;
  }

/* returns the whole saved rapportblatt data base as an object */
  function getSavedRapportblattDB(){
    //Get the data base as a string
    $savedRapportblattString = file_get_contents($GLOBALS["savedRapportblattDBPath"]);
    if($savedRapportblattString == "" || $savedRapportblattString == "null"){
      $savedRapportblattString = "{}";
    }
    //convert JSON string to object
    $savedRapportblattObj =  (object) json_decode($savedRapportblattString, true);

    return $savedRapportblattObj;
  }
