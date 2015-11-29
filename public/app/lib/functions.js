/*jslint browser: true*/
/*global angular*/

/**
 * Set form inputs to dirty and touched
 *
 * @param {object} form - The form to reset
 */
function setDirty(form) {
  angular.forEach(form.$error, function (type) {
    angular.forEach(type, function (field) {
      field.$setDirty();
      field.$setTouched();
    });
  });
}

/**
 * Set form inputs to pristine and untouched
 *
 * @param {object} form - The form to reset
 */
function setPristine(form) {
  angular.forEach(form.$error, function (type) {
    angular.forEach(type, function (field) {
      field.$setPristine();
      field.$setUntouched();
    });
  });
}