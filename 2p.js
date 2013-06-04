/*jslint browser: true, nomen: true, white: true, indent: 2 */
/*global $, Backbone, _, escape, unescape */

var testerPresets = {
  'blank': {},
  'email': {
    // Note that backslashes have to be escaped by backslashes…
    'pattern': '/\\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,4}\\b/ig',
    // Note that it appears we can't have literal line breaks in JavaScript
    // strings; hence the \n mess below.
    'testText': "This pattern matches email addresses. It was culled from Jan Goyvaerts\' wonderful Regular-Expressions.info site, as found on  http://www.regular-expressions.info/email.html , so all credit to him. Though it is not the official pattern to match email addresses, it is far simpler while still broad enough to work nearly all the time. Here\'s some test email addresses to match or not match:\n\nalbright@abweb.us\nbillg@microsoft.com\nfoo@example..org\ntcook@apple.com\ntesting@subdomain.example.net\nfailure@example\n\nHere\'s an example of an email address which will fail with this pattern, even though it\'s technically correct:\ninfo@about.museum"
  },
  'non-ascii': {
    'pattern': '/[^\\x00-\\x7f]+/g',
    'testText': "&#12371;&#12435;&#12395;&#12385;&#12399;&#65281; This pattern will find contiguous lengths of non-ASCII characters, including heavy metal &uuml;mlauts. Note that it won\'t catch tricky non-printable but legal ASCII characters such as the bell or escape characters, though. C\'est la vie. &iquest;Podemos ir a las monta&ntilde;as?"
  },
  'na-tel': {
    'pattern': '/(\\(\\d{3}\\)|\\b\\d{3})[- ]?\\d{3}[- ]?\\d{4}\\b/g',
    'testText': "This pattern is designed to extract North American telephone numbers (with area codes) in various common formats.\n505-555-4567, (707) 555-1234, 759 555 7890, 8185554860\nNot-so-common but still not quite nonsense:\n(505)555-4567, (423)5559999, 123-5557891\n\nHere's some bad numbers which shouldn't match.\n(555) 555 123, 555 1235, 5555-1236, (123) 555-12345, (1234) 555-9984"
  },
  'repeating': {
    'pattern': '/(\\w)(\\1+)/g',
    'testText': "Welcome to 2problems.com, the friendly JavaScript-powered regular expression tester! Now you have two problems…\n\nRegular expressions are a powerful tool for programmers for finding bits of text inside of other text. For example, the pattern in the field above finds sequences of two or more repeated letters that appear in this text. (If you aren't a programmer, you probably won't find regular expressions, or this site, very useful.) Isn't it cooooooooooool? :)\n\nTo test an expression of your own, change the pattern in the field above, or use the \"New tester\" menu below to add a new tester to the page. For more info about 2problems.com, click the \"About\" link in the sidebar to the right."
  }
};

