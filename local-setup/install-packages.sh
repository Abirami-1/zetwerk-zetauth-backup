# Check if Homebrew is installed
if ! command -v brew &>/dev/null; then
    echo "Homebrew is not installed. Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

# Check if Nginx is installed using Homebrew
if ! [ -x "$(command -v nginx)" ]; then
    echo "Nginx is not installed. Installing Nginx via Homebrew..."
    brew install nginx
    brew services start nginx
fi

# Check if pm2 is already installed
if ! [ -x "$(command -v pm2)" ]; then
  echo "pm2 is not installed. Installing pm2..."
  npm install -g pm2
  if [ -x "$(command -v pm2)" ]; then
    echo "pm2 has been successfully installed."
  else
    echo "Error: Failed to install pm2."
  fi
else
  echo "pm2 is already installed."
fi

npm i @zetwerk/zet-service-registry