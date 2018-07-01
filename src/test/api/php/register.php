<?php

  session_start();
  $request_body = json_decode(file_get_contents('php://input'));

  if(isset($request_body) && !empty($request_body)) {
    $registerData = (object) $request_body->dbData;

    $ziviDBPath = "../db/zivi_db.json";
    $logDB = "../db/log_db.json";

    $ziviDBStr = file_get_contents($ziviDBPath);
    if($ziviDBStr == "" || $ziviDBStr == "null"){
      $ziviDBStr = "{}";
    }
    //Getting the DB as an object
    $ziviDBObject = (object) json_decode($ziviDBStr, true);

    $response = new StdClass();
    $response->success = false;

    //Check whether the data header already exists
    if(property_exists($ziviDBObject, $registerData->ziviDataHeader)){
      $response->message = "username already exists!";
    }else{
      //User doesn't exist -> Save User
      $response->success = true;
    }

    //If everything is allright save the new user intop the json DB
    if($response->success == true){

      $dataHeader = (string)$registerData->ziviDataHeader;
      $ziviDBObject->{$dataHeader} = $registerData->encryptedZiviData;

      $zivisFile = fopen($ziviDBPath, "w") or die("Unable to open file!");
      fwrite($zivisFile, json_encode($ziviDBObject));
      fclose($zivisFile);

      $response->message = "Successfully registerd!";
    }
    echo json_encode($response);
  }
?>
