<?php
require_once('mail.php');
start();

function start(){
    $crDir = createDir("../uploads/");
    $response = new stdClass();
    $response->success = false;
    if($crDir->success){
        $prepareUploadExcel = prepareForUpload("excelFile", $crDir->path);
        $prepareUploadTicketProof = prepareForUpload("ticketProofFiles", $crDir->path);

        if( $prepareUploadExcel->success || $prepareUploadTicketProof->success){
            $reciever = json_decode($_POST["receiver"]);
            $ziviName = filter_var($_POST["ziviName"], FILTER_SANITIZE_STRING);
            $aboInfo = filter_var($_POST["aboInfo"], FILTER_SANITIZE_STRING);
            $month = filter_var($_POST["month"], FILTER_SANITIZE_STRING);

            $zipFileName = "RB_".str_replace(" ", "_",$ziviName)."_".$month;

            //creating the path to the new zip file one folder up
            $k = explode("/", $crDir->path);
            array_pop($k);
            $pathToZip = join('/', $k)."/".$zipFileName;
            zipFile($crDir->path, $pathToZip);


            $mailInfo = array(  "receiver" => $reciever,
                                "ziviName" => $ziviName,
                                "attachmentFilePath" => $pathToZip.".zip",
                                "aboInfo" => $aboInfo);
            $sendMail = sendMail($mailInfo);
            if($sendMail->success == true){
                $response = $sendMail;
                //delete zip file
                unlink($pathToZip.".zip");
            }else{

                $exceptionString = 'Unable to send new.';
                $response->message = $exceptionString;
                throw new RuntimeException($exceptionString);
            }
        }else{
            if(!$prepareUploadExcel->success){
                $response = $prepareUploadExcel;
            }else{
                $response = $prepareUploadTicketProof;
            }
        }

    }else{
        $exceptionString = 'Unable to create a new folder.';
        $response->message = $exceptionString;
        throw new RuntimeException($exceptionString);
    }
    echo json_encode($response);
}

function zipFile($dirPath, $pathToZip) {
    // Get real path for our folder
    $rootPath = realpath($dirPath);

    // Initialize archive object
    $zip = new ZipArchive();
    $zip->open($pathToZip.'.zip', ZipArchive::CREATE | ZipArchive::OVERWRITE);

    // Initialize empty "delete list"
    $filesToDelete = array();

    // Create recursive directory iterator
    /** @var SplFileInfo[] $files */
    $files = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($rootPath),
        RecursiveIteratorIterator::LEAVES_ONLY
    );

    foreach ($files as $name => $file)
    {
        // Skip directories (they would be added automatically)
        if (!$file->isDir())
        {
            // Get real and relative path for current file
            $filePath = $file->getRealPath();
            $relativePath = substr($filePath, strlen($rootPath) + 1);

            // Add current file to archive
            $zip->addFile($filePath, $relativePath);
            // Add current file to "delete list"
            // delete it later cause ZipArchive create archive only after calling close function and ZipArchive lock files until archive created)
            $filesToDelete[] = $filePath;
        }
    }

    // Zip archive will be created only after closing object
    $zip->close();

    // Delete all files from "delete list"
    foreach ($filesToDelete as $file)
    {
        unlink($file);
    }
    //finally delete the diectory
    rmdir($dirPath);
}

