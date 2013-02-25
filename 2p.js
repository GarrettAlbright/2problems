$(document).ready(function() {

  // Tester model.
  var TesterModel = Backbone.Model.extend({
    'defaults': function() {
      var order_id = testers.nextOrderVal();
      return {
        'id': order_id,
        'order': order_id,
        'pattern': '',
        'testText': '',
      };
    },
    'matches': null,
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
      this.matches = null;
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
      this.matches = haystack.match(this.compiledPattern);
    }
  });
  
  // Collection of testers.
  var TesterCollection = Backbone.Collection.extend({
    'model': TesterModel,
    'nextOrderVal': function () {
      return this.length ? this.last().get('id') + 1 : 0;
    },
    'localStorage': new Backbone.LocalStorage('2problems-dot-com')
  })
  
  // Instantiate a collection.
  var testers = new TesterCollection;
  testers.fetch();
  
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
      var results = this.model.matches,
        $resultsRegion = $('.results', this.$el);
      // Remove things in the results region that aren't the header.
      $(':not(h2)', $resultsRegion).remove();
      // Don't put anything in the region if the pattern field is just an empty
      // string.
      if (this.model.get('pattern')) {
        // Note that String.match() returns null instead of just an empty array
        // in the case of no matches.
        if (this.model.compiledPattern === null) {
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
        $resultsRegion.append($results);
      }
    },
    'sendPattern': function() {
      var patternText = $('.pattern', this.$el).val();
      this.model.set('pattern', patternText);
      if (!patternText || !this.model.compilePattern(patternText)) {
        // We don't have a pattern to compile, or compilation failed. Skip
        // sending the haystack and jump directly to  renderMatches(), which
        // will show an error if necessary.
        this.model.save();
        this.renderMatches();
      }
      else {
        // Send the haystack. Subsequently, the matches will be show in the
        // results area for this tester.
        this.sendHaystack();
      }
    },
    'sendHaystack': function() {
      var haystack = $('.haystack', this.$el).val();
      this.model.set('testText', haystack);
      this.model.executePattern(haystack);
      this.renderMatches();
      this.model.save();
    }
  });

  // The "app" view.
  var TwoPView = Backbone.View.extend({
    'el': $('#main'),
    'initialize': function() {
      if (testers.length === 0) {
        // No testers were loaded, so create a blank one and push it into the
        // collection.
        var blankTester = new TesterModel();
        testers.push(blankTester);
      }
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
