<?php
  $ziviDBPath = "../db/zivi_db.json";
  $logDB = "../db/log_db.json";

  $request_body = json_decode(file_get_contents('php://input'));
  session_start();
  $response = new StdClass();
  $response->success = false;

  if(isset($request_body) && !empty($request_body)) {

    $ziviDataHeader =  filter_var($request_body->ziviDataHeader, FILTER_SANITIZE_STRING);

    $ziviDBStr = file_get_contents($ziviDBPath);
    $ziviDBObject =  (object) json_decode($ziviDBStr, true);

    //Check whether the data header exists
    if(property_exists($ziviDBObject, $ziviDataHeader)){
      $response->message = "Data header exists!";
      //returning the encryptedZiviData
      $response->data = $ziviDBObject->{$ziviDataHeader};
      $response->success = true;
      $_SESSION['user'] = $ziviDataHeader;
    }else{
      $response->message = "No users with this credentials found!";
    }
  } else {
    $response->message = "No Data recieved!";
  }

  echo json_encode($response);
?>
