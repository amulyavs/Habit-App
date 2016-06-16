// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('starter', ['ionic', 'firebase'])

.constant('FB', 'https://moti-project.firebaseio.com')

.factory('Items', ['$firebaseArray', function ($firebaseArray) {
            var itemsRef = new Firebase('https://moti-project.firebaseio.com/items');
            return $firebaseArray(itemsRef);
        }
    ])

.factory('Auth', function ($firebaseAuth, FB, $window) {
    var itemsRef = new $window.Firebase(FB);
    return $firebaseAuth(itemsRef);
})

.config(function ($stateProvider, $urlRouterProvider) {

    $stateProvider
    .state('signin', {
        url : '/sign-in',
        templateUrl : 'templates/sign-in.html',
        controller : 'SignInCtrl'
    })

    .state('todo', {
        url : '/todo',
        templateUrl : "templates/todo.html",
        controller : 'ListCtrl'
    })

    $urlRouterProvider.otherwise('/sign-in');

})

.controller('SignInCtrl', function ($scope, Auth, $state) {

    Auth.$onAuth(function (authData) {
        if (authData) {
            $scope.loggedInUser = authData;
        } else {
            $scope.loggedInUser = null;
        }
    });

    $scope.signIn = function (user) {
        Auth.$createUser({
            email : user.email,
            password : user.pass
        }).then(function () {
            return Auth.$authWithPassword({
                email : user.email,
                password : user.pass
            });
        }).then(function (authData) {
            $state.go('todo');
        }).catch (function (error) {
            console.log('Error: ', error);
        });
    };

    $scope.login = function (user) {
        Auth.$authWithPassword({
            email : user.email,
            password : user.pass
        }).then(function (authData) {
            console.log('Logged in successfully as: ', authData.uid);
            $state.go('todo');
        }).catch (function (error) {
            console.log('Error: ', error);
        });

    };

})

.controller('ListCtrl', function ($scope, $firebaseAuth, $ionicListDelegate, $firebaseObject, Items, $ionicPopup, $interval, $firebase, $ionicPlatform,$timeout) {

    $scope.items = Items;
    $scope.stopSpam = false;
    $scope.count = 0;

    $scope.list = function () {
        var FB = new Firebase("https://moti-project.firebaseio.com");
        var fbAuth = $firebaseAuth(FB);
        fbAuth = FB.getAuth();
        if (fbAuth) {
            var syncObject = $firebaseObject(FB.child("users/" + fbAuth.uid));
            syncObject.$bindTo($scope, "data");
        }
    }

    $scope.addItem = function () {
        $ionicPopup.prompt({
            title : 'Enter a task you want to add',
            inputType : 'text'
        })
        .then(function (result) {
            if (result !== "") {
                if ($scope.data.hasOwnProperty("todos") !== true) {
                    $scope.data.todos = [];
                }
                $scope.data.todos.push({
                    title : result
                });
            } else {
                console.log("Action not completed");
            }
        });
    }

    $scope.doneItem = function (todo) {
        todo['stopSpam'] = true;
        if(!todo['time']){
            todo['time'] = [];
        }
        todo.time.push({
            date : Date()
        });

    }
    function checkDailyUpdate(){
        $timeout(function () {
            var today = new Date().toDateString();
            for(var i=0;i<$scope.data.todos.length;i++){
                var isSameDay = false;
                for (var j = 0; j < $scope.data.todos[i].time.length; j++) {
                    if(new Date($scope.data.todos[i].time[j].date).toDateString() == today){
                        isSameDay = true;
                        break;
                    }
                }
                $scope.data.todos[i]['stopSpam'] = isSameDay;
            }
        },0);
    }
    $ionicPlatform.on('resume', checkDailyUpdate);
});
