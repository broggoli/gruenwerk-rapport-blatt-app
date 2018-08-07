<?php

  require_once('db.php');

  session_start();
  $response = new StdClass();
  $response->success = false;

  $request_body = json_decode(
                      file_get_contents('php://input')
                  );
  if(isset($request_body) && !empty($request_body)) {
    if(property_exists($request_body, "task")) {
      switch ($request_body->task) {
        case "login":
          $ziviDataHeader =  filter_var($request_body->data->ziviDataHeader, FILTER_SANITIZE_STRING);
          $userData = getUserData($ziviDataHeader);
        
          //Check whether the data header exists
          if( $userData->success ){
            $userData->data["ziviDataHeader"] = $ziviDataHeader;
            $_SESSION['user'] = $userData->data;
            $response = $userData;
          }else{
            $response->message = $userData->message;
          }
          break;
        case "isLoggedIn":
          if( isset($_SESSION['user']) && !empty($_SESSION['user']) ) {
            $response->success = true;
            $response->message = "User logged in!";
            $response->data = true;
          }else{
            $response->success = true;
            $response->message = "User not logged in!";
            $response->data = false;
          }
          break;
        }
    }else{
      $response->message = "No task recieved!";
    }
  } else {
    $response->message = "No Data recieved!";
  }

  echo json_encode($response);
?>
