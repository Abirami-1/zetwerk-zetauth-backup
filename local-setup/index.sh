bash ./install-packages.sh
sudo bash ./add-host.sh
sudo node ./nginx-setup.js
brew services reload nginx
bash zetauth-setup.sh