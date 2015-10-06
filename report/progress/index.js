/*jshint browser:true*/
/*global React*/
var capatalize = require('./capatalize');
var usersPositionInCourse = require('./usersPositionInCourse');

window.render = function (user) {
  var header = React.DOM.h1({className: 'ui center aligned icon header'}, [
    React.DOM.i({className: 'circular bar chart icon'}),
    user.firstName + ' ' + user.surname + ' - Progress Report'
  ]);
  React.render(header, document.getElementById('header'));

  function stat(val, label) {
    return React.DOM.div({className:'ui small statistic'}, [
      React.DOM.div({className:'value'}, [
        React.DOM.span(null, val)
      ]),
      React.DOM.div({className:'label'}, label),
    ]);
  }

  function barIndicator(syllabus) {
    var positions = usersPositionInCourse(syllabus);
    console.log(positions);

    return React.DOM.div({className: 'syllabus progress indicator'}, [
      React.DOM.span({className: 'stage1 background', style: {'width': '33.333%'}}, ' '),
      React.DOM.span({className: 'stage2 background', style: {'width': '33.333%'}}, ' '),
      React.DOM.span({className: 'stage3 background', style: {'width': '33.333%'}}, ' '),
      React.DOM.span({className: 'blue background', style: {
        width: ((positions.current / syllabus.length) * 100) +'%',
        position: 'absolute',
        left: 0}}, ' '),
      React.DOM.span({className: 'grey background', style: {
        width: ((positions.placed / syllabus.length) * 100) +'%',
        position: 'absolute',
        left: 0}
      }, ' ')
    ]);
  }

  var progress = React.DOM.div({className: 'ui grid'}, [
    React.DOM.div({className: 'row'}, [
      React.DOM.h1({className: 'four wide column'}, capatalize('reading')),
      React.DOM.div({className: 'twelve wide column'}, barIndicator(user.readingSyllabus))
    ]),
    React.DOM.div({className: 'row'}, [
      React.DOM.div({className: 'four wide column'}, ''),
      React.DOM.div({className: 'twelve wide column'},
        React.DOM.div({className: 'ui statistics'}, [
          user.placementReadingDate ? stat(user.placementReadingDate, 'Placed on') : null,
          stat(usersPositionInCourse(user.readingSyllabus).placed, 'Started at'),
          stat('9/10', 'Av Score')
        ])
      )
    ]),
    React.DOM.div({className: 'row'}, [
      React.DOM.h1({className: 'four wide column'}, capatalize('spelling')),
      React.DOM.div({className: 'twelve wide column'}, barIndicator(user.spellingSyllabus))
    ]),
    React.DOM.div({className: 'row'}, [
      React.DOM.div({className: 'four wide column'}, ''),
      React.DOM.div({className: 'twelve wide column'},
        React.DOM.div({className: 'ui statistics'}, [
          user.placementSpellingDate ? stat(user.placementSpellingDate, 'Placed on') : null,
          stat(usersPositionInCourse(user.spellingSyllabus).placed, 'Started at'),
          stat('9/10', 'Av Score')
        ])
      )
    ]),
    React.DOM.div({className: 'row'}, [
      React.DOM.h1({className: 'four wide column'}, capatalize('memory')),
      React.DOM.div({className: 'twelve wide column'}, barIndicator(user.memorySyllabus))
    ]),
    React.DOM.div({className: 'row'}, [
      React.DOM.div({className: 'four wide column'}, ''),
      React.DOM.div({className: 'twelve wide column'},
        React.DOM.div({className: 'ui statistics'}, [
          stat(usersPositionInCourse(user.memorySyllabus).placed, 'Started at'),
          stat('9/10', 'Av Score')
        ])
      )
    ]),
    React.DOM.div({className: 'row'}, [
      React.DOM.h1({className: 'four wide column'}, capatalize('dictation')),
      React.DOM.div({className: 'twelve wide column'}, barIndicator(user.dictationSyllabus))
    ]),
    React.DOM.div({className: 'row'}, [
      React.DOM.div({className: 'four wide column'}, ''),
      React.DOM.div({className: 'twelve wide column'},
        React.DOM.div({className: 'ui statistics'}, [
          stat(usersPositionInCourse(user.dictationSyllabus).placed, 'Started at'),
          stat('9/10', 'Av Score')
        ])
      )
    ])
  ]);

  React.render(progress, document.getElementById('progress'));
};
