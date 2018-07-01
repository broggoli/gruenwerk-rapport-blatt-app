<?php
    use PHPMailer\PHPMailer\PHPMailer;
    use PHPMailer\PHPMailer\Exception;

    require 'lib/phpmailer/src/Exception.php';
    require 'lib/phpmailer/src/PHPMailer.php';
    require 'lib/phpmailer/src/SMTP.php';

    function generateMailText($ziviName, $aboInfo){
        $mailText = "<p style='font-size:1.5em'>Dies ist eine automatisch generierte E-Mail.</p><br/>
                    <p>Im Anhang finden sie eine zip-Datei mit dem Rapportblatt und evt Billetbelegen von: <br/>
                    Zivi: ".$ziviName."</p><br/>
                    Abo: ".$aboInfo."<br/>

                    <p>Freundliche Grüsse</p>
                    <p>Ihr Webserver</p>";
        return $mailText;
    }

    function sendMail($mailInfo) {
        try {
            $ziviName = $mailInfo["ziviName"];
            $aboInfo = $mailInfo["aboInfo"];
            $mail = new PHPMailer();

            //Recipients
            $mail->setFrom('nick@broggoli.ch', 'Nick');
            $mail->addAddress($mailInfo["receiver"]->mail, $mailInfo["receiver"]->name);     // Add a recipient

            $mail->AddAttachment( $mailInfo["attachmentFilePath"]);

            //Content
            $mail->Subject = 'Rapportblatt von '.$ziviName;
            $mail->Body    = generateMailText($ziviName, $aboInfo);
            $mail->IsHTML(true);

            $mail->send(true);
            echo 'Message has been sent';
            return true;
        } catch (Exception $e) {
            echo 'Message could not be sent. Mailer Error: ', $mail->ErrorInfo;
            return false;
        }
    }


?>
