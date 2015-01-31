var AppleBo = angular.module('applebo',
    [
        'ui.router',
        'ngCookies',
        'satellizer',
        'mgcrea.ngStrap',
        
        'applebo.login',
        'applebo.logout',
        'applebo.feed'
    ])
    .config(function($stateProvider, $urlRouterProvider, $authProvider) {
            $urlRouterProvider.otherwise('/home');

            $stateProvider
                .state('login', {
                    url: '/login',
                    templateUrl: 'views/login.html',
                    controller: 'LoginCtrl'
                })
                .state('home', {
                    url: '/home',
                    templateUrl: 'views/home.html',
                    controller: 'LoginCtrl'
                })
                
                .state('logout', {
                    url: '/logout',
                    templateUrl: null,
                    controller: 'LogoutCtrl'
                })
                .state('feed', {
                    url: '/feed',
                    templateUrl: 'views/feed.html',
                    controller: 'FeedCtrl'
                });


            $authProvider.facebook({
              clientId: '749963285077786',
              url: '/auth/facebook',
              authorizationEndpoint: 'https://www.facebook.com/dialog/oauth',
              scope:'email, user_about_me, user_birthday, user_location, publish_stream, user_groups',
              scopeDelimiter: ',',
              requiredUrlParams: ['display', 'scope'],
              display: 'popup',
              type: '2.0',
              popupOptions: { width: 481, height: 269 }
            });

               // $authProvider.google({
               //   clientId: '631036554609-v5hm2amv4pvico3asfi97f54sc51ji4o.apps.googleusercontent.com'
               // });
  
               // $authProvider.twitter({
               //   url: '/auth/twitter'
               // });

        });