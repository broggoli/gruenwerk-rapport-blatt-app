<?php

  require_once('db.php');

  $request_body = json_decode(file_get_contents('php://input'));
  session_start();
  $response = new StdClass();
  $response->success = false;

  if(isset($request_body) && !empty($request_body)) {

    $ziviDataHeader =  filter_var($request_body->ziviDataHeader, FILTER_SANITIZE_STRING);

    $userData = getUserData($ziviDataHeader);

    //Check whether the data header exists
    if( $userData->success ){
      $userData->data["ziviDataHeader"] = $ziviDataHeader;
      $_SESSION['user'] = $userData->data;
      $response = $userData;
    }

    $response->message = $userData->message;
  } else {
    $response->message = "No Data recieved!";
  }

  echo json_encode($response);
?>