function createDir($uploadsFilePath) {
    $uploaDirPath = $uploadsFilePath.uniqid();
    $response = new stdClass();
    if(mkdir($uploaDirPath)){
        $response->success = true;
        $response->path = $uploaDirPath;
    }else{
        $response->success = false;
    }
    return $response;
}
function prepareForUpload($submitName, $uploaDirPath){
    $response = new stdClass();
    // Ugly hack.. but works
    if(array_key_exists($submitName, $_FILES)){

        if($submitName == "excelFile"){

            $files = $_FILES[$submitName];
            if( !empty( $files ) ){

                foreach ($files["name"] as $position => $file_name) {
                    $file_tmp = $files["tmp_name"][$position];
                    $file_size = $files["size"][$position];
                    $file_error = $files["error"][$position];
                    $unparsedSaveFileName = $files["name"][$position];

                    //parse the file name
                    if (preg_match('/[A-Za-z0-9_-]/', $unparsedSaveFileName)) {
                        $saveFileName = $unparsedSaveFileName;
                    }else{
                        throw new RuntimeException('File name not valid.');
                    }

                    //upload the file to the server
                    $uploadFile = uploadFile($file_tmp, $file_size, $file_error, $saveFileName, $uploaDirPath);
                    if( $uploadFile == true){
                        $response->success = true;
                    }else{
                        $response->message = "Failed to upload the files!";
                        $response->success = false;
                    }
                }

            }else{
                $response->message = "No ".$submitName." submitted!";
                $response->success = false;
            }
        }else{
            $files = $_FILES[$submitName];

            if(!empty( $files["name"][0]) ){

                foreach ($files["name"] as $position => $file_name) {
                    $file_tmp = $files["tmp_name"][$position];
                    $file_size = $files["size"][$position];
                    $file_error = $files["error"][$position];
                    $unparsedSaveFileName = $files["name"][$position];

                    //parse the file name
                    if (preg_match('/[A-Za-z0-9_-]/', $unparsedSaveFileName)) {
                        $saveFileName = $unparsedSaveFileName;
                    }else{
                        throw new RuntimeException('File name not valid.');
                    }

                    //upload the file to the server
                    $uploadFileSuccess = uploadFile($file_tmp, $file_size, $file_error, $saveFileName, $uploaDirPath);
                    if( !$uploadFileSuccess ){
                        $response->success = true;
                    }else{
                        $response->message = "Upload of images failed!";
                        $response->success = false;
                    }
                }
            }else{
                $response->message = "No ".$submitName." proofs uploaded!";
                $response->success = false;
            }
        }
    }else{
        $response->message = "No files uploaded!";
        $response->success = false;
    }
    return $response;
}
function uploadFile($file_tmp,
                    $file_size,
                    $file_error,
                    $saveFileName,
                    $uploaDirPath) {
    //Undefined | Multiple Files | $_FILES Corruption Attack
    // If this request falls under any of them, treat it invalid.
    if (
        !isset($file_error) ||
        is_array($file_error)
    ) {
        throw new RuntimeException('Invalid parameters.');

    }
    switch ($file_error) {
            case UPLOAD_ERR_OK:
                break;
            case UPLOAD_ERR_NO_FILE:
                throw new RuntimeException('No file sent.');
                return false;
            case UPLOAD_ERR_FORM_SIZE:
                throw new RuntimeException('Exceeded filesize limit.');
                return false;
            default:
                throw new RuntimeException('Unknown errors.');
                return false;
        }

    // You should also check filesize here.
    if ($file_size > 10000000) {
        throw new RuntimeException('Exceeded filesize limit.');
        return false;
    }

    //DO NOT TRUST $_FILES['upfile']['mime'] VALUE !!
    // Check MIME Type by yourself.
    $finfo = new finfo(FILEINFO_MIME_TYPE);

    if (false === $fileExtention = array_search(
        $finfo->file($file_tmp),
        array(
            'jpg' => 'image/jpeg',
            'png' => 'image/png',
            'xlsx' => 'application/zip'
        ), false
    ))
    {
        throw new RuntimeException('Invalid file format.');
        return false;
    }

    // You should name it uniquely.
    // DO NOT USE $_FILES['upfile']['name'] WITHOUT ANY VALIDATION !!
    // On this example, obtain safe unique name from its binary data.
    $savefilePath = sprintf('%s/%s.%s', $uploaDirPath, $saveFileName, $fileExtention);
    if (!move_uploaded_file( $file_tmp, $savefilePath )) {
        //not successfull -> throw exception
        throw new RuntimeException('Failed to move uploaded file. -> '.$saveFileName);
        return false;
    }
    return true;
}
 ?>