$(document).ready(function() {
  'use strict';
  // Tester model.
  var TesterModel = Backbone.Model.extend({
    'defaults': function() {
      var order_id = testers.nextOrderVal();
      return {
        'id': order_id,
        'order': order_id,
        'pattern': '',
        'testText': '',
        'hash': ''
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
  }),

    // Collection of testers.
    TesterCollection = Backbone.Collection.extend({
      'model': TesterModel,
      'nextOrderVal': function () {
        return this.length ? this.last().id + 1 : 0;
      },
      'localStorage': new Backbone.LocalStorage('2problems-dot-com')
    }),

    // Instantiate a collection.
    testers = new TesterCollection(),
    TesterView, TwoPView, TwoProblems;

  testers.fetch();

  // View for testers. Uses a "template" in the HTML.
  TesterView = Backbone.View.extend({
    'tagName': 'article',
    'template': _.template($('#tester-t').html()),
    'events': {
      'keyup .pattern': 'sendPattern',
      'keyup .haystack': 'sendHaystack',
      'click .copy': 'cloneSelf',
      'click .close': 'closeSelf'
    },
    'render': function() {
      this.$el.html(this.template(this.model.toJSON()));
      this.$el.attr({'id': 'tester-' + this.model.id, 'class': 'tester'});
      if (this.model.get('pattern') !== undefined) {
        this.sendPattern();
      }
      if (this.model.get('isHighlighted')) {
        $('form', this.$el).addClass('highlighted');
        this.model.set('isHighlighted', false);
      }
      this.$el.slideDown();
      return this;
    },
    'renderMatches': function() {
      var results = this.model.matches,
        $resultsRegion = $('.results', this.$el),
        $results;
      // Remove things in the results region that aren't the header.
      $(':not(h2)', $resultsRegion).remove();
      // Don't put anything in the region if the pattern field is just an empty
      // string.
      if (this.model.get('pattern')) {
        // Note that String.match() returns null instead of just an empty array
        // in the case of no matches.
        if (this.model.compiledPattern === null) {
          $results = $('<div>').addClass('error').text('(invalid pattern)');
        }
        else if (results === null) {
          $results = $('<div>').text('(no matches)');
        }
        else {
          $results = $('<ol>');
          _.each(results, function(result) {
            $results.append($('<li>').text(result));
          });
        }
        $resultsRegion.append($results);
      }
    },
    'sendPattern': function() {
      // @todo We probably want to re-engineer this so that sending the pattern
      // to the model and trying to complile it are two seperate operations, as
      // we actually want to do the latter without doing the former when
      // instantiatng from localStorage.
      var patternText = $('.pattern', this.$el).val();
      this.model.set('pattern', patternText);
      if (!patternText || !this.model.compilePattern(patternText)) {
        // We don't have a pattern to compile, or compilation failed. Skip
        // sending the haystack and jump directly to  renderMatches(), which
        // will show an error if necessary.
        this.model.save({'pattern': patternText});
        this.renderMatches();
        $('a.hash', this.$el).hide();
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
      this.model.save({'testText': haystack});
      this.setHash();
    },
    'cloneSelf': function() {
      var tester = new TesterModel({'pattern': this.model.get('pattern'), 'testText': this.model.get('testText')});
      testers.add(tester, {'at': this.model.id});
    },
    'closeSelf': function() {
      this.model.destroy();
      this.$el.slideUp();
    },
    'setHash': function() {
      var patternText = this.model.get('pattern'),
        haystackText = this.model.get('testText'),
        hashUrl = document.location.protocol + '//' + document.location.hostname + document.location.pathname + '#' + escape(patternText + patternText.charAt(0) + haystackText);
      if (hashUrl.length < 2083) {
        $('a.hash', this.$el).show().attr({'href': hashUrl});
      }
      else {
        $('a.hash', this.$el).hide();
      }
    }
  });

  // The "app" view.
  TwoPView = Backbone.View.extend({
    'el': $('#main'),
    'events': {
      'click footer input#add': 'addTester'
    },
    'initialize': function() {
      var unescapedHash = unescape(document.location.hash),
        delimiter, matches, initialTester;

      $('.toggle-about').click(function() {
        if ($('body').hasClass('header-open')) {
          $('body').removeClass('header-open');
          $('header #open-about').text('About');
          document.location.hash = '';
        }
        else {
          $('body').addClass('header-open');
          $('header #open-about').text('Close about text');
        }
      });

      if (document.location.hash === '#about') {
        $('.toggle-about').eq(0).click();
      }
      // See if we can create a tester from the hash
      // A hash will look like:
      // #/foo/i/foobarappasdf
      // Compiled pattern will look like:
      // /^#(\/[^\/]+/(?:[gi]+)?)\/((?:\r|\n|.)+)/
      // (For whatever reason, [\r\n.] does not work)
      else if (unescapedHash.length > 1) {
        delimiter = unescapedHash.charAt(1);
        matches = unescapedHash.match(new RegExp('^#(\\' + delimiter + '[^\\' + delimiter + ']+\\' + delimiter + '(?:[gi]+)?)\\' + delimiter + '((?:\r|\n|.)+)'));
        if (matches) {
          initialTester = new TesterModel({'pattern': matches[1], 'testText': matches[2]});
          initialTester.set('isHighlighted', true);
          testers.push(initialTester);
        }
      }
      if (testers.length === 0) {
        // No testers were loaded, so create a 'repeating' tester and add it to
        // the page since its test text has a nice welcome message.
        initialTester = new TesterModel(testerPresets.repeating);
        testers.push(initialTester);
      }
      this.listenTo(testers, 'add', this.addOne);

    },
    'render': function() {
      testers.each(function(tester) {
        var view = new TesterView({'model': tester});
        // "This" is the window…?
        $('#main footer').before(view.render().el);
      });
      // Remove the "No JS" warning.
      $('#third-problem').remove();
      // Show the footer.
      $('footer').show();
    },
    'addOne': function(tester) {
      var view = new TesterView({'model': tester});
      $('footer').before(view.render().el);
    },
    'addTester': function() {
      var testerPresetName = this.$('footer select#new-type').val(),
        newTester = new TesterModel(testerPresets[testerPresetName]);
      testers.push(newTester);
    }
  });

  TwoProblems = new TwoPView();
  TwoProblems.render();

});
