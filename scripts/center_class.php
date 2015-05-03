<?php
class center
{
    public $name = 'undefined';
    public $purchaser = 'undefined';
    public $centerType = 'undefined';
    public $maxLicencedStudentsForThisCenter = 'undefined';
    public $expiryDate = 'undefined';
    public $invoiceNumber = 'undefined';
    public $invoiceValue = 'undefined';
    public $defaultVoice = 'undefined';

    function save()
    {
        $payload = '\''.json_encode($this).'\'';
        $cmd = 'curl ';
        $cmd = $cmd.'--header "Content-Type: application/json" ';
        $cmd = $cmd.'--request PUT ';
        $cmd = $cmd.'--data '.$payload;
        $cmd = $cmd.' uos-dev.herokuapp.com/center/';
        echo "executing: ".$cmd;
        $r = shell_exec($cmd);
        echo $r;
    }
}
?>