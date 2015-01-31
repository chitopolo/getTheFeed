angular.module('applebo.feed', ['ngCookies'])
  .controller('FeedCtrl', function($scope, $auth, $alert, Feed, $cookieStore) {
   angular.extend($scope, Feed)
   $scope.feed;

   $scope.token =  $cookieStore.get('token');

  
       Feed.get($cookieStore.get('token'))
       .then(function(data){
        console.log('esto habia en el feed :', data);
        $scope.feed = data.data;
       });




  })
  .factory('Feed', ['$http', function($http) {
     // call to get all nerds
      return {
        get : function(theToken) {
            return $http.get('/auth/getthefeed/' + theToken)
            .success(function(data) {
                // $scope.formData = {}; // clear the form so our user is ready to enter another
                // $scope.posts = data;
                console.log(data);
            })
            .error(function(data) {
                console.log('Error: ' , data);
            });
        }
      }

  }]);