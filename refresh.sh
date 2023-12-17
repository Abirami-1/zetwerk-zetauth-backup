git checkout .
git pull
#!/bin/bash
echo "Starting syncing"
rm -r config
groupName='ZetAuth'
pwd=`pwd`
echo $pwd
file_path=$pwd
#get project name from string
project_name=${pwd##*/}
echo $project_name
# file_path=$HOME/$project_name/config/
echo $file_path
S3_BUCKET_NAME=zetcfg-$NODE_ENV/$groupName/$project_name/
echo $S3_BUCKET_NAME
#!/bin download path from s3 and copy to config folder for source code
aws s3 sync s3://$S3_BUCKET_NAME .

npm install
sudo supervisorctl restart zetauth
sudo supervisorctl tail -f zetauth