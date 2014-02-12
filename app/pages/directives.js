'use strict';

angular.module('app').
  directive('ngFocus', ['$parse', function($parse) {
    return function(scope, element, attr) {
      var fn = $parse(attr.ngFocus);
      element.bind('focus', function(event) {
        scope.$apply(function() {
          fn(scope, {$event:event});
        });
      });
    };
  }]).
  directive('ngBlur', ['$parse', function($parse) {
    return function(scope, element, attr) {
      var fn = $parse(attr.ngBlur);
      element.bind('blur', function(event) {
        scope.$apply(function() {
          fn(scope, {$event:event});
        });
      });
    };
  }]).
  // Adding ng-autofill-aware to a <form> forces it to emit 'input' events on a variety of events
  // typically triggered by autofills by the browser or password managers.
  directive('ngAutofillAware', ['$parse', function() {
    return function(scope, element) {
      // listen for pertinent events to trigger input on form element
      // use timeout to ensure val is populated before triggering 'input'
      // ** 'change' event fires for Chrome/Firefox
      // ** 'keydown' for Safari 6.0.1
      // ** 'propertychange' for IE
      element.bind('change keydown propertychange', function() {
        // Trigger 'input' so underlying model changes. Don't wrap in scope.$apply as the handler
        // will trigger its own $apply.
        element.find('input').triggerHandler('input');
      });
    };
  }]).
  directive('ngClickRequireAuth', ['$parse', '$api', function($parse, $api) {
    return {
      restrict: "A",
      link: function(scope, element, attr) {
        var action = $parse(attr.ngClickRequireAuth);
        element.bind('click', function(event) {
          scope.$apply(function() {
            if (scope.current_person) {
              action(scope, {$event: event});
            } else {
              // if it has an href attribute, save that as the postauth URL
              var url = element.attr('href');
              element.removeAttr('href');
              element.removeAttr('ng-href'); // don't know if this actually has to be removed. oh well.
              $api.require_signin(url);
            }
          });
        });
      }
    };
  }]).
  directive('requireTwitter', ['$twttr', function($twttr) {
    return {
      restrict: "A",
      scope: "isolate",
      link: function() { $twttr.widgets.load(); }
    };
  }]).
  directive('requireGplus', ['$gplus', function($gplus) {
    return {
      restrict: "A",
      scope: "isolate",
      link: function() { $gplus.plusone.go(); } // $gplus.widgets.load();
    };
  }]).
  directive('selectOnClick', function () {
    return {
      restrict: "A",
      link: function (scope, element) {
        element.bind('click', function() {
          element[0].select();
        });
      }
    };
  }).
  directive('fundraiserCard', function() {
    return {
      restrict: "E",
      scope: {
        fundraiser: "="
      },
      templateUrl: "pages/fundraisers/partials/homepage_card.html"
    };
  }).
  directive('projectCard', function() {
    return {
      restrict: "E",
      scope: {
        project: "="
      },
      templateUrl: "pages/trackers/partials/homepage_card.html"
    };
  }).
  directive('requireGithubAuth', ["$api", "$window", "$location", function($api, $window, $location) {
    // TODO support more than 1 scope
    return {
      restrict: "AC",
      link: function(scope, element, attr) {
        element.bind('click', function() {
          scope.$apply(function() {
            if (scope.current_person) {
              $api.set_post_auth_url($location.path());
              var permission = attr.requireGithubAuth;

              if (scope.current_person.github_account) {
                if (permission && scope.current_person.github_account.permissions && scope.current_person.github_account.permissions.indexOf(permission) < 0) {
                  // need to redirect to get dat permission
                  $window.location = $api.signin_url_for('github', { scope: [permission] });
                }
              } else {
                $window.location = $api.signin_url_for('github', { scope: [permission] });
              }
            } else {
              $api.require_signin();
            }
          });
        });
      }
    };
  }]).
  directive('targetBlank', function() {
    return {
      restrict: "E",
      link: function($scope, element) {
        var modelName = element.attr('model');
        $scope.$watch(modelName, function(model) {
          if (model !== null) {
            setTimeout(function() {
              element.find('a').attr('target', '_blank');
            }, 0);
          }
        });
      }
    };
  }).
  directive('integerOnly', function() {
    return {
      require: 'ngModel',
      link: function(scope, elm, attrs, ctrl) {
        ctrl.$parsers.unshift(function(viewValue) {
          if (/^\-?\d*$/.test(viewValue)) {
            // it is valid
            ctrl.$setValidity('integer', true);
            return viewValue;
          } else {
            // it is invalid, return undefined (no model update)
            ctrl.$setValidity('integer', false);
            return undefined;
          }
        });
      }
    };
  }).
  directive('favicon', function() {
    return {
      restrict: "E",
      replace: true,
      scope: {
        domain: "@"
      },
      template: '<img ng-src="https://www.google.com/s2/favicons?domain={{domain}}" />'
    };
  }).
  directive('ownerProfileLink', function() {
    // Looks at a model and provides a link to its owner's profile.
    // Polymorphic on model.owner_type
    return {
      restrict: "E",
      transclude: true,
      replace: true,
      scope: {
        model: "="
      },
      template: '<a ng-transclude></a>',
      link: function(scope, element) {
        scope.$watch("model", function(model) {
          try {
            if (model) {
              if (!model.owner) {
                throw("Model is missing owner");
              } else if (!model.owner.type) {
                throw("Model is missing owner.type attribute");
              } else if (model.owner.type === "Person") {
                element.attr("href", "/people/"+model.owner.slug);
              } else if ((/^Team/).test(model.owner.type)) {
                element.attr("href", "/teams/"+model.owner.slug);
              } else {
                throw("Unexpected owner " + model.owner.type);
              }
            }
          } catch(e) {
          }
        });
      }
    };
  }).
  directive('inputSlug', ['$filter', function($filter) {
    return {
      restrict: "AC",
      require: "ngModel",
      link: function(scope, element, attrs, ctrl) {
        var slugify = function(viewValue) {
          var slugifiedViewValue = $filter('slug')(viewValue);
          if (slugifiedViewValue !== viewValue) {
            ctrl.$setViewValue(slugifiedViewValue);
            ctrl.$render();
          }
          return slugifiedViewValue;
        };
        ctrl.$parsers.push(slugify);
        slugify(scope[attrs.ngModel]); // initial value
      }
    };
  }]).
  directive('ownerHref', function() {
    return {
      restrict: "AC",
      link: function(scope, element, attr) {
        scope.$watch(attr.ownerHref, function(owner) {
          if (owner) {
            if ((/^person$/i).test(owner.type)) {
              element.attr("href", "/people/"+owner.slug);
            } else if ((/^team(?:::[a-z]+)*$/i).test(owner.type)) {
              element.attr("href", "/teams/"+owner.slug);
            }
          }
        });
      }
    };
  }).
  directive('loadingBar', function() {
    return {
      restrict: "E",
      replace: true,
      transclude: true,
      template: '<div><div class="text-center"><p class="lead" ng-transclude></p><progress value="100" class="progress-striped active"></progress></div></div>'
    };
  }).
  directive('gaqTrackClick', ['$timeout', '$window', function($timeout, $window) {
    return {
      restrict: "AC",
      link: function(scope, element, attrs) {
        element.bind('click', function(e){
          e.preventDefault();
        });
        var gaqArgsWatcher = scope.$watch(attrs.gaqArgs, function(gaqArgs) {
          gaqArgsWatcher();
          if (gaqArgs) {
            element.bind('click', function(){
              gaqArgs.push(attrs.href);
              $window._gaq.push(gaqArgs);

              $timeout(function() {
                $window.location = attrs.href;
              }, 250);
            });
          }
        });
      }
    };
  }]).
  directive('abRandomize', ['$rootScope', '$compile', function ($rootScope, $compile) {
    return {
      restrict: "AC",
      link: function (scope, element, attrs) {
        $rootScope.$on("$load_expiration_options", function () {
          var radio_array = element[0].children;
          var children_array = [];
          for (var i = 0; i < radio_array.length; i++) {
            children_array.push(radio_array[i]);
          }
          children_array = children_array.sort(function() {return 0.5 - Math.random();});
          element.children().remove();
          element.append(children_array);
          $compile(element.contents())(scope);
        });
      }
    };
  }]).
  directive('trackerSigninModal', ['$rootScope', '$routeParams', '$window', '$location', '$api', function($rootScope, $routeParams, $window, $location, $api) {
    return {
      restrict: 'E',
      templateUrl: 'pages/templates/trackerSigninModal.html',
      scope: {
        tracker: '='
      },
      link: function(scope) {
        $rootScope.$watch('current_person', function(person) {
          scope.$$showModal = ($window.parseInt($routeParams.signin, 10) === 1) && person === false;

          scope.openModal = function() {
            scope.$$showModal = true;
          };

          scope.closeModal = function() {
            scope.$$showModal = false;
          };

          scope.signin = function() {
            $api.set_post_auth_url($location.path());
            $window.location = $api.signin_url_for('github', { follow_tracker_ids: [scope.tracker.id] });
          };

          scope.spliceParamFromSearch = function() {
            var params = angular.copy($location.search());
            for (var k in params) {
              if (k === 'signin') {
                delete params[k];
              }
            }
            $location.search(params);
          };

          scope.spliceParamFromSearch();
        });
      }
    };
  }]).
  directive('trackerPluginAuthorizeModal', ['$routeParams', '$window', '$location', '$api', function($routeParams, $window, $location, $api) {
    return {
      templateUrl: 'pages/templates/trackerPluginAuthorizeModal.html',
      scope: 'isolated',
      link: function(scope) {
        scope.paramName = 'authorize';

        scope.$$showModal = $window.parseInt($routeParams[scope.paramName], 10) === 1;

        scope.closeModal = function() {
          scope.$$showModal = false;
        };

        scope.spliceParamFromSearch = function() {
          var params = angular.copy($location.search());
          for (var k in params) {
            if (k === scope.paramName) {
              delete params[k];
            }
          }
          $location.search(params);
        };

        scope.spliceParamFromSearch();

        // Save the current URL and go through GitHub oauth to collect the public_repo permission.
        scope.performOauthDance = function() {
          $api.set_post_auth_url($location.url());
          $window.location = $api.signin_url_for('github', { scope: 'public_repo' });
        };
      }
    };
  }]).directive('pieChart', ['$window', '$compile', function ($window, $compile) {
    return {
      restrict: "E",
      scope: {
        data: '='
      },
      link: function (scope, element, attrs) {

        scope.$watch('data', function (newValue, oldValue, scope) {
          // guard clause if there is no value yet
          if (!newValue) {return};
          var el = element[0];
          var color = d3.scale.category10();
          var width = el.clientWidth;
          var height = 440;
          var min = Math.min(width, height); // get the smallest value to appropriately size the donut chart
          var pie = d3.layout.pie().sort(null).value(function (data) { return (data.open + data.paid_out) });
          var arc = d3.svg.arc()
            .outerRadius(min/2 * 0.9) // make the radius fit in the smallest dimension
            .innerRadius(min/2 * 0.3)
          var svg = d3.select(element[0])
            .append("svg").attr({width: min, height: min})
          var g = svg.append('g')

            g.selectAll('path').data(pie(newValue))
              .enter().append('path')
              // .on('click', function (d, i) {
              //   console.log("fuck you");
              //   // this.setAttribute('popover', 'hi there');
              //   $compile(el)(scope);
              // })
              // .on('mouseenter', function (d, i) {
              // })
              .style('stroke', 'white')
              .attr('d', arc)
              .attr('popover', "fuck you")
              .attr('body', true)
              .attr('fill', function(d, i){ return color(i) });

          $compile(el)(scope);

          scope.$watch(function () {return el.clientWidth * el.clientHeight}, function (newValue, oldValue, scope) {
            width = el.clientWidth;
            height = el.clientWidth;
            min = Math.min(width, height);
            svg.attr({width: min, height: min})
            arc.outerRadius(min/2 * 0.9).innerRadius(min/2 * 0.3);
            svg.selectAll('path').attr('d', arc);
            g.attr('transform', 'translate('+min/2+','+min/2+")")
          });
        });
      }
    };
  }]);

