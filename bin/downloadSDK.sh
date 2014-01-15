set -x
set -e
#if [ ! -e redis-2.4.18/src/redis-server ]; then
    wget http://download.macromedia.com/pub/flex/sdk/flex_sdk_4.6.zip
    mkdir -p ../build/flexSDK
    unzip -a flex_sdk_4.6.zip -q -d ../build/flexSDK
    echo 'contents of SDK dir'
    find ../build/flexSDK/
#fi
