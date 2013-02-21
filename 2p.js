$(document).ready(function() {

  // Tester model.
  var TesterModel = Backbone.Model.extend({
    'defaults': function() {
      return {
        'order': testers.nextOrderVal(),
        'pattern': '',
        'testText': '',
      };
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
    'render': function() {
      this.$el.html(this.template(this.model.toJSON()));
      return this;
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
