/**
 * Created by isaacjiang on 9/29/15.
 */

var app = angular.module('pwikiApp', ['ngMaterial', 'ngFileUpload', 'md.data.table', 'angular-img-cropper']);


app.config(function ($mdThemingProvider) {
        $mdThemingProvider.definePalette('pwikiTheme', {
            '50': 'FAFAFA',
            '100': 'E2E2E2',
            '200': 'D8D8D8',
            '300': 'A8A8A8',
            '400': '8E8E8E',
            '500': '31353D',
            '600': '2C3037',
            '700': '1F2226',
            '800': '0D0E10',
            '900': '000000',
            'A100': '8080CC',
            'A200': '4D4DB8',
            'A400': '1919A3',
            'A700': '00006B',
            'contrastDefaultColor': 'light',    // whether, by default, text (contrast)
            'contrastDarkColors': ['50', '100', //hues which contrast should be 'dark' by default
                '200', '300', '400', 'A100'],
            'contrastLightColors': 'dark'    // could also specify this if default was 'dark'
        });
        $mdThemingProvider.theme('default')
            .primaryPalette('pwikiTheme')
            .accentPalette('blue');
    })

    .service('current_user', function ($http, $location, $q) {
        var deffered = $q.defer();
        var current_user = {};

        current_user.getData = function () {
            $http({method: 'GET', url: '/rest/users/userstatus'}).then(function success(res) {
                userStatus = res.data
           
                deffered.resolve();
            });
            return deffered.promise;
        }
        current_user.username = function () {
            return userStatus.username
        }
        current_user.permission = function () {
            return userStatus.permission
        }
        current_user.status = function () {
            return userStatus.status
        }
        current_user.settings = function () {
            return userStatus.settings
        }
        current_user.sessions = function () {
            return userStatus.sessions
        }
        return current_user
    })
    .service('windowsize', function ($window) {
        var windowsize = {"width": $window.innerWidth, "height": $window.innerHeight}
        return windowsize
    })

    .controller('menubarCtrl', ['$scope', '$rootScope', '$mdToast', '$mdSidenav', '$mdDialog', '$window', 'current_user', '$http', function ($scope, $rootScope, $mdToast, $mdSidenav, $mdDialog, $window, current_user, $http) {

        current_user.getData().then(function () {
            $scope.current_user = {}
            $scope.current_user.username = current_user.username()
            $scope.current_user.permission = current_user.permission()
            $scope.current_user.status = current_user.status()
            $scope.current_user.settings = current_user.settings()
            //console.log($scope.current_user.status)
            if ($scope.current_user.status.is_anonymous) {
                userLogin()
            }

            switch ($scope.current_user.permission) {
                    case '0':
                        $scope.current_user.permissionText = 'Superuser (Read/Write)';
                        break;
                    case '1':
                        $scope.current_user.permissionText = 'User (Read/Write)';
                        break;
                    case '2':
                        $scope.current_user.permissionText = 'User (Read Only)';
                        break;
                    default:
                        break;
                }

        })

        $scope.setting = function (menuId) {
            $mdSidenav('right').toggle();
        };
        $scope.toggleSidenav = function (menuId) {
            $mdSidenav(menuId).toggle();
        };
        $scope.home = function () {
            $window.location.href = '/'
        }
        
        
        $scope.login = function (ev) {
            userLogin(ev)
        }
        $scope.register = function (ev) {
            userRegister(ev)
        }


    /*    $scope.logout = function (ev) {
            //$rootScope.closeSidenav('left')
            $http.get('/system/logout').success(function (d) {
                console.log(d)
                $scope.current_user = {}
                $scope.current_user.username = d.userStatus.username
                $scope.current_user.permission = d.userStatus.permission
                $scope.current_user.status = d.userStatus.status
                $scope.current_user.settings = d.userStatus.settings
                window.location.href = "/";
            })
        }  */

        userRegister = function (ev) {
            $mdDialog.show({
                controller: registerCtrl,
                templateUrl: '/app/system/register',
                parent: angular.element(document.body),
                targetEvent: ev,
                clickOutsideToClose: true
            })
        };

        registerCtrl = function ($scope, $http) {
            $scope.cancel = function () {
                $mdDialog.cancel();
            };
            $scope.newUser = {}

            $scope.saveUser = function (newUser) {
                console.log(newUser)
                if (newUser.username == "" || newUser.username == undefined || newUser.password == "" || newUser.password == undefined) {
                    $scope.message = "Please enter a username and password."
                }
                else if (newUser.username.length < 6) {
                    $scope.message = "The entered username is too short. A minimum of 6 characters must be used."
                }
                else if (newUser.permission == "" || newUser.permission == undefined) {
                    $scope.message = "You did not select a valid permissin for this user."
                }
                else if (newUser.password != newUser.confirmpassword) {
                    $scope.message = "The entered passwords do not match."
                }
                else {
                    $http.post("/rest/users/register", newUser).success(function (d) {
                    console.log(d)
                    if ((d.register_status == false) && (d.message != undefined)) {
                        $scope.message = d.message
                    }
                    if (d.register_status == true) {
                    $scope.current_user = {}
                    $scope.current_user.username = d.userStatus.username
                    $scope.current_user.permission = d.userStatus.permission
                    $scope.current_user.status = d.userStatus.status
                    $scope.current_user.settings = d.userStatus.settings

                    $mdDialog.cancel();
                    window.location.href = "/";
                    }
                })
                }
            }
        }

        userLogin = function (ev) {
            $mdDialog.show({
                controller: loginCtrl,
                templateUrl: '/app/system/login',
                parent: angular.element(document.body),
                targetEvent: ev,
                clickOutsideToClose: false
            })

        };

        loginCtrl = function ($scope, $http, current_user) {
            $scope.cancel = function () {
                $mdDialog.cancel();
            };

            $scope.loginUser = {}
            $scope.loginUserSave = function (loginUser) {
                console.log(loginUser)
                if (loginUser.username == "" || loginUser.username == undefined) {
                    $scope.message = "Please enter a username and password."
                }
                else if (loginUser.password == "" || loginUser.password == undefined) {
                    $scope.message = "Please enter a password."
                }
                else {
                    $http.post("/rest/users/login", loginUser).success(function (d) {
                        console.log(d)
                        if ((d.login_status == false) && (d.message != undefined)) {
                            $scope.message = d.message
                        }
                        if (d.login_status == true) {
                            $scope.current_user = {}
                            $scope.current_user.username = d.userStatus.username
                            $scope.current_user.permission = d.userStatus.permission
                            $scope.current_user.status = d.userStatus.status
                            $scope.current_user.settings = d.userStatus.settings
                            $mdDialog.cancel();
                            window.location.href = "";
                        }
                    })
                }
            }
        }

        $rootScope.notificationToast = function (message) {

            var toast = $mdToast.simple()
                .content(message)
                .action('OK')
                .highlightAction(false)
                .hideDelay(5000)
                .position('bottom right');
            $mdToast.show(toast).then(function (response) {
                if (response == 'ok') {
                    $mdToast.cancel()
                }
            });
        };
    }])









