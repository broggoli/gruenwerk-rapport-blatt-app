<?php
  $GLOBALS["ziviDBPath"]  = "../db/zivi_db.json";
  $GLOBALS["logDB"]       = "../db/log_db.json";

  /* returns the Data saved in the jsn data base with the $ziviDataHeader as key*/
  function getUserData($ziviDataHeader) {

    $response = new StdClass();
    $response->success = false;
    //Getting the DB as an object
    $ziviDBObject = getDB();

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

    $ziviDBObject = getDB();

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

  function saveNewUser($registerData){

    $userData = new stdClass();
    $response = new StdClass();
    $response->success = false;
    //Getting the DB as an object
    $ziviDBObject = getDB();

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
      $userData->expirationDate = time() + (52 * 7 * 24 * 60 * 60);
      $userData->encryptedZiviData = $registerData->encryptedZiviData;

      $ziviDBObject->{$dataHeader} = $userData;

      // encode array to json and save to file
      file_put_contents($GLOBALS["ziviDBPath"], json_encode($ziviDBObject));

      $response->message = "Successfully registerd!";
    }
    return $response;
  }

  function replaceUserData(){

  }

  function getDB(){
    //Get the data base as a string
    $ziviDBStr = file_get_contents($GLOBALS["ziviDBPath"]);
    if($ziviDBStr == "" || $ziviDBStr == "null"){
      $ziviDBStr = "{}";
    }
    //convert JSON string to object
    $ziviDBObject =  (object) json_decode($ziviDBStr, true);

    return $ziviDBObject;
  }
