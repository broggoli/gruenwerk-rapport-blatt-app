<?php
  $GLOBALS["ziviDBPath"]                  = "../db/zivi_db.json";
  $GLOBALS["logDBPath"]                   = "../db/log_db.json";
  $GLOBALS["savedRapportblattDBPath"]  = "../db/saved_rapportblatt.json";

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

  function deleteUserData($ziviDataHeader) {

    $response = new StdClass();
    $response->success = false;

    $ziviDBObject = getZiviDB();

    $userData = getUserData($ziviDataHeader);

    if($userData->success == true){

      //delete the element form the objet
      unset($ziviDBObject->{$ziviDataHeader});

      // encode array to json and save to file
      file_put_contents($GLOBALS["ziviDBPath"], json_encode($ziviDBObject));

      $response->message = "User data successsfully deleted.";
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

  function replaceUserData($ziviDataHeader, $registerData){

    $response = new StdClass();
    $response->success = false;

    $deleteUserData = deleteUserData($ziviDataHeader);
    $saveUser = saveUser($registerData);

    if( $deleteUserData->success ){
      $response->success = true;
    }
    if( !$saveUser->success ){
      $response = $saveUser;
    }
    if( $response->success ){
      $response->message = "Successfully replaced user data.";
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
  function getSavedRapportblatt($ziviDataHeader) {

    $response = new StdClass();
    $response->success = false;
    //Getting the DB as an object
    $savedRapportblattObj = getSavedRapportblattDB();

    //Check whether the data header exists
    if(property_exists($savedRapportblattObj, $ziviDataHeader)){
      $response->message = "Data header exists!";
      //returning the encryptedZiviData
      $response->data = $savedRapportblattObj->{$ziviDataHeader};
      $response->success = true;
    }else{
      $response->message = "No rapportblatt with this credentials found!";
    }
    return $response;
  }

  function saveRapportblatt($ziviDataHeader, $newRapportblatt){

    $userData = new stdClass();
    $response = new StdClass();
    //Getting the rapportblatt DB as an object
    $savedRapportblattObj = getSavedRapportblattDB();

    //Check whether the data header already exists
    if( property_exists($savedRapportblattObj, $ziviDataHeader) ){
      $response->message = "Rapportblatt overwritten!";
    }else{
      $response->message = "Successfully saved the rapportblatt!";
    }

    $savedRapportblattObj->{$ziviDataHeader} = $newRapportblatt;

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
