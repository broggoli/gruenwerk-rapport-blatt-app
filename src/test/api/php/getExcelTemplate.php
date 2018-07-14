<?php
$attachment_location = $_SERVER["DOCUMENT_ROOT"] . "/api/template/template_excel.xlsx";

if (file_exists($attachment_location)) {
  header('Content-Description: File Transfer');
  header('Content-Type: application/octet-stream');
  header('Content-Disposition: attachment; filename="'.basename($attachment_location).'"');
  header('Expires: 0');
  header('Cache-Control: must-revalidate');
  header('Pragma: public');
  header('Content-Length: ' . filesize($attachment_location));
  readfile($attachment_location);
  exit;
} else {
    die("Error: File not found.");
}
  // if (file_exists($attachment_location)) {
  //
  //     header($_SERVER["SERVER_PROTOCOL"] . " 200 OK");
  //     // header("Cache-Control: public"); // needed for internet explorer
  //     // header("Content-Type: application/zip");
  //     // header("Content-Transfer-Encoding: Binary");
  //     // header("Content-Length:".filesize($attachment_location));
  //     // header("Content-Disposition: attachment; filename=template_excel.xlsx");
  //     $file = readfile($attachment_location);
  //     die();
  //
  //     echo "{
  //             'success': 'true',
  //             'file'   : ".json_encode($file)."
  //           }";
  // } else {
  //     die("Error: File not found.");
  // }
?>
