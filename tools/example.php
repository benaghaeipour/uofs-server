<?php

include 'center_class.php';
include 'user_class.php';

$chelmsford = new center();
$chelmsford->name = 'example_php';
$chelmsford->purchaser = 'big_knobs@blah.com';
$chelmsford->save();


$me = new user();
$me->center = $chelmsford->name;
$me->username = 'chris';
$me->email = 'chris@matheson.it';
$me->accountType = 1;
$me->voiceDialect = 2;
$me->save();
?>