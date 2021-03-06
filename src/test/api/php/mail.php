<?php
    use PHPMailer\PHPMailer\PHPMailer;
    use PHPMailer\PHPMailer\Exception;

    require 'PHPMailer-6.0.5/src/Exception.php';
    require 'PHPMailer-6.0.5/src/PHPMailer.php';
    require 'PHPMailer-6.0.5/src/SMTP.php';

    function generateMailText($ziviName, $aboInfo){
        $mailText = "<p style='font-size:1.5em'>Dies ist eine automatisch generierte E-Mail.</p><br/>
                    <p>Im Anhang finden sie eine zip-Datei mit dem Rapportblatt und evt Billetbelegen von: <br/>
                    Zivi: ".$ziviName."</p><br/>
                    Abo: ".$aboInfo."<br/>

                    <p>Freundliche Gr&uuml;sse</p>
                    <p>Ihr Webserver</p>";
        return $mailText;
    }

    function sendMail($mailInfo) {
        $response = new stdClass();
        
        try {
            $ziviName = $mailInfo["firstName"]." ".$mailInfo["lastName"];
            $aboInfo = $mailInfo["aboInfo"];
            $mail = new PHPMailer(true);
            $mail->isSMTP();
            //$mail->SMTPDebug = 3;
            $mail->SMTPOptions = array(
                'ssl' => array(
                    'verify_peer' => false,
                    'verify_peer_name' => false,
                    'allow_self_signed' => true
                )
            );

            $mail->SetFrom("verein@verein-gruenwerk.ch", "Server");
            // Adding Recipients
            
            $i = 0;
            foreach($mailInfo["recipients"] as $recipient) {
                if($i > 0) {
                    $mail->AddCC($recipient->mail, $recipient->name);
                }else if( $i === 0){
                    // Main Address is set as Adress. The others as CC
                    $mail->AddAddress($recipient->mail, $recipient->name);
                }
                $i++;
            }
            //echo json_encode( $mail->getAllRecipientAddresses() );
            $mail->AddAttachment( $mailInfo["attachmentFilePath"]);

            //Content
            $mail->Subject = 'Rapportblatt von '.$ziviName;
            $mail->Body    = generateMailText($ziviName, $aboInfo);
            $mail->IsHTML(true);

            $mail->send(true);
            $response->message = 'Message has been sent';
            $response->success = true;
        } catch (Exception $e) {
            $response->message = 'Message could not be sent. Mailer Error: '.$mail->ErrorInfo;;
            $response->success = false;
        }

        return $response;
    }


?>
