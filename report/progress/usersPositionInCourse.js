'use strict';
module.exports = function (syllabus) {

  return syllabus.reduce(function (counts, result) {
    //setPage = false && !workOnDate = skipped
    var skipped = ((!result.setPage) && (!result.workOnDate));
    if (skipped) {
      counts.placed++;
      counts.current++;
    }

    //setPage = false && workOnDate = done
    var done = ((!result.setPage) && (result.workOnDate));
    if (done) {
      counts.current++;
    }

    return counts;
  }, {
    placed : 1,
    current: 1
  });
};
