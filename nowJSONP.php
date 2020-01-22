<?php
header("Content-Type: application/json");
$res = file_get_contents("./now.json");
echo $_GET['callback'] . "(" . json_encode($res) . ")";