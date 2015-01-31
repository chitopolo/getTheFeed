angular.module('applebo.login',  ['ngCookies'])

.controller('LoginCtrl', function($scope, $cookieStore, $alert, Auth, $auth, $state) {
  angular.extend($scope, Auth);
     
     $scope.currentUser;
     $scope.token;
    $scope.authenticate = function(provider) {
          $auth.authenticate(provider)
            .then(function(response) {

            // $scope.token = response.data.fbtoken;
              $alert({
                content: 'You have successfully logged in',
                animation: 'fadeZoomFadeDown',
                type: 'material',
                duration: 3
              });
               console.log('response: ' , response.data.fbtoken);
              $cookieStore.put('token', response.data.fbtoken);
              $state.go('feed');
            })
            .catch(function(response) {
              $alert({
                content: response.data.message,
                animation: 'fadeZoomFadeDown',
                type: 'material',
                duration: 3
              });
            });
        };


   
})
  .factory('Auth', function ($q, $http) {
    var getTokenFromFb = function(){
       var deferred = $q.defer();
       

       return $http.get('/auth/facebook/')
       .success(function(data) {
           // $scope.formData = {}; // clear the form so our user is ready to enter another
           console.log('this is the token'+ data);
            deferred.resolve();
       })
       .error(function(err) {
           console.log('Error: ' , err);
           deferred.reject(err);
       });

    };

  
    

   
    return {
      getTokenFromFb: getTokenFromFb,
      
    }



  });

