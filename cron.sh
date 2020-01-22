#!/bin/bash
cd /www/wwwroot/2019-nCoV.alhk.iw8.win;
node ./node_cron.js;
git commit -am"update files";
git push origin master;