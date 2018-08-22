<?php
  $GLOBALS["ziviDBPath"]                  = "../db/zivi_db.json";
  $GLOBALS["logDBPath"]                   = "../db/log_db.txt";
  $GLOBALS["savedRapportblattDBPath"]     = "../db/saved_rapportblatt.json";
  $GLOBALS["settings"]                    = "../db/settings.json";

  function getSettings() {
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

  function deleteUserData($ziviDataHeader, $deleteRb) {

    $response = new StdClass();
    $response->success = false;
    $logs = [];

    $ziviDBObject = getZiviDB();

    $userData = getUserData($ziviDataHeader);
    $rapportBlattData = getSavedRapportblatt($ziviDataHeader, "all");
    $response = $userData;
    if($userData->success == true){

      //delete the element form the object
      unset($ziviDBObject->{$ziviDataHeader});

      // encode array to json and save to file
      file_put_contents($GLOBALS["ziviDBPath"], json_encode($ziviDBObject));

      $response->message = "User data successsfully deleted";
      if( $deleteRb == true) {
        $deleteRbs = deleteRbs($ziviDataHeader);
        $response = $deleteRbs;
        if( $deleteRbs->success == true ) {
            $response->message = "User data and rapports successsfully deleted.";
        }
      }else{
        $response->message = "User data successsfully deleted. But rapports remain!!";
      }
    }else{
      $response = $userData;
    }
    write_log($logs);
    return $response;
  }

  function deleteRbs($ziviDataHeader, $month="") {
    
    $response = new StdClass();
    $response->success = false;
    $logs = [];

    $rapportBlattDataObject = getSavedRapportblattDB();

    if(property_exists($rapportBlattDataObject, $ziviDataHeader )) {
      if( $month == "") {
        unset($rapportBlattDataObject->{$ziviDataHeader});

        // encode array to json and save to file
        file_put_contents($GLOBALS["savedRapportblattDBPath"], json_encode($rapportBlattDataObject));
        array_push($logs, "Deleted rapports of user with Pointer -> ".$ziviDataHeader);

        $response->message = "Rapports successsfully deleted.";
        $response->success = true;
      } else{
        if( array_key_exists($month, $rapportBlattDataObject->{$ziviDataHeader}) ){

          $savedRbs = $rapportBlattDataObject->{$ziviDataHeader};
          unset($savedRbs[$month]);
          $rapportBlattDataObject->{$ziviDataHeader} = $savedRbs;
          
          if( count((array)$rapportBlattDataObject->{$ziviDataHeader}) > 0) {
            file_put_contents($GLOBALS["savedRapportblattDBPath"], json_encode($rapportBlattDataObject));

            $response->success = true;
            $response->message = "Rapportblatt for month: ".$month." successfully deleted.";
            array_push($logs, "Deleted rapport for month: ".$month." of user with Pointer -> ".$ziviDataHeader);
          } else {
            // Delete the whole entry if there is anyways no Data saved 
            $response = deleteRbs($ziviDataHeader, "");
          }
        } else {
          $response->message = "There is no rapport with this month saved!";
        }
      }
    }else {
      $response->success = true;
    }
    write_log($logs);
    return $response;
  }
  function saveUser($registerData) {

    // The DB needs to be cleaned every now and then, so the data won't overwhelm the Server
    cleanDB();

    $userData = new stdClass();
    $response = new StdClass();
    $response->success = false;
    //Getting the DB as an object
    $ziviDBObject = getZiviDB();

    //Check whether the data header already exists
    if(property_exists($ziviDBObject, $registerData->ziviDataHeader)) {
      $response->message = "User already exists!";
    } else {
      //User doesn't exist -> Save User
      $response->success = true;
    }

    //If everything is allright save the new user intop the json DB
    if($response->success == true) {

      //Getting the Dataheader to use as key for the json object
      $dataHeader = (string)$registerData->ziviDataHeader;

      $userData->lastModified = time();
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

  function saveRapportblatt($ziviDataHeader, $rbData, $month) {

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
  function getSavedRapportblattDB() {
    //Get the data base as a string
    $savedRapportblattString = file_get_contents($GLOBALS["savedRapportblattDBPath"]);
    if($savedRapportblattString == "" || $savedRapportblattString == "null"){
      $savedRapportblattString = "{}";
    }
    //convert JSON string to object
    $savedRapportblattObj =  (object) json_decode($savedRapportblattString, true);

    return $savedRapportblattObj;
  }

  function cleanDB() {

    $response = new StdClass();
    $response->success = false;
    $logs = [];
    
    //setting the expiration date to 40 Weeks
    $expirationTimeZiviDB = getSettings()->expirationTimeZiviDB;
    $expirationTimeRbDB = getSettings()->expirationTimeRbDB;
    $secondsUntilExpiration = $expirationTimeZiviDB * 7 * 24 * 60 * 60;

    //Getting the DB as an object
    $ziviDBObject = getZiviDB();
    $rapportBlattDataObject = getSavedRapportblattDB();
    $now = time();

    // Loop through zivi Data and look for expired accounts
    foreach ($ziviDBObject as $pointer => $ziviData) {
      $expiredSince = $now - ( $ziviData["lastModified"] + $secondsUntilExpiration);
      // if $expiredSince is negative, this means it is not yet expired
      if($expiredSince >= 0) {
        // Delete user data and all the saved rbs
        $deleteUserData = deleteUserData($pointer, true);
        if( $deleteUserData->success ) {
          array_push($logs, "Deleted data & Rapports of user with Pointer -> ".$pointer."| Expired ".$expiredSince/ 60/ 60/ 24 ." days ago.");
        } else {
          array_push($logs, "Couldn't delete User with Pointer -> ".$pointer."| Expired ".$expiredSince/ 60/ 60/ 24 ." days ago. | Error: ".$deleteUserData.message);
        }
      }
    }
    // Loop through rb_database and look for expired rbs
    foreach ( $rapportBlattDataObject as $pointer => $rbs ) {

      foreach( $rbs as $month => $rbData ){
        $currentMonth = date("m", $now);
        $currentYear = date("Y", $now);
        $rbMonth = strtotime($month);
        $thisMonth = strtotime($currentYear."-".$currentMonth);
        $expirationDateRb = $thisMonth - ($expirationTimeRbDB * 7 * 24 * 60 * 60);
        $tooFarInFutureDate = $thisMonth + ($expirationTimeRbDB / 2 * 7 * 24 * 60 * 60);
        
        $expiredSince = $expirationDateRb - $rbMonth;
        $expiredIn = $rbMonth - $tooFarInFutureDate;

        if( $expiredSince > 0) {
          deleteRbs($pointer, $month);
        }
      }
    }
    $ziviDBSize = filesize($GLOBALS["ziviDBPath"])/1000/1000;
    $rbDBSize = filesize($GLOBALS["savedRapportblattDBPath"])/1000/1000;
    array_push($logs, "Database Cleaned! -> File size of zivi_db.json: ". $ziviDBSize ."mb | File size of saved_rapportblatt.json: ".$rbDBSize."mb" );
    write_log($logs);

    return $response;
  }
  function write_log($messages) {
    $response = new StdClass();
    $response->success = false;

    // Cant set the default time zone
    date_default_timezone_set("Europe/Zurich");
    
    $dateS = gmdate("Y-m-d H:i:s", time());

    foreach($messages as $m)
    { 
      $line = $dateS.": ".$m."\n";
      file_put_contents($GLOBALS["logDBPath"], $line, FILE_APPEND | LOCK_EX);
    }
    
    $response->success = true;
    return $response;
  }