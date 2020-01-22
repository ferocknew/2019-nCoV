<?php
header("Content-Type: application/json");
header("access-control-allow-origin: *");
$res = file_get_contents("./now.json");
echo $_GET['callback'] . "(" . json_encode($res) . ")";