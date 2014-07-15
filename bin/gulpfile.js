/*jslint node:true*/
var gulp = require('gulp');

var through = require('through2');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;

function processBlock(block) {
    if (!block.uos) {
        console.error('ERR:: ', block.uos);
        return block;
    }
    var regEx = block.uos.match(/\w+/);
    regEx = new RegExp(regEx);
    console.log('=> RexExp: ', regEx, ' for: ', block.uos);

    block.words = block.words.map(function (word) {
        word.pattern = word.text.replace(regEx, '[$&]');
        console.log('=> Pattern: ', word.pattern, ' for: ', word.text);
        return word;
    });

    return block;
}

function paternize() {
    var stream = through.obj(function(file, enc, callback) {
        if (!file.isBuffer()) {
            return callback();
        }

        console.log('<= starting ', file.relative);

        var modelObject = JSON.parse(file.contents.toString());
        modelObject.blocks = modelObject.blocks.map(processBlock);
        file.contents = new Buffer(JSON.stringify(modelObject));

        this.push(file);
        return callback();
    });

    return stream;
}

gulp.task('paternize-json-models', function () {
    gulp.src(['/users/chrismatheson/Dropbox/Units of Sound/Development/ModelsUK/*ReadingBlock.json'])
        .pipe(paternize())
        .pipe(gulp.dest('output'));
});

gulp.task('default', ['paternize-json-models']);