<?php
  require_once('db.php');

  session_start();
  $request_body = json_decode(file_get_contents('php://input'));
  // TODO: sanitize
  if(isset($request_body) && !empty($request_body)) {
    $registerData = (object) $request_body->dbData;

    $saveNewUser = saveNewUser($registerData);
    echo json_encode($saveNewUser);
  }
?>
