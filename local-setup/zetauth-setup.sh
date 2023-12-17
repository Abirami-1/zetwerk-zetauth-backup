# Function to change the architecture, launch a new shell session, and set Node.js version
change_arch_and_launch() {
  nvm use 18
}
# change_arch_and_launch
# installing all the package of zetauth and then starting a pm2 process
$env /usr/bin/arch -x86_64 /bin/zsh --login -c '
cd ../
npm i
sudo pm2 start ./ecosystem.config.js --only zetauth-auth-local  --env localDevelopment
'
echo "Please follow these step to generate local-auth-token
1. Now go postman in zetauth-auth collection
2. Open authenticate-for-local API, enter your emailId in body and then hit the APi -> this will set authorizariontoken in environment as localAuthToken variable
3. Now for hitting any api you can use http://api.local.zetwerk.com as server name instead of localhost
4. For every api set authorizationtoken in header as {{localAuthToken}}"