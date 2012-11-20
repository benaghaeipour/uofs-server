setTimeout(function() {
    process.exit(0);
}, 3000);

process.nextTick(function(){
    console.log('callback1');
});

process.nextTick(function(){
    console.log('callback2');
});