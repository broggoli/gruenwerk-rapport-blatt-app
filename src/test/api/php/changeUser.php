<?php

  require_once('db.php');

  session_start();
  $response = new StdClass();
  $response->success = false;

  $request_body = json_decode( file_get_contents('php://input'));
  // if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  //   $savedRapportblatt = getSavedRapportblatt($_SESSION["user"]["ziviDataHeader"]);
  //   $response = $savedRapportblatt;
  //   $response->message = "Successfully retrieved the rapportblatt!";
  // }else {
  if(isset($request_body) && !empty($request_body)) {
    if(property_exists($request_body, "task")) {
      if(isset($_SESSION['user']) && !empty($_SESSION['user'])) {
        switch ($request_body->task) {
          case "changeServiceTime":
              $data = json_decode($request_body->dbData)->dbData;

              $replaceUserData = replaceUserData($data);

              $response = $replaceUserData;
              break;

          case "deleteUser":
              $dataHeader = $request_body->dataHeader;

              $deleteUser = deleteUserData($dataHeader, true);

              $response = $deleteUser;
              break;
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
