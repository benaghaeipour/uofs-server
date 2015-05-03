<?php
class user
{
    public $center = null;
    public $username = null;

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