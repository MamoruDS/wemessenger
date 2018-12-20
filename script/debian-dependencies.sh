#!/bin/sh

# Debian Dependencies https://github.com/GoogleChrome/puppeteer/blob/master/docs/troubleshooting.md
apt install -y $(cat debian-chrome-dependencies.txt)

curl -s https://raw.githubusercontent.com/Intervox/node-webp/latest/bin/install_webp | sudo bash
apt install -y graphicsmagick imagemagick mpg123 libopus0 opus-tools