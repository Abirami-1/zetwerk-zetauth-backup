#!/bin/bash

helpFunction()
{
   echo ""
   echo "Usage: $0 -m <pass the api mode>"
   echo -e "\t-m pass one of the modes: auth or user"
   exit 1 # Exit script after printing help
}

while getopts "m:" opt
do
   case "$opt" in
      m ) API_MODE="$OPTARG" ;;
      ? ) helpFunction ;; # Print helpFunction in case parameter is non-existent 
    esac
done

# Print helpFunction in case parameters are empty
if [ -z "$API_MODE" ]
then
   echo "Mode parameter is mandatory";
   helpFunction
fi

#Main Script Begins

echo "STARTING API IN MODE = ${API_MODE}"
git checkout package-lock.json
git pull
npm install
#!/bin/bash
echo "Starting syncing"
# rm -r config --> Commented out by Venkat
groupName='ZetAuth'
pwd=`pwd`
echo $pwd
file_path=$pwd
#get project name from string
project_name=${pwd##*/}
echo $project_name
# file_path=$HOME/$project_name/config/
echo $file_path
S3_BUCKET_NAME=zetcfg-$NODE_ENV/$groupName/$project_name-${API_MODE}/
echo $S3_BUCKET_NAME
#!/bin download path from s3 and copy to config folder for source code
aws s3 sync s3://$S3_BUCKET_NAME .
echo "File Syncing Done"
pm2 reload ecosystem.config.js --only zetauth-$API_MODE  --env $NODE_ENV 
#tail -10 /var/log/pm2/zetauth-$API_MODE*.log
