# mxmlc command line syntax
#http://help.adobe.com/en_US/flex/using/WS2db454920e96a9e51e63e3d11c0bf69084-7ab6.html
# mxmlc command line options
#http://help.adobe.com/en_US/flex/using/WS2db454920e96a9e51e63e3d11c0bf69084-7a92.html

FLEX="~/uofs-server/build/flexSDK"

$FLEX/bin/mxmlc --library-path $FLEX/frameworks/libs/ --output ~/uofs-server/build/bin-release -- ~/uofs-server/build/sampleFlexApp/app.mxml
