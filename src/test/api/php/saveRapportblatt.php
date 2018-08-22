<?php

  require_once('db.php');

  session_start();
  $response = new StdClass();
  $response->success = false;
  $request_body = json_decode(file_get_contents('php://input'));
  // if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  //   $savedRapportblatt = getSavedRapportblatt($_SESSION["user"]["ziviDataHeader"]);
  //   $response = $savedRapportblatt;
  //   $response->message = "Successfully retrieved the rapportblatt!";
  // }else {
  if(isset($request_body) && !empty($request_body)) {
    if(property_exists($request_body, "task")) {
      if(isset($_SESSION['user']) && !empty($_SESSION['user'])) {
        if($request_body->task == "getRb"){

          $savedRapportblatt = getSavedRapportblatt($_SESSION["user"]["ziviDataHeader"], $request_body->month);
          $response = $savedRapportblatt;
        }elseif($request_body->task == "setRb") {

          $ziviDataHeader =  $_SESSION['user']["ziviDataHeader"];
          $saveRapportblatt = saveRapportblatt($ziviDataHeader, 
                                                $request_body->rbData, 
                                                $request_body->month);

          $response = $saveRapportblatt;

        }
      } else {
        $response->message = "Not logged in!";
      }
    } else {
      $response->message = "No task recieved!";
    }
  } else {
    $response->message = "No data recieved!";
  }

echo json_encode($response);
?>
