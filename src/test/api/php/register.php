<?php
  require_once('db.php');

  session_start();
  $request_body = json_decode(file_get_contents('php://input'));
  // TODO: sanitize
  if(isset($request_body) && !empty($request_body)) {
    $registerData = (object) $request_body->dbData;

    $saveUser = saveUser($registerData);
    echo json_encode($saveUser);
  }
?>
