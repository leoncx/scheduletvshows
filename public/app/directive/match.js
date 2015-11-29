/*jslint browser: true*/
/*global angular*/

var matchDirective = angular.module('stsDirective.match', []);

matchDirective
  .directive(
    'match',
    function () {
      'use strict';
      return {
        require: 'ngModel',
        scope: {
          compareModelValue: '=match'
        },
        link: function (scope, element, attributes, ngModel) {
          ngModel.$validators.match = function (modelValue) {
            return modelValue === scope.compareModelValue;
          };

          scope.$watch('compareModelValue', function () {
            ngModel.$validate();
          });
        }
      };
    }
  );