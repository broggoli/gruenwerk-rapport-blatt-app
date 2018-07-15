<?php

  require_once('db.php');

  session_start();
  $response = new StdClass();
  $response->success = false;
  $request_body = json_decode(file_get_contents('php://input'));
  if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode($_SESSION);
    $savedRapportblatt = getSavedRapportblatt($_SESSION["user"]["ziviDataHeader"]);
    $response = $savedRapportblatt;
    $response->message = "Successfully retrieved the rapportblatt!";
  }else {
    if(isset($request_body) && !empty($request_body)) {
        if(isset($request_body) && !empty($request_body)) {
        if(isset($_SESSION['user']) && !empty($_SESSION['user'])) {
          $ziviDataHeader =  $_SESSION['user']["ziviDataHeader"];

          $saveRapportblatt = saveRapportblatt($ziviDataHeader, $request_body);

          //Check whether the data header exists
          $response = $saveRapportblatt;

        } else {
          $response->message = "Not logged in!";
        }
      } else {
        $response->message = "No data recieved!";
      }

    }
  }
  echo json_encode($response);
?>
