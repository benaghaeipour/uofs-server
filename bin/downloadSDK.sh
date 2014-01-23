set -x
set -e
if [ ! -e tmp/flex_sdk_4.6.zip ]; then
    wget http://download.macromedia.com/pub/flex/sdk/flex_sdk_4.6.zip
    unzip -a -q ./tmp/flex_sdk_4.6.zip -d tmp/flex_sdk
    echo 'flex SDK installed to tmp/flex_sdk_4.6'
fi
