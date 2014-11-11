<?php
class user
{
    public $accountType = null;
    public $center = null;
    public $firstName = 'undefined';
    public $ownPassWord = 'undefined';
    public $passwordHint = 'undefined';
    public $pw1 = 'undefined';
    public $studentEmail = 'undefined';
    public $surname = 'undefined';
    public $username = 'undefined';
    public $voiceDialect = 'undefined';

    function save()
    {
        $payload = '\''.json_encode($this).'\'';
        $cmd = 'curl ';
        $cmd = $cmd.'--header "Content-Type: application/json" ';
        $cmd = $cmd.'--request POST ';
        $cmd = $cmd.'--data '.$payload;
        $cmd = $cmd.' uos-dev.herokuapp.com/student/update/';
        echo "executing: ".$cmd;
        $r = shell_exec($cmd);
        echo $r;
    }
}
?>