angular.module('applebo.logout', ['ngCookies'])
  .controller('LogoutCtrl', function($auth, $cookieStore, $alert) {
    if (!$auth.isAuthenticated()) {
        return;
    }
    $auth.logout()
      .then(function() {
        $alert({
          content: 'You have been logged out',
          animation: 'fadeZoomFadeDown',
          type: 'material',
          duration: 3
        });
          $cookieStore.remove('token');
      });
  });