$(document).ready(function() {

  // Tester model.
  var TesterModel = Backbone.Model.extend({
    'defaults': function() {
      return {
        'order': testers.nextOrderVal(),
        'pattern': '',
        'testText': '',
        'matches': null,
      };
    },
    // Store the compiled pattern.
    'compiledPattern': null,
    // Store matches.
    // Parse the pattern string and compile the pattern. Returns true or false
    // based on success of the new pattern compilation.
    'compilePattern': function(pattern) {
      // The first character must be the pattern delimiter.
      var patternDelimiter = pattern.charAt(0),
        // Build a pattern to extract the pattern and its flags.
        patternPattern = new RegExp('\\' + patternDelimiter + '(.+)\\' + patternDelimiter + '(.*)'),
        patternParts = pattern.match(patternPattern);
      // If we're building a new pattern, we want to flush the old match
      // results.
      this.set('matches', null);
      try {
        this.compiledPattern = new RegExp(patternParts[1], patternParts[2]);
      }
      catch (e) {
        this.compiledPattern = null;
        return false;
      }
      return true;
    },
    // Run our compiled pattern against text and store the results.
    'executePattern': function(haystack) {
      this.set('matches', haystack.match(this.compiledPattern));
    }
  });
  
  // Collection of testers.
  var TesterCollection = Backbone.Collection.extend({
    'model': TesterModel,
    'nextOrderVal': function () {
      return this.length ? this.last().get('order') + 1 : 0;
    }
  })
  
  // Instantiate a collection.
  var testers = new TesterCollection;
  
  // View for testers. Uses a "template" in the HTML.
  var TesterView = Backbone.View.extend({
    'tagName': 'article',
    'template': _.template($('#tester-t').html()),
    'events': {
      'keyup .pattern': 'sendPattern',
      'keyup .haystack': 'sendHaystack'
    },
    'render': function() {
      this.$el.html(this.template(this.model.toJSON()));
      return this;
    },
    'renderMatches': function() {
      var results = this.model.get('matches');
      // Note that String.match() returns null instead of just an empty array
      // in the case of no matches.
      if (this.model.get('compiledPattern') === null) {
        var $results = $('<div>').addClass('error').text('(invalid pattern)');
      }
      else if (results === null) {
        var $results = $('<div>').text('(no matches)');
      }
      else {
        var $results = $('<ol>');
        _.each(results, function(result) {
          $results.append($('<li>').text(result));
        });
      }
      $('.results', this.$el).empty().append($results);
    },
    'sendPattern': function() {
      var patternText = $('.pattern', this.$el).val();
      this.model.set('pattern', patternText);
      if (patternText && this.model.compilePattern(patternText)) {
        this.sendHaystack();
      }
    },
    'sendHaystack': function() {
      var haystack = $('.haystack', this.$el).val();
      this.model.set('testText', haystack);
      this.model.executePattern(haystack);
      this.renderMatches();
    }
  });

  // The "app" view.
  var TwoPView = Backbone.View.extend({
    'el': $('#main'),
    'initialize': function() {
      // @todo Check for pre-existing saved terms and put them in here.
      // For now we just create a blank tester.
      var blankTester = new TesterModel();
      testers.push(blankTester);
    },
    'render': function() {
      testers.each(function(tester) {
        var view = new TesterView({'model': tester});
        // "This" is the window…?
        this.$('#main').append(view.render().el);
      });
      // Remove the "No JS" warning.
      this.$('#third-problem').remove();
    }
  });
  
  var TwoProblems = new TwoPView;
  TwoProblems.render();

});
