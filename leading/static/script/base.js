/**
 * Created by isaacjiang on 2016-09-08.
 */

var app = angular.module('leadingApp', ['ngMaterial', 'ngFileUpload', 'md.data.table','pdf']);


app.config(function ($mdThemingProvider) {
    $mdThemingProvider.definePalette('leadingTheme', {
        '50': '6666FF',
        '100': '4D4DFF',
        '200': '3333FF',
        '300': '0000FF',
        '400': '0000CC',
        '500': '4B0082',
        '600': '000033',
        '700': '00004D',
        '800': '00001A',
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
        .primaryPalette('leadingTheme')
        .accentPalette('orange');
})

    .service('current_user', function ($http, $location, $q) {
        var deffered = $q.defer();
        var current_user = {};

        current_user.getData = function () {
            $http({method: 'GET', url: '/api/users/userstatus'}).then(function success(res) {
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
        current_user.sessions = function () {
            return userStatus.sessions
        }
        return current_user
    })
    .service('windowsize', function ($window) {
        var windowsize = {"width": $window.innerWidth, "height": $window.innerHeight}
        return windowsize
    })
    .controller('menuCtrl', ['$scope', '$rootScope', '$mdToast', '$mdSidenav', '$mdDialog', '$window', 'current_user',
        '$http', 'Upload', function ($scope, $rootScope, $mdToast, $mdSidenav, $mdDialog, $window, current_user, $http, Upload) {

        // general functions
        function formatNum(num){
            var n = num.toString(), p = n.indexOf('.');
            return n.replace(/\d(?=(?:\d{3})+(?:\.|$))/g, function($0, i){
                return p<0 || i<p ? ($0+',') : $0;
            });
        }


        //user info
        current_user.getData().then(function () {
            $rootScope.current_user = {}
            $rootScope.current_user.username = current_user.username()
            $rootScope.current_user.permission = current_user.permission()
            $rootScope.current_user.status = current_user.status()
            //console.log($rootScope.current_user.permission==0 )
            $rootScope.superuser = $rootScope.current_user.permission == '0'
            // console.log('superuser',$rootScope.superuser)
            if ($rootScope.current_user.status.is_anonymous) {
                userLogin()
            }
            else{

                    $http({
                            method:'GET',
                            url:"/api/entities/getuserinfo",
                            params:{username:$rootScope.current_user.username}
                        }
                    ).success(function(d){
                        // console.log(d)
                        $rootScope.user_info = d
                        if (typeof $rootScope.ipc == "undefined") {
                            $rootScope.ipc = io("/ipc")
                        }
                        $rootScope.ipc.on('connect', function (d) {
                            console.log('connected.')
                            if ($rootScope.user_info.teamInfo) {
                                $rootScope.ipc.emit("join", $rootScope.user_info)
                            }

                        })
                        $rootScope.ipc.on('message', function (d) {
                            $rootScope.notificationToast(d)
                        })

                        $rootScope.notificationToast("Current Accessed User " + d.userInfo.username + ".")

                    })

                $scope.listTasks = function (menuid) {
                    $http({
                            method:'GET',
                            url:"/api/dtools/taskslist",
                            params:{username:$rootScope.current_user.username}
                        }
                    ).success(function(d){
                        //console.log(d)
                        $rootScope.tasklists = d
                        // d.forEach(function (dd) {
                        //     if (dd.taskID=="10001"){
                        //         $rootScope.tasklists.unshift(dd)
                        //     }
                        //     else{
                        //         $rootScope.tasklists.push(dd)
                        //     }
                        // })

                        $mdSidenav(menuid).toggle();
                    })
                }
            }
        })

        //tasks
            $rootScope.sendMessage = function (message) {
                // console.log(message)
                $rootScope.ipc.emit('notification', {
                    "username": $rootScope.user_info.userInfo.username,
                    "room": $rootScope.user_info.teamInfo.teamName, "message": message
                })
            }



        $scope.home = function() {
            $window.location.href = '/'
        };
        $scope.dashboard = function() {
            if ($rootScope.current_user.username == null){$window.location.href = '/'}

            else{$window.location.href = '/dashboard'
                //console.log('dashboard')
                $rootScope.notificationToast("Landing to Dashboard page.")
                }
        };
            $scope.account = function () {
            if ($rootScope.current_user.username == null){$window.location.href = '/'}
            else {
                $window.location.href = '/account'
                //$mdSidenav('account').toggle()
                $rootScope.notificationToast("Landing to account page.")
            }
        };
        $scope.help= function() {
            $window.location.href = '/help'
        };

            $scope.go_forward = function () {
                $http({
                        method: 'GET',
                        url: "/api/syssetting/goforwardnextperiod",
                        params: {username: $rootScope.current_user.username}
                    }
                ).success(function (d) {
                    //console.log(d)
                    $rootScope.user_info.companyInfo.currentPeriod = d
                    $rootScope.sendMessage('Go forward to Period #' + d)
                })

            }
            $scope.go_back = function () {
                $http({
                        method: 'GET',
                        url: "/api/syssetting/backtopreviousperiod",
                        params: {username: $rootScope.current_user.username}
                    }
                ).success(function (d) {
                    //console.log(d)
                    $rootScope.user_info.companyInfo.currentPeriod = d
                    $rootScope.sendMessage('Back to Period #' + d)
                })

            }

            $scope.reset = function () {
                $http.get("/api/syssetting/restorelatest").success(function (res) {
                    console.log(res)
                    if (typeof (res) == 'string') {
                        var mes = res
                    }
                    else {
                        var mes = "System restore to Date " + res[0]['backupDate']
                    }
                    $rootScope.notificationToast(mes)
                })
            };

        $scope.settings= function() {
            $window.location.href = '/settings'
            $rootScope.notificationToast("Landing to settings page.")
            };


        $scope.accountBudgetfn = function () {
            accountBudgetfn();
        }

        $scope.login = function (ev) {
            userLogin(ev)
        }
        $scope.jointeam = function () {
            joinTeam()
        }

        $scope.register = function (ev) {
            userRegister(ev)
        }

        $scope.logout = function (ev) {
         //$rootScope.closeSidenav('left')
         $http.get('/api/users/logout').success(function (d) {

             $rootScope.current_user = {}
             $rootScope.current_user.username = d.userStatus.username
             $rootScope.current_user.permission = d.userStatus.permission
             $rootScope.current_user.status = d.userStatus.status
         window.location.href = "/";
         })
         }

        function userRegister (ev) {
            $mdDialog.show({
                controller: registerCtrl,
                templateUrl: '/app/system/register',
                parent: angular.element(document.body),
                targetEvent: ev,
                clickOutsideToClose: true
            })
        };

        function registerCtrl($scope, $http) {
            $scope.cancel = function () {
                $mdDialog.cancel();
            };
            $scope.newUser = {}
            //console.log('superuser',$rootScope.superuser)
            $scope.superuser = $rootScope.superuser

            $scope.saveUser = function (newUser) {
                console.log(newUser)
                if (newUser.username == "" || newUser.username == undefined || newUser.password == "" || newUser.password == undefined) {
                    $scope.message = "Please enter a username and password."
                }
                else if (newUser.username.length < 6) {
                    $scope.message = "The entered username is too short. A minimum of 6 characters must be used."
                }
                // else if (newUser.permission == "" || newUser.permission == undefined) {
                //     $scope.message = "You did not select a valid permissin for this user."
                // }
                else if (newUser.password != newUser.confirmpassword) {
                    $scope.message = "The entered passwords do not match."
                }
                else {
                    $http.post("/api/users/register", newUser).success(function (d) {
                        console.log(d)
                        if ((d.register_status == false) && (d.message != undefined)) {
                            $scope.message = d.message
                        }
                        if (d.register_status == true) {
                            $rootScope.current_user = {}
                            $rootScope.current_user.username = d.userStatus.username
                            $rootScope.current_user.permission = d.userStatus.permission
                            $rootScope.current_user.status = d.userStatus.status
                            //$rootScope.current_user.settings = d.userStatus.settings
                            $rootScope.superuser = $rootScope.current_user.permission == '0'
                            $mdDialog.cancel();
                            window.location.href = "";
                        }
                    })
                }
            }
        }

        function userLogin(ev) {
            $mdDialog.show({
                controller: loginCtrl,
                templateUrl: '/app/system/login',
                parent: angular.element(document.body),
                targetEvent: ev,
                clickOutsideToClose: false
            })

        };

        function loginCtrl($scope, $http, current_user) {
            $scope.cancel = function () {
                $mdDialog.cancel();
            };

            $scope.loginUser = {}
            $scope.loginUserSave = function (loginUser) {

                if (loginUser.username == "" || loginUser.username == undefined) {
                    $scope.message = "Please enter a username and password."
                }
                else if (loginUser.password == "" || loginUser.password == undefined) {
                    $scope.message = "Please enter a password."
                }
                else {
                    $http.post("/api/users/login", loginUser).success(function (d) {
                        console.log(d)
                        if ((d.login_status == false) && (d.message != undefined)) {
                            $scope.message = d.message
                        }
                        if (d.login_status == true) {
                            $rootScope.current_user = {}
                            $rootScope.current_user.username = d.userStatus.username
                            $rootScope.current_user.permission = d.userStatus.permission
                            $rootScope.current_user.status = d.userStatus.status
                            $rootScope.current_user.settings = d.userStatus.settings
                            $mdDialog.cancel();
                            window.location.href = "";
                        }
                    })
                }
            }
        }

            function instructionFn(infoFile, func, task) {
                // console.log(func)
                // Show the dialog
                $mdDialog.show({
                    clickOutsideToClose: false,
                    bindToController: true,
                    controller: showpdfCtrl,
                    templateUrl: '/api/dtools/getpage?pagename=showpdf',
                    locals: {infoFile: infoFile, func: func}
                });

                function showpdfCtrl($scope, $mdDialog, infoFile, func) {

                    $scope.close = function () {
                        // $mdDialog.hide();
                        func(task)
                    };
                    $scope.pdfName = ' Introduction';
                    $scope.pdfUrl = "/files/download?filename=" + infoFile['filename'] +
                        "&id=" + infoFile['objectID'] + "&ctype=" + infoFile['content_type']
                    //'static/pdf/oea-big-data-guide-1522052.pdf';

                    $scope.scroll = 100;
                    $scope.loading = '';

                    $scope.getNavStyle = function (scroll) {
                        if (scroll > 100) return 'pdf-controls fixed';
                        else return 'pdf-controls';
                    }


                }
            }

        function timerFn(endtime) {

            var dt =endtime.split(' ')[0].split('-')
            var tm= endtime.split(' ')[1].split(':')

            var endtime_obj = new Date(dt[0],dt[1]-1,dt[2],tm[0],tm[1],tm[2])

             var svgUnderlay = d3.select(".clock svg"),
                    svgOverlay = d3.select(".clock").append(function() { return svgUnderlay.node().cloneNode(true); }),
                    svg = d3.selectAll(".clock svg");

                svgUnderlay.attr("id", "underlay");
                svgOverlay.attr("id", "overlay");


                var digit = svg.selectAll(".digit"),
                    separator = svg.selectAll(".separator circle");

                var digitPattern = [
                    [1,0,1,1,0,1,1,1,1,1],
                    [1,0,0,0,1,1,1,0,1,1],
                    [1,1,1,1,1,0,0,1,1,1],
                    [0,0,1,1,1,1,1,0,1,1],
                    [1,0,1,0,0,0,1,0,1,0],
                    [1,1,0,1,1,1,1,1,1,1],
                    [1,0,1,1,0,1,1,0,1,1]
                ];

                (function tick() {
                    var now = new Date();

                    var time_left = parseInt(Math.abs(endtime_obj-now)/1000)
                    var hours = parseInt(parseInt(time_left/3600)%24),
                        minutes =  parseInt(parseInt(time_left/60) % 60),
                        seconds = parseInt(time_left % 60);

                    digit = digit.data([hours / 10 | 0, hours % 10, minutes / 10 | 0, minutes % 10, seconds / 10 | 0, seconds % 10]);
                    digit.select("path:nth-child(1)").classed("lit", function(d) { return digitPattern[0][d]; });
                    digit.select("path:nth-child(2)").classed("lit", function(d) { return digitPattern[1][d]; });
                    digit.select("path:nth-child(3)").classed("lit", function(d) { return digitPattern[2][d]; });
                    digit.select("path:nth-child(4)").classed("lit", function(d) { return digitPattern[3][d]; });
                    digit.select("path:nth-child(5)").classed("lit", function(d) { return digitPattern[4][d]; });
                    digit.select("path:nth-child(6)").classed("lit", function(d) { return digitPattern[5][d]; });
                    digit.select("path:nth-child(7)").classed("lit", function(d) { return digitPattern[6][d]; });
                    separator.classed("lit", seconds & 1);

                    setTimeout(tick, 1000 - now % 1000);
                })();
            }

        $scope.taskclick = function(taskName,companyName,task){
            //if (task.status == "completed" && task.taskName != 'End Period'){
            // notificationToast({"message":"Task : " +task.taskName + " has been done and you can not do it twice."})
            // }
            //else{

           // console.log(taskName,companyName,task)
            //console.log(['01005','02001','03001','05008'].indexOf(taskName))

            if (['01005'].indexOf(taskName)>=0){negotiatefn(task);}
            if (['01002','02002','03002','04002','05002','06002','07002'].indexOf(taskName)>=0){workforcefn(task);}
            //if (['01100','02100','03100','04100','05100','06100','07100'].indexOf(taskName)>=0){endperiodfn();}
            if (['03005'].indexOf(taskName)>=0){negotiate2fn(task);}
            if (['10001','10002','10003','10004','10005','10006','10007'].indexOf(taskName)>=0){forecastfn(task);}

            if (companyName=='NewCo'){
                if (['01001','02001','03001','05001'].indexOf(taskName)>=0){hiringfn(task);}
                if (['03003','04003','05003','07003'].indexOf(taskName)>=0){resourcesfn(task);}
                if (['04004','05004','06004','07004'].indexOf(taskName)>=0){budgetfn(task);}
                if (['02005'].indexOf(taskName)>=0){visionarycompetitionfn(task);}
                if (['04005'].indexOf(taskName) >= 0) {
                    projectfn(task);
                }
                if (['04006','05006','06006','07006'].indexOf(taskName)>=0){actionsfn(task);}
                if (['04008','05008'].indexOf(taskName)>=0){nichesfn(task);}
                if (['04009'].indexOf(taskName) >= 0) {
                    corporateacquisitionsfn(task);
                }
            }
            if (companyName=='LegacyCo'){
                if (['01001', '03001', '04001', '05001'].indexOf(taskName) >= 0) {
                    hiringfn(task);
                }
                if (['01003', '02003', '03003', '04003', '05003', '06003'].indexOf(taskName) >= 0) {
                    resourcesfn(task);
                }
                if (['01004','02004','03004','04004','05004','06004','07004'].indexOf(taskName)>=0){budgetfn(task);}
                if (['02005','04005'].indexOf(taskName)>=0){projectfn(task);}
                if (['01006','02006','03006','04006','05006','06006','07006'].indexOf(taskName)>=0){actionsfn(task);}
                if (['04008','05008'].indexOf(taskName)>=0){nichesfn(task);}
                if (['05009','06009','07009'].indexOf(taskName)>=0){corporateacquisitionsfn(task);}
            }
            $mdSidenav('taskslist').close()
        }
        // }
            $scope.info = function (menuid) {
                $scope.selectedTabs = 0
                $http.get('/api/general/instruction')

                    .success(function (list) {
                        // console.log(list)
                        $scope.instructionpdfs = []
                        $scope.instructionMaterial = []
                    if (list) {
                        list.forEach(function (d) {
                            // d.companyName == $rootScope.user_info.companyInfo.companyName
                            if (d.content_type == 'application/pdf' && d.companyName == $rootScope.user_info.companyInfo.companyName) {

                                if (d.selectedTabs == 0) {
                                    $scope.instructionpdfs.push(d)
                                }
                                else {
                                    $scope.instructionMaterial.push(d)
                                }

                            }
                            // else {
                            //     $scope.instructionMeterial[1].push(d)
                            // }
                        })
                    }


                })
                $mdDialog.cancel()
                $mdSidenav(menuid).toggle();
            };
            $scope.infoClick = function (infoFile) {
                instructionFn(infoFile, $scope.info, 'info')
                $mdSidenav('info').close();
            }

            $scope.addContent = function (file) {
                //console.log('addContent',$scope.selectedTabs)
                Upload.upload({
                    url: '/files/upload',
                    data: {files: file}
                }).then(function (response) {

                    if (response.data && response.data[0] != undefined) {
                        response.data[0].companyName = $rootScope.user_info.companyInfo.companyName
                        response.data[0].period = parseInt($rootScope.user_info.companyInfo.currentPeriod)
                        // console.log(response.data[0])
                        response.data[0].selectedTabs = $scope.selectedTabs
                        $http({
                                method: 'POST',
                                url: "/api/general/instruction",
                                data: {
                                    file: response.data[0]
                                }
                    }
                        ).success(function (list) {
                            // console.log(list)
                            //$scope.instructionMeterial = [[], []]
                            $scope.instructionpdfs = []
                            $scope.instructionMaterial = []
                            if (list) {
                                list.forEach(function (d) {
                                    if (d.content_type == 'application/pdf' && d.companyName == $rootScope.user_info.companyInfo.companyName) {
                                        if (d.selectedTabs == 0) {
                                            $scope.instructionpdfs.push(d)
                                        }
                                        else {
                                            $scope.instructionMaterial.push(d)
                                        }
                                    }
                                    // else {
                                    //     $scope.instructionMeterial[1].push(d)
                                    // }
                                })
                            }
                            $rootScope.notificationToast('Instruction material uploaded.')
                })
                    }


                });
            }
            $scope.deleteContent = function (file) {
                //console.log(file)
                $http({
                        method: 'POST',
                        url: "/api/general/deleteinstruction",
                        data: {
                            file: file
                        }
                    }
                ).success(function (list) {
                    //console.log(list)
                    // $scope.instructionMeterial = [[], []]
                    $scope.instructionpdfs = []
                    $scope.instructionMaterial = []

                    if (list) {
                        list.forEach(function (d) {
                            if (d.content_type == 'application/pdf' && d.companyName == $rootScope.user_info.companyInfo.companyName) {
                                if (d.selectedTabs == 0) {
                                    $scope.instructionpdfs.push(d)
                                }
                                else {
                                    $scope.instructionMaterial.push(d)
                                }
                            }
                            // else {
                            //     $scope.instructionMeterial[1].push(d)
                            // }
                        })
                    }
                    $rootScope.notificationToast('Instruction material deleted.')
                })

            }

            $scope.accountBudget = function () {
                console.log('budget')
                // Show the dialog
                $mdSidenav('budget').toggle();

                $http.get("/api/account/accountbudget", {params: {username: $rootScope.current_user.username}})
                    .success(function (res) {
                        console.log(res)
                        $scope.current_budget = res
                        $scope.current_budget.forEach(function (d) {
                            d['currentValue_text'] = formatNum(d['currentValue'].toFixed())
                        })
                    })
                $scope.current_index = -1
                $scope.budget_input = function (index, budget) {
                    console.log(index, budget)

                    $scope.current_index = index
                }
                $scope.$watchCollection('current_index', function (newVal, oldVal) {
                    if (oldVal != undefined && newVal != oldVal) {
                        // console.log( oldVal)
                        if (oldVal != -1) {
                            $http.post('/api/account/accountbudget', $scope.current_budget[oldVal]).success(function (res) {
                                //    console.log(res)
                            })
                        }

            }
                })

            }

        function joinTeam() {
            // Show the dialog
            $mdDialog.show({
                clickOutsideToClose: true,
                bindToController: true,
                controller: joinTeamCtrl,
                parent: angular.element(document.body),
                templateUrl: '/api/dtools/getpage?pagename=jointeam'
            });


            function joinTeamCtrl ($scope,$mdDialog,$http) {
                $scope.cancel = function () {
                    $mdDialog.cancel();
                };
                $scope.submit = function (teams,companies) {
                    selectedTeam=[]
                    teams.forEach(function(d){
                        if (d.selected) {
                            selectedTeam.push(d)
                        }

                    })
                    selectedCompany=[]
                    companies.forEach(function(d){
                        if (d.userrole) {
                            selectedCompany.push(d)
                        }

                    })

                    //console.log(current_user,selectedTeam)
                    if (selectedTeam.length == 1 && selectedCompany.length == 1){
                        //console.log(selectedTeam)
                        $http({
                                method:'POST',
                                url:"/api/dtools/jointeam",
                                data:{
                                    username: $rootScope.current_user.username,
                                    //taskID:task.taskID,
                                    companyName :selectedCompany[0].companyName,
                                    teamName : selectedTeam[0].teamName,
                                    //period:task.period,
                                    data:{username:$rootScope.current_user.username,
                                        teamName:selectedTeam[0].teamName,
                                        companyName: selectedCompany[0].companyName,
                                        userrole: selectedCompany[0].userrole}
                                }
                            }
                        )
                      .success(function(d){

                            $mdDialog.cancel();
                            $mdSidenav('taskslist').close()
                            $window.location.href = '/'
                          $rootScope.notificationToast("Join to Team " + selectedTeam[0].teamName)
                        })
                    }
                    else{
                        $scope.message=="Please select one and only one team."
                        $rootScope.notificationToast($scope.message)
                        joinTeam()
                    }


                };
                //get init data
                $http({
                        method:'GET',
                        url:"/api/dtools/jointeam",

                    }
                ).success(function(d){
                    //console.log(d)
                    $scope.teams = d
                    $scope.roles =('CEO CFO COO CMO').split(' ').map(function (role) { return { userrole: role }; });
                    $scope.companies = [
                        {
                            companyName: 'LegacyCo',
                            niches: 'electronic',
                            logo: '',
                            calculate:true
                        },
                        {
                            companyName: 'NewCo',
                            niches: 'electronic',
                            logo: '',
                            calculate:false
                        },
                    ];

                })

            }


        }
        function hiringfn(task) {
            // Show the dialog
            $mdDialog.show({
                clickOutsideToClose: false,
                bindToController: true,
                controller: hiringCtrl,
                templateUrl: '/api/dtools/getpage?pagename=hiring',
                locals:{func:instructionFn,timer:timerFn}
            });

            function hiringCtrl ($scope,$rootScope,$mdDialog,$http,$timeout,func,timer,Upload) {
                // console.log($rootScope.current_user.permission=='0')
                $scope.superuser = $rootScope.current_user.permission == '0'
                $scope.notpemission = function () {
                    $rootScope.notificationToast("You are not permited.")
                }
                $scope.instruction = function () {
                    $http({
                            method: 'GET',
                            url: "/api/dtools/gettaskfile",
                            params: {
                                task_id: task._id
                            }
                        }
                    ).success(function (d) {
                        func(d, hiringfn, task)
                    })

                }


                $scope.openResume = function (resumefile) {
                    console.log(resumefile)
                    if (resumefile) {
                        func(resumefile, hiringfn, task)
                    }

                }

                $scope.close = function () {
                    $mdDialog.cancel();
                };
                $scope.submit = function () {
                    var offeredEmployees=[]
                    $scope.employees_keys.forEach(function (key) {
                        $scope.employees[key].forEach(function (e) {
                            if (e.salaryOffer) {

                                offeredEmployees.push(e)

                            }
                        })
                    })

                    // if (employees.dc.length > 0) employees.dc.forEach(function(d){if (d.salaryOffer) {offeredEmployees.push(d)}})
                    // if (employees.lc.length > 0) employees.lc.forEach(function(d){if (d.salaryOffer) {offeredEmployees.push(d)}})
                    // if (employees.li.length > 0) employees.li.forEach(function(d){if (d.salaryOffer) {offeredEmployees.push(d)}})
                    // if (employees.ma.length > 0) employees.ma.forEach(function(d){if (d.salaryOffer) {offeredEmployees.push(d)}})
                    // if (employees.ms.length > 0) employees.ms.forEach(function(d){if (d.salaryOffer) {offeredEmployees.push(d)}})
                    // if (employees.pd.length > 0) employees.pd.forEach(function(d){if (d.salaryOffer) {offeredEmployees.push(d)}})
                    // if (employees.sd.length > 0) employees.sd.forEach(function(d){if (d.salaryOffer) {offeredEmployees.push(d)}})

                    console.log(offeredEmployees)
                    $mdDialog.show(
                        $mdDialog.confirm()
                            .title('Confirm')
                            .content('You made offers to  ' + offeredEmployees.length +"  candidates?")
                            .ariaLabel('Confirm')
                            .ok('OK')
                            .cancel('Cancel')

                    ).then(function(d){
                     //  $http.post('server/hiring',data={username:$rootScope.current_user.username,employees:offeredEmployees})
                        $http({
                                method:'POST',
                                url:"/api/dtools/hiring",
                                data:{
                                    username: $rootScope.current_user.username,
                                    taskID:task.taskID,
                                    companyName :task.companyName,
                                    teamName : task.teamName,
                                    period:task.period,
                                    offer:offeredEmployees
                                }
                            }
                        )

                            .success(function(d){
                            //console.log(d)
                                //$window.location.reload();
                                $rootScope.user_info.companyInfo.currentPeriod = d.currentPeriod
                                getInitData()
                        })
                        $mdDialog.cancel();
                        $mdSidenav('taskslist').close()

                        //$rootScope.notificationToast("You made offers to  " + offeredEmployees.length + "  candidates.")
                        $rootScope.sendMessage($rootScope.current_user.username + " made offers to  " + offeredEmployees.length + "  candidates.")

                    },function(){
                        hiringfn($event)
                    })
                };


                var getInitData = function () {
                    $http({
                            method: 'GET',
                            url: "/api/dtools/hiring",
                            params: {
                                username: $rootScope.current_user.username,
                                taskID: task.taskID,
                                companyName: task.companyName,
                                teamName: task.teamName,
                                period: task.period
                            }
                        }
                    )
                        .success(function (d) {
                            console.log(d)
                            $scope.employees = d
                            $scope.employees_keys = Object.keys(d)
                            $scope.employees_keys.forEach(function (key) {
                                $scope.employees[key].forEach(function (e) {

                                    if (e.photo) {
                                        e.url = "/files/download?filename=" + e.photo['filename'] +
                                            "&id=" + e.photo['objectID'] + "&ctype=" + e.photo['content_type']
                                    }
                                    // e.salaryOffer_t = e.minimumSalary == undefined? 0:formatNum(parseInt(e.minimumSalary))
                                    // e.salaryOffer = e.minimumSalary
                                })
                            })

                        })
                }
                getInitData()
                $timeout(function () {
                    timer('2016-09-22 01:01:38')
                }, 1000)

                $scope.photoUpload = function (file, employeeid, type) {
                    Upload.upload({
                        url: '/files/upload',
                        data: {files: file}
                    }).then(function (response) {
                        console.log(response)
                        $http({
                                method: 'POST',
                                url: "/api/dtools/uploademployeephoto",
                                data: {
                                    employeeid: employeeid,
                                    type: type,
                                    photo: response.data[0]
                                }
                            }
                        ).success(function () {
                            getInitData()
                            $rootScope.notificationToast('File uploaded.')
                        })

                    });
                }


                $scope.fileSelected=function(file) {
                  // var fileID =  fileUpload(file)
                  //   console.log(fileID)
                    Upload.upload({
                        url: '/files/upload',
                        data: {files: file}
                    }).then(function (response) {
                        $http({
                                method:'POST',
                                url:"/api/dtools/updatetaskfile",
                                data:{
                                    task_id:task._id,
                                    infoFile:response.data[0]
                                }
                            }
                        ).success(function () {
                                $rootScope.tasklists.forEach(function (t) {
                                    if (t._id == task._id){
                                        t.infoFile = response.data[0]
                                    }
                                })
                                $rootScope.notificationToast('File uploaded.')
                        })

                    });
                }

            }

        }
        function resourcesfn(task) {

            // Show the dialog
            $mdDialog.show({
                clickOutsideToClose: false,
                bindToController: true,
                controller:resourcesCtrl,
                controllerAs: 'dialog',
                templateUrl: '/api/dtools/getpage?pagename=resources',
                locals:{func:instructionFn,timer:timerFn}
            });

            function resourcesCtrl ($scope,$rootScope,$mdDialog,$http,$timeout,func,timer,Upload) {
                $scope.superuser = $rootScope.current_user.permission == '0'
                $scope.notpemission = function () {
                    $rootScope.notificationToast("You are not permited.")
                }
                $scope.instruction = function () {
                    console.log(task)
                    $http({
                            method: 'GET',
                            url: "/api/dtools/gettaskfile",
                            params: {
                                task_id: task._id
                            }
                        }
                    ).success(function (d) {
                        func(d, resourcesfn, task)
                    })

                }
                $scope.close = function () {
                    $mdDialog.cancel();
                };
                $scope.selectedResources = {ls:[],ma:[],sa:[],su:[],li:[],pd:[]};
                $scope.toggle = function (item,list,type) {
                    var idx = list[type].indexOf(item);
                    if (idx > -1) {list[type].splice(idx, 1);}
                    else {
                        if (list[type].length >= 3) {
                            $rootScope.notificationToast("You can only choose three resources.")
                        }
                        else {
                            list[type].push(item);
                        }
                    }

                };
                $scope.exists = function (item, list, type) {
                    return list[type].indexOf(item) > -1;
                };
                $scope.submit = function () {
                    $http({
                            method:'POST',
                            url:"/api/dtools/resource",
                            data:{
                                username: $rootScope.current_user.username,
                                taskID:task.taskID,
                                companyName :task.companyName,
                                teamName : task.teamName,
                                period:task.period,
                                selectedResources:$scope.selectedResources
                            }
                        }
                    )
                        .success(function(d){
                            console.log(d)
                            $rootScope.user_info.companyInfo.currentPeriod = d.currentPeriod
                            $rootScope.notificationToast("Submit application for resources.")
                    })

                    $mdDialog.cancel();
                    $mdSidenav('taskslist').close()
                    $window.location.reload();
                };

                var getInitData = function () {

                    $http({
                        method: 'GET',
                        url: "/api/dtools/resource",
                        params: {
                            username: $rootScope.current_user.username,
                            taskID: task.taskID,
                            companyName: task.companyName,
                            teamName: task.teamName,
                            period: task.period
                        }
                        }
                    ).success(function (d) {
                        console.log(d)
                        $scope.resources_ls = d.data.filter(function (e) {
                            return e.resourceType == "Lobbyist"
                        })
                        $scope.resources_ma = d.data.filter(function (e) {
                            return e.resourceType == "AD&DM"
                        })
                        $scope.resources_sa = d.data.filter(function (e) {
                            return e.resourceType == "Distribution Partners"
                        })
                        $scope.resources_su = d.data.filter(function (e) {
                            return e.resourceType == "Call Centre (inbound)"
                        })
                        $scope.resources_li = d.data.filter(function (e) {
                            return e.resourceType == "Production Outsourcer"
                        })
                        $scope.resources_pd = d.data.filter(function (e) {
                            return e.resourceType == "Development Partners"
                        })

                    })
                }

                getInitData()

                $scope.openInfo = function (infofile) {
                    console.log(infofile)
                    if (infofile) {
                        func(infofile, resourcesfn, task)
                    }

                }

                $scope.infoFileUpload = function (file, resourceid) {
                    Upload.upload({
                        url: '/files/upload',
                        data: {files: file}
                    }).then(function (response) {
                        console.log(response)
                        $http({
                                method: 'POST',
                                url: "/api/dtools/uploadresourceinfofile",
                                data: {
                                    resourceid: resourceid,
                                    infoFile: response.data[0]
                                }
                            }
                        ).success(function () {
                            getInitData()
                            $rootScope.notificationToast('File uploaded.')
                        })

                    });
                }


                $scope.fileSelected=function(file) {
                    // var fileID =  fileUpload(file)
                    //   console.log(fileID)
                    Upload.upload({
                        url: '/files/upload',
                        data: {files: file}
                    }).then(function (response) {
                        $http({
                                method:'POST',
                                url:"/api/dtools/updatetaskfile",
                                data:{
                                    task_id:task._id,
                                    infoFile:response.data[0]
                                }
                            }
                        ).success(function () {
                                $rootScope.tasklists.forEach(function (t) {
                                    if (t._id == task._id){
                                        t.infoFile = response.data[0]
                                    }
                                })
                                $rootScope.notificationToast('File uploaded.')
                            }

                        )

                    });
                }
            }
        }
        function workforcefn(task) {

            $mdDialog.show({
                clickOutsideToClose: false,
                bindToController: true,
                controller: workforceCtrl,
                controllerAs: 'dialog',
                templateUrl:  '/api/dtools/getpage?pagename=workforce',
                locals:{func:instructionFn,timer:timerFn}
            });

            function workforceCtrl($scope, $rootScope, $mdDialog, $http, $timeout, func, timer, Upload) {
                $scope.superuser = $rootScope.current_user.permission == '0'
                $scope.legacyco = $rootScope.user_info.companyInfo.companyName == 'LegacyCo'
                $scope.notpemission = function () {
                    $rootScope.notificationToast("You are not permited.")
                }
                $scope.instruction = function () {

                    $http({
                            method: 'GET',
                            url: "/api/dtools/gettaskfile",
                            params: {
                                task_id: task._id
                            }
                        }
                    ).success(function (d) {
                        func(d, workforcefn, task)
                    })

                }
                $scope.close = function () {
                    $mdDialog.cancel();
                };
                $scope.selectedIndex =0

                $http({
                        method:'GET',
                        url:"/api/dtools/workforce",
                        params:{
                            username: $rootScope.current_user.username,
                            taskID:task.taskID,
                            companyName :task.companyName,
                            teamName : task.teamName,
                            period:task.period
                        }
                    }
                )
                    .success(function(d){
                        // console.log(d)
                    if (d){
                        d.forecast.b2b = d.forecast.b2b ? d.forecast.b2b : 0
                        d.forecast.b2c = d.forecast.b2c ? d.forecast.b2c : 0
                        d.forecast.newoffering = d.forecast.newoffering ? d.forecast.newoffering : 0
                        var forecast = d.forecast.b2b + d.forecast.b2c + d.forecast.newoffering
                        //console.log(forecast)
                        d.workforce_def.forEach(function (dv) {


                            var v = d.valueatstart.filter(function (sv) {
                                    return sv.functions == dv.functions
                                })

                            if (v.length > 0) {
                                dv.valueatstart_core = parseInt(v[0].adjustedworkforce_core)
                                dv.valueatstart_contract = parseInt(v[0].adjustedworkforce_contract)
                                dv.valueatstart_total = parseInt(v[0].adjustedworkforce_total)
                                }
                                else {
                                    dv.valueatstart_core = 0
                                    dv.valueatstart_contract = 0
                                    dv.valueatstart_total = 0


                                if (task.period == 1 && task.companyName == 'LegacyCo') {
                                    if (dv.functions == 'Leadship') {
                                        dv.valueatstart_total = 10, dv.valueatstart_core = 10, dv.valueatstart_contract = 0
                                    }
                                    if (dv.functions == 'Logistics') {
                                        dv.valueatstart_total = 369, dv.valueatstart_core = 369, dv.valueatstart_contract = 0
                                    }
                                    if (dv.functions == 'Marketing') {
                                        dv.valueatstart_total = 492, dv.valueatstart_core = 487, dv.valueatstart_contract = 5
                                    }
                                    if (dv.functions == 'Sales') {
                                        dv.valueatstart_total = 164, dv.valueatstart_core = 82, dv.valueatstart_contract = 82
                                    }
                                    if (dv.functions == 'Product Development') {
                                        dv.valueatstart_total = 123, dv.valueatstart_core = 123, dv.valueatstart_contract = 0
                                    }
                                    if (dv.functions == 'Social Media') {
                                        dv.valueatstart_total = 35, dv.valueatstart_core = 24, dv.valueatstart_contract = 11
                                    }
                                }
                                if (task.period == 2 && task.companyName == 'NewCo') {
                                    var pd = d['negotiation']['negotiation']['funding']['additinalProductDeveloperNumber']
                                    pd = pd ? pd : 0
                                    var sl = d['negotiation']['negotiation']['funding']['additinalSalesNumber']
                                    sl = sl ? sl : 0

                                    if (dv.functions == 'Sales') {
                                        dv.valueatstart_total = sl, dv.valueatstart_core = parseInt(sl / 2), dv.valueatstart_contract = parseInt(sl / 2)
                                    }
                                    if (dv.functions == 'Product Development') {
                                        dv.valueatstart_total = pd, dv.valueatstart_core = pd, dv.valueatstart_contract = 0
                                    }

                                }
                            }


                        })


                        for (i=0;i<d.workforce_def.length;i++){
                          //  d.workforce_def[i].valueatstart_core = 0
                           // d.workforce_def[i].valueatstart_contract = 0
                            //d.workforce_def[i].valueatstart_total =  d.workforce_def[i].valueatstart_core+ d.workforce_def[i].valueatstart_contract

                            d.workforce_def[i].recommended_core =parseInt(forecast/(d.workforce_def[i].recommend_base)*(d.workforce_def[i].coreEmployeeRate))
                            d.workforce_def[i].recommended_contract =parseInt( forecast/(d.workforce_def[i].recommend_base)*(1-d.workforce_def[i].coreEmployeeRate))
                        }
                        $scope.workforce = d.workforce_def
                        //console.log($scope.workforce )
                    }

                })
                $scope.$watch('workforce',function (nVal,oVal) {

                 if (nVal != undefined){
                     $scope.workforce.forEach(function (wf) {

                         if (wf.adjustment_core != undefined || wf.adjustment_contract != undefined){
                             wf.adjustment_core = wf.adjustment_core == undefined? 0: wf.adjustment_core
                             wf.adjustment_contract = wf.adjustment_contract == undefined? 0: wf.adjustment_contract

                             wf.adjustment_total =wf.adjustment_core + wf.adjustment_contract

                             wf.adjustedworkforce_core = formatNum(wf.valueatstart_core + wf.adjustment_core)
                             wf.adjustedworkforce_contract = formatNum(wf.valueatstart_contract + wf.adjustment_contract)
                             wf.adjustedworkforce_total = formatNum(wf.valueatstart_total + wf.adjustment_total)


                             wf.adjustmentcost_core = formatNum((wf.avWage + wf.avExpense) * wf.adjustment_core *
                                 (wf.adjustment_core > 0 ? wf.costOfHire : (wf.costOfFire * (-1))))
                             wf.adjustmentcost_contract = formatNum((wf.avWage + wf.avExpense) * wf.adjustment_contract *
                                 (wf.adjustment_contract > 0 ? wf.costOfHire : (wf.costOfFire * (-1))))
                             wf.adjustmentcost_total = formatNum((wf.avWage + wf.avExpense) * wf.adjustment_total
                                 * (wf.adjustment_total > 0 ? wf.costOfHire : (wf.costOfFire * (-1))))

                             wf.adjustwages_core = formatNum(wf.avWage * (wf.valueatstart_core + wf.adjustment_core))
                             wf.adjustwages_contract = formatNum(wf.avWage * (wf.valueatstart_contract + wf.adjustment_contract))
                             wf.adjustwages_total = formatNum(wf.avWage * (wf.valueatstart_total + wf.adjustment_total))

                             wf.adjustexpenses_core = formatNum(wf.avExpense * (wf.valueatstart_core + wf.adjustment_core))
                             wf.adjustexpenses_contract = formatNum(wf.avExpense * (wf.valueatstart_contract + wf.adjustment_contract))
                             wf.adjustexpenses_total = formatNum(wf.avExpense * (wf.valueatstart_total + wf.adjustment_total))

                             wf.workforcecost_total = formatNum((wf.avWage + wf.avExpense) * (wf.valueatstart_total + wf.adjustment_total)
                                 + (wf.avWage + wf.avExpense) * wf.adjustment_total * (wf.adjustment_total > 0 ? wf.costOfHire : (wf.costOfFire * (-1))))
                         }
                     })
                 }


                }, true)

                $scope.submit = function (workforce) {
                    $http({
                            method:'POST',
                            url:"/api/dtools/workforce",
                            data:{
                                username: $rootScope.current_user.username,
                                taskID:task.taskID,
                                companyName :task.companyName,
                                teamName : task.teamName,
                                period:task.period,
                                workforce:workforce
                            }
                        }
                    )
                   .success(function(d){
                       //$window.location.reload();
                       $rootScope.user_info.companyInfo.currentPeriod = d.currentPeriod
                   })
                    $mdDialog.cancel();
                    $mdSidenav('taskslist').close()
                    $rootScope.sendMessage($rootScope.current_user.username + " submitted application for workforce.")

                    $rootScope.notificationToast("Submitted application for workforce.")

                };
                $timeout(function () {
                    timer('2016-09-26 01:01:38')
                },1000)

                $scope.fileSelected=function(file) {
                    // var fileID =  fileUpload(file)
                    //   console.log(fileID)
                    Upload.upload({
                        url: '/files/upload',
                        data: {files: file}
                    }).then(function (response) {
                        $http({
                                method:'POST',
                                url:"/api/dtools/updatetaskfile",
                                data:{
                                    task_id:task._id,
                                    infoFile:response.data[0]
                                }
                            }
                        ).success(function () {
                                $rootScope.tasklists.forEach(function (t) {
                                    if (t._id == task._id){
                                        t.infoFile = response.data[0]
                                    }
                                })
                                $rootScope.notificationToast('File uploaded.')
                            }

                        )

                    });
                }

            }
        }
        function budgetfn(task) {

            // Show the dialog
            $mdDialog.show({
                clickOutsideToClose: false,
                bindToController: true,
                controller: budgetCtrl,
                controllerAs: 'dialog',
                templateUrl:  '/api/dtools/getpage?pagename=budget',
                locals:{func:instructionFn,timer:timerFn}
            });

            function budgetCtrl ($scope,$rootScope,$mdDialog,$http,$timeout,func,timer,Upload) {
                $scope.superuser = $rootScope.current_user.permission == '0'
                $scope.notpemission = function () {
                    $rootScope.notificationToast("You are not permited.")
                }
                $scope.instruction = function () {

                    $http({
                            method: 'GET',
                            url: "/api/dtools/gettaskfile",
                            params: {
                                task_id: task._id
                            }
                        }
                    ).success(function (d) {
                        func(d, budgetfn, task)
                    })

                }
                //console.log($rootScope.userAtCompany.companyName,$rootScope.userAtCompany.currentPeriod )
                $scope.if_show = function(company){
                    return $rootScope.user_info.companyInfo.companyName == company || ($rootScope.user_info.companyInfo.companyName == 'LegacyCo' && $rootScope.user_info.companyInfo.currentPeriod >= 5)
                }
                //if ($rootScope.userAtCompany.companyName=='NewCo'){$scope.newco_show = true }
                //if ($rootScope.userAtCompany.companyName=='LegacyCo'){$scope.legacyco_show = true }
                $scope.acc_budget ={}
                $scope.close = function () {
                    $mdDialog.cancel();
                };
                $scope.submit = function (acc_budget,event) {
                    console.log(acc_budget)
                    //$http.post('server/budget',data={username:$rootScope.current_user.username,acc_budgets:acc_budget})
                    $http({
                            method:'POST',
                            url:"/api/dtools/budget",
                            data:{
                                username: $rootScope.current_user.username,
                                taskID:task.taskID,
                                companyName :task.companyName,
                                teamName : task.teamName,
                                period:task.period,
                                acc_budgets:acc_budget
                            }
                        }
                    )
                        .success(function(d){
                        console.log(d)
                            $rootScope.user_info.companyInfo.currentPeriod = d.currentPeriod
                            // $window.location.reload();
                    })
                    $mdDialog.cancel();
                    $mdSidenav('taskslist').close()
                    $rootScope.notificationToast("Submitted application.")
                };
                $timeout(function () {
                    timer('2016-09-16 01:01:38')
                },1000)

                $scope.fileSelected=function(file) {
                    // var fileID =  fileUpload(file)
                    //   console.log(fileID)
                    Upload.upload({
                        url: '/files/upload',
                        data: {files: file}
                    }).then(function (response) {
                        $http({
                                method:'POST',
                                url:"/api/dtools/updatetaskfile",
                                data:{
                                    task_id:task._id,
                                    infoFile:response.data[0]
                                }
                            }
                        ).success(function () {
                                $rootScope.tasklists.forEach(function (t) {
                                    if (t._id == task._id){
                                        t.infoFile = response.data[0]
                                    }
                                })
                                $rootScope.notificationToast('File uploaded.')
                            }

                        )

                    });
                }
            }
        }
        function negotiatefn(task) {
            // Show the dialog

            $mdDialog.show({
                clickOutsideToClose: false,
                bindToController: true,
                controller: negotiateCtrl,
                controllerAs: 'dialog',
                templateUrl:  '/api/dtools/getpage?pagename=negotiation1',
                locals:{func:instructionFn,timer:timerFn}
            });

            function negotiateCtrl ($scope,$rootScope,$mdDialog,$http,$timeout,func,timer,Upload) {
                $scope.superuser = $rootScope.current_user.permission == '0'
                $scope.notpemission = function () {
                    $rootScope.notificationToast("You are not permited.")
                }
                $scope.instruction = function () {

                    $http({
                            method: 'GET',
                            url: "/api/dtools/gettaskfile",
                            params: {
                                task_id: task._id
                            }
                        }
                    ).success(function (d) {
                        func(d, negotiatefn, task)
                    })

                }
                $scope.close = function () {
                    $mdDialog.cancel();
                };
                //console.log($rootScope.userAtCompany.currentPeriod == 1)
                $scope.currentPeriod = $rootScope.user_info.companyInfo.currentPeriod
                $scope.companyName = $rootScope.user_info.companyInfo.companyName
                $scope.selectedEmployees = [];
                //console.log($scope.selectedEmployees)
                $scope.toggle = function (item, list) {
                    console.log(item)
                    var result = false, idx = -1
                    if (list.length > 0) {
                        list.forEach(function (l, i) {

                            if (l._id == item._id) {
                                idx = i
                                result = true
                            }
                        })
                    }


                    // var idx = list.indexOf(item);
                    if (idx > -1) {
                        list.splice(idx, 1);
                    }
                    else {
                        list.push(item);

                        // $scope.technicalExperts = item.technicalExperts
                        // //console.log(list)
                        //
                        // $scope.calculatedValues={'marketingLoss':1,'developmentLoss':1,'marketingGain':1,"developmentGain":1}
                        //
                        // list.forEach(function(d) {
                        //     $scope.calculatedValues.marketingLoss = $scope.calculatedValues.marketingLoss * d.marketingLoss
                        //     $scope.calculatedValues.developmentLoss = $scope.calculatedValues.developmentLoss * d.developmentLoss
                        //     $scope.calculatedValues.marketingGain = $scope.calculatedValues.marketingGain * d.marketingGain
                        //     $scope.calculatedValues.developmentGain = $scope.calculatedValues.developmentLoss * d.developmentGain
                        // })
                        // $scope.calculatedValues.marketingLoss =($scope.calculatedValues.marketingLoss*100).toFixed(2)
                        // $scope.calculatedValues.developmentLoss =($scope.calculatedValues.developmentLoss*100).toFixed(2)
                        // $scope.calculatedValues.marketingGain =($scope.calculatedValues.marketingGain*100).toFixed(2)
                        // $scope.calculatedValues.developmentGain =($scope.calculatedValues.developmentGain*100).toFixed(2)
                        //
                        // var sumInfluence={'VRKidEd':0,"GovVR":0,"VRGames":0,"MilitaryVR":0,"AdEdVR":0,"VRCinema":0}
                        //
                        // list.forEach(function(d){
                        //
                        //     if(d.category == "ProductDeveloper"){
                        //         console.log('00',d.technicalExperts.sum, d.influenceBVs.VRKidEd)
                        //
                        //         sumInfluence.VRKidEd += d.technicalExperts.sum* d.influenceBVs.VRKidEd
                        //         sumInfluence.GovVR += d.technicalExperts.sum* d.influenceBVs.GovVR
                        //         sumInfluence.VRGames += d.technicalExperts.sum* d.influenceBVs.VRGames
                        //         sumInfluence.MilitaryVR += d.technicalExperts.sum* d.influenceBVs.MilitaryVR
                        //         sumInfluence.AdEdVR += d.technicalExperts.sum* d.influenceBVs.AdEdVR
                        //         sumInfluence.VRCinema += d.technicalExperts.sum* d.influenceBVs.VRCinema
                        //     }
                        //
                        // })
                        // console.log('1',sumInfluence)
                        // $scope.sumInfluenceSales={'VRKidEd':0,"GovVR":0,"VRGames":0,"MilitaryVR":0,"AdEdVR":0,"VRCinema":0}
                        // list.forEach(function(d){
                        //     if(d.category == "Salespeople"){
                        //         $scope.sumInfluenceSales.VRKidEd +=sumInfluence.VRKidEd * d.influenceBVs.VRKidEd
                        //         $scope.sumInfluenceSales.GovVR += sumInfluence.GovVR * d.influenceBVs.GovVR
                        //         $scope.sumInfluenceSales.VRGames += sumInfluence.VRGames * d.influenceBVs.VRGames
                        //         $scope.sumInfluenceSales.MilitaryVR += sumInfluence.MilitaryVR * d.influenceBVs.MilitaryVR
                        //         $scope.sumInfluenceSales.AdEdVR += sumInfluence.AdEdVR * d.influenceBVs.AdEdVR
                        //         $scope.sumInfluenceSales.VRCinema += sumInfluence.VRCinema * d.influenceBVs.VRCinema
                        //     }
                        //
                        // })
                    }


                    $scope.technicalExperts = item.technicalExperts
                    //console.log(list)

                    $scope.calculatedValues = {
                        'marketingLoss': 1,
                        'developmentLoss': 1,
                        'marketingGain': 1,
                        "developmentGain": 1
                    }

                    list.forEach(function (d) {
                        $scope.calculatedValues.marketingLoss = $scope.calculatedValues.marketingLoss * d.marketingLoss
                        $scope.calculatedValues.developmentLoss = $scope.calculatedValues.developmentLoss * d.developmentLoss
                        $scope.calculatedValues.marketingGain = $scope.calculatedValues.marketingGain * d.marketingGain
                        $scope.calculatedValues.developmentGain = $scope.calculatedValues.developmentGain * d.developmentGain
                    })
                    $scope.calculatedValues.marketingLoss = ($scope.calculatedValues.marketingLoss * 100).toFixed(2)
                    $scope.calculatedValues.developmentLoss = ($scope.calculatedValues.developmentLoss * 100 ).toFixed(2)
                    $scope.calculatedValues.marketingGain = ($scope.calculatedValues.marketingGain * 100).toFixed(2)
                    $scope.calculatedValues.developmentGain = ($scope.calculatedValues.developmentGain * 100).toFixed(2)

                    var sumInfluence = {
                        'VRKidEd': 0,
                        "GovVR": 0,
                        "VRGames": 0,
                        "MilitaryVR": 0,
                        "AdEdVR": 0,
                        "VRCinema": 0
                    }
                    list.forEach(function (d) {


                        if (d.category == "ProductDeveloper") {
                            // console.log(JSON.parse(d.technicalExperts.replace("u'","'")), JSON.parse(d.influenceBVs.replace("u'","'")))
                            sumInfluence.VRKidEd += d.technicalExperts.sum * d.influenceBVs.VRKidEd
                            sumInfluence.GovVR += d.technicalExperts.sum * d.influenceBVs.GovVR
                            sumInfluence.VRGames += d.technicalExperts.sum * d.influenceBVs.VRGames
                            sumInfluence.MilitaryVR += d.technicalExperts.sum * d.influenceBVs.MilitaryVR
                            sumInfluence.AdEdVR += d.technicalExperts.sum * d.influenceBVs.AdEdVR
                            sumInfluence.VRCinema += d.technicalExperts.sum * d.influenceBVs.VRCinema
                        }

                    })
                    console.log('2', sumInfluence)
                    $scope.sumInfluenceSales = {
                        'VRKidEd': 0,
                        "GovVR": 0,
                        "VRGames": 0,
                        "MilitaryVR": 0,
                        "AdEdVR": 0,
                        "VRCinema": 0
                    }
                    list.forEach(function (d) {
                        if (d.category == "Salespeople") {
                            $scope.sumInfluenceSales.VRKidEd += sumInfluence.VRKidEd * d.influenceBVs.VRKidEd
                            $scope.sumInfluenceSales.GovVR += sumInfluence.GovVR * d.influenceBVs.GovVR
                            $scope.sumInfluenceSales.VRGames += sumInfluence.VRGames * d.influenceBVs.VRGames
                            $scope.sumInfluenceSales.MilitaryVR += sumInfluence.MilitaryVR * d.influenceBVs.MilitaryVR
                            $scope.sumInfluenceSales.AdEdVR += sumInfluence.AdEdVR * d.influenceBVs.AdEdVR
                            $scope.sumInfluenceSales.VRCinema += sumInfluence.VRCinema * d.influenceBVs.VRCinema
                        }

                    })
                    console.log('3', $scope.sumInfluenceSales)
                };

                $scope.exists = function (item, list) {
                    var result = false
                    if (list.length > 0) {
                        list.forEach(function (l) {
                            if (l._id == item._id) {
                                result = true
                            }
                        })
                    }

                    return result;
                };
                $scope.funding = {additinalProductDeveloperNumber: 0, additinalSalesNumber: 0}

                $scope.submit = function (selectedEmployees,funding,sumInfluenceSales,calculatedValues,action) {

                    //console.log(selectedEmployees,funding)

                    // $http.post('server/negotiation1',data={username:$rootScope.current_user.username,
                    //     selectedEmployees:selectedEmployees,
                    //     funding:funding,sumInfluenceSales:sumInfluenceSales,
                    //     calculatedValues:calculatedValues,action:action})
                    $http({
                            method:'POST',
                            url:"/api/dtools/negotiate1",
                            data:{
                                username: $rootScope.current_user.username,
                                taskID:task.taskID,
                                companyName :task.companyName,
                                teamName : task.teamName,
                                period:task.period,
                                selectedEmployees:selectedEmployees,
                                funding:funding,
                                sumInfluenceSales:sumInfluenceSales,
                                calculatedValues:calculatedValues,
                                action:action
                            }
                        }
                    )

                        .success(function(d){
                        console.log(d)
                            // $window.location.reload();
                            $rootScope.user_info.companyInfo.currentPeriod = d.currentPeriod
                    })
                    $mdDialog.cancel();
                    $mdSidenav('left').close()
                    $rootScope.notificationToast("Submitted application.")
                };
                //$http.get('/server/querywithdata?keyword=allnegotiationhr')

                var getInitData = function () {
                    $http({
                        method: 'GET',
                        url: "/api/dtools/negotiate1",
                        params: {
                            username: $rootScope.current_user.username,
                            taskID: task.taskID,
                            companyName: task.companyName,
                            teamName: task.teamName,
                            period: task.period
                        }
                        }
                    )
                        .success(function (data) {

                            $scope.negotiationhr_sales = []
                            $scope.negotiationhr_pd = []
                            $scope.negotiationhr_te = []
                            data.data.forEach(function (d) {
                                //d.src = '/photo/'+d.employeeName+'.GIF'
                                if (d.photo) {
                                    d.url = "/files/download?filename=" + d.photo['filename'] +
                                        "&id=" + d.photo['objectID'] + "&ctype=" + d.photo['content_type']
                                }

                                if (d.title == "Top Salespeople") {
                                    $scope.negotiationhr_sales.push(d)
                                }
                                else if (d.title == "Technical Experts") {
                                    $scope.negotiationhr_te.push(d)
                                }
                                else {
                                    $scope.negotiationhr_pd.push(d)
                                }

                            })

                            //task data
                            if (data.taskdata != null && data.taskdata.negotiation != null) {
                                $scope.status = data.taskdata.status
                                $scope.selectedEmployees = []
                                data.taskdata.negotiation.selectedEmployees.forEach(function (d) {
                                    //console.log(d)
                                    // if (d.title=="Top Salespeople") {
                                    //     $scope.negotiationhr_sales.forEach(function (e) {
                                    //         //console.log(e.employeeID, d.employeeID,e)
                                    //         if (e.employeeID == d.employeeID) {
                                    //             e.selected = true
                                    //         }
                                    //     })}
                                    // else if (d.title=="Technical Experts"){
                                    //     $scope.negotiationhr_te.forEach(function (e) {
                                    //         if (e.employeeID == d.employeeID) {
                                    //             e.selected = true}
                                    //     })}
                                    // else{$scope.negotiationhr_pd.forEach(function (e) {
                                    //     if (e.employeeID == d.employeeID) {e.selected = true}
                                    // })}

                                    $scope.toggle(d,$scope.selectedEmployees)

                                })

                                $scope.funding =data.taskdata.negotiation.funding
                                $scope.sumInfluenceSales =data.taskdata.negotiation.sumInfluenceSales
                                $scope.calculatedValues =data.taskdata.negotiation.calculatedValues
                                $scope.applyStatus = data.taskdata.status
                            }
                            console.log($scope.selectedEmployees)
                        })
                }
                getInitData()

                $timeout(function () {
                    timer('2016-09-16 01:01:38')
                },1000)

                $scope.photoUpload = function (file, employeeid) {

                    Upload.upload({
                        url: '/files/upload',
                        data: {files: file}
                    }).then(function (response) {
                        console.log(response)
                        $http({
                                method: 'POST',
                                url: "/api/dtools/uploadnegotiationphoto",
                                data: {
                                    employeeid: employeeid,
                                    photo: response.data[0]
                                }
                            }
                        ).success(function () {
                            getInitData()
                            $rootScope.notificationToast('File uploaded.')
                        })

                    });
                }

                $scope.fileSelected=function(file) {
                    // var fileID =  fileUpload(file)
                    //   console.log(fileID)
                    Upload.upload({
                        url: '/files/upload',
                        data: {files: file}
                    }).then(function (response) {
                        $http({
                                method:'POST',
                                url:"/api/dtools/updatetaskfile",
                                data:{
                                    task_id:task._id,
                                    infoFile:response.data[0]
                                }
                            }
                        ).success(function () {
                                $rootScope.tasklists.forEach(function (t) {
                                    if (t._id == task._id){
                                        t.infoFile = response.data[0]
                                    }
                                })
                                $rootScope.notificationToast('File uploaded.')
                            }

                        )

                    });
                }
            }
        }
        function actionsfn(task) {
            // Show the dialog
            $mdDialog.show({
                clickOutsideToClose: false,
                bindToController: true,
                controller: actionsCtrl,
                controllerAs: 'dialog',
                templateUrl:  '/api/dtools/getpage?pagename=action',
                locals:{func:instructionFn,timer:timerFn}
            });

            function actionsCtrl ($scope,$rootScope,$mdDialog,$http,$timeout,func,timer,Upload) {
                $scope.superuser = $rootScope.current_user.permission == '0'
                $scope.notpemission = function () {
                    $rootScope.notificationToast("You are not permited.")
                }
                $scope.instruction = function () {

                    $http({
                            method: 'GET',
                            url: "/api/dtools/gettaskfile",
                            params: {
                                task_id: task._id
                            }
                        }
                    ).success(function (d) {
                        func(d, actionsfn, task)
                    })

                }
                $scope.close = function () {
                    $mdDialog.cancel();
                };
                $scope.selectedActions = [];
                $scope.toggle = function (item, list) {
                    var idx = list.indexOf(item);
                    if (idx > -1) list.splice(idx, 1);
                    else list.push(item);
                };
                $scope.exists = function (item, list) {
                    return list.indexOf(item) > -1;
                };
                $scope.submit = function (event) {
                    $mdDialog.show(
                        $mdDialog.confirm()
                            .title('Confirm')
                            .content('Are you confirm selecting: ' + $scope.selectedActions.length +" Actions")
                            .ariaLabel('Confirm')
                            .ok('OK')
                            .cancel('Cancel')
                            .targetEvent(event)
                    ).then(function(d){
                        // $http.post('server/action',data={username:$rootScope.current_user.username,
                        //     actions:$scope.selectedActions})
                        $http({
                                method:'POST',
                                url:"/api/dtools/actions",
                                data:{
                                    username: $rootScope.current_user.username,
                                    taskID:task.taskID,
                                    companyName :task.companyName,
                                    teamName : task.teamName,
                                    period:task.period,
                                    actions:$scope.selectedActions
                                }
                            }
                        )


                            .success(function(d){
                            console.log(d)
                                $rootScope.user_info.companyInfo.currentPeriod = d.currentPeriod
                            $mdDialog.cancel();
                            $mdSidenav('taskslist').close()
                                //$window.location.reload();
                                $rootScope.notificationToast("Submitted Actions application.")

                            })
                        //$mdDialog.hide();
                    },function(){
                        actionsfn(task)
                    })
                };
              //  $http.get('/server/querywithdata?keyword=allactions')

                $http({
                        method:'GET',
                        url:"/api/dtools/actions",
                        params:{
                            username: $rootScope.current_user.username,
                            taskID:task.taskID,
                            companyName :task.companyName,
                            teamName : task.teamName,
                            period:task.period
                        }
                    }
                )
                    .success(function(d){
                        //console.log(d)
                        $scope.actions = {}
                        if (d.data.length > 0) {
                            d.data.forEach(function (action) {
                                if (Object.keys($scope.actions).indexOf(action.category) < 0) {
                                    $scope.actions[action.category] = []
                                }
                                $scope.actions[action.category].push(action)
                            })
                        }
                        $scope.actionsKeys = Object.keys($scope.actions)


                })


                $scope.fileSelected=function(file) {
                    // var fileID =  fileUpload(file)
                    //   console.log(fileID)
                    Upload.upload({
                        url: '/files/upload',
                        data: {files: file}
                    }).then(function (response) {
                        $http({
                                method:'POST',
                                url:"/api/dtools/updatetaskfile",
                                data:{
                                    task_id:task._id,
                                    infoFile:response.data[0]
                                }
                            }
                        ).success(function () {
                                $rootScope.tasklists.forEach(function (t) {
                                    if (t._id == task._id){
                                        t.infoFile = response.data[0]
                                    }
                                })
                                $rootScope.notificationToast('File uploaded.')
                            }

                        )

                    });
                }
            }
        }
        function projectfn(task) {
            // Show the dialog
            $mdDialog.show({
                clickOutsideToClose: false,
                bindToController: true,
                controller: projectCtrl,
                controllerAs: 'dialog',
                templateUrl:  '/api/dtools/getpage?pagename=project',
                locals:{func:instructionFn,timer:timerFn}
            });

            function projectCtrl ($scope,$rootScope,$mdDialog,$http,$timeout,func,timer,Upload) {
                $scope.superuser = $rootScope.current_user.permission == '0'
                $scope.notpemission = function () {
                    $rootScope.notificationToast("You are not permited.")
                }
                $scope.instruction = function () {

                    $http({
                            method: 'GET',
                            url: "/api/dtools/gettaskfile",
                            params: {
                                task_id: task._id
                            }
                        }
                    ).success(function (d) {
                        func(d, projectfn, task)
                    })

                }
                $scope.close = function () {
                    $mdDialog.cancel();
                };

                $scope.selectedProjects = [];
                $scope.toggle = function (item, list) {
                    var idx = list.indexOf(item);
                    if (idx > -1) list.splice(idx, 1);
                    else list.push(item);
                };
                $scope.exists = function (item, list) {
                    return list.indexOf(item) > -1;
                };
                $scope.submit = function () {
                    $mdDialog.show(
                        $mdDialog.confirm()
                            .title('Confirm')
                            .content('Are you confirm selecting: ' + $scope.selectedProjects.length +" projects")
                            .ariaLabel('Confirm')
                            .ok('OK')
                            .cancel('Cancel')

                    ).then(function(d){
                        // $http.post('server/project',data={username:$rootScope.current_user.username,
                        //     projects:$scope.selectedProjects})
                        $http({
                                method:'POST',
                                url:"/api/dtools/projects",
                                data:{
                                    username: $rootScope.current_user.username,
                                    taskID:task.taskID,
                                    companyName :task.companyName,
                                    teamName : task.teamName,
                                    period:task.period,
                                    projects:$scope.selectedProjects
                                }
                            }
                        )
                            .success(function(d){
                            console.log(d)
                                // $window.location.reload();
                                $rootScope.user_info.companyInfo.currentPeriod = d.currentPeriod
                        })


                        $mdDialog.cancel();
                        $mdSidenav('taskslist').close()
                    },function(){
                        projectfn($event)
                    })

                };
                // $http.get('/server/querywithdata?keyword=allprojects')
                var getInitData = function () {
                    $http({
                        method: 'GET',
                        url: "/api/dtools/projects",
                        params: {
                            username: $rootScope.current_user.username,
                            taskID: task.taskID,
                            companyName: task.companyName,
                            teamName: task.teamName,
                            period: task.period
                        }
                        }
                    )
                        .success(function (d) {
                            console.log(d)
                            $scope.projects = d.data
                            $scope.projects.forEach(function (d) {
                                d.totalCost = d.costAtPeriod2 + d.costAtPeriod3 + d.costAtPeriod4 + d.costAtPeriod5 + d.costAtPeriod6 + d.costAtPeriod7
                                d.elapsedDevTimePeriods = d.finalAtPeriod - d.startAtPeriod
                                if (d.status == "Compulsory") {
                                    $scope.selectedProjects.push(d)
                                }
                            })
                        })
                }

                getInitData()

                $scope.openInfo = function (infofile) {
                    console.log(infofile)
                    if (infofile) {
                        func(infofile, projectfn, task)
                    }

                }

                $scope.infoFileUpload = function (file, projectid) {
                    Upload.upload({
                        url: '/files/upload',
                        data: {files: file}
                    }).then(function (response) {
                        console.log(response)
                        $http({
                                method: 'POST',
                                url: "/api/dtools/uploadprojectinfofile",
                                data: {
                                    projectid: projectid,
                                    infoFile: response.data[0]
                                }
                            }
                        ).success(function () {
                            getInitData()
                            $rootScope.notificationToast('File uploaded.')
                        })

                    });
                }


                $scope.fileSelected=function(file) {
                    // var fileID =  fileUpload(file)
                    //   console.log(fileID)
                    Upload.upload({
                        url: '/files/upload',
                        data: {files: file}
                    }).then(function (response) {
                        $http({
                                method:'POST',
                                url:"/api/dtools/updatetaskfile",
                                data:{
                                    task_id:task._id,
                                    infoFile:response.data[0]
                                }
                            }
                        ).success(function () {
                                $rootScope.tasklists.forEach(function (t) {
                                    if (t._id == task._id){
                                        t.infoFile = response.data[0]
                                    }
                                })
                                $rootScope.notificationToast('File uploaded.')
                            }

                        )

                    });
                }
            }
        }
        function visionarycompetitionfn(task) {
            // Show the dialog
            $mdDialog.show({
                clickOutsideToClose: false,
                bindToController: true,
                controller: visionarycompetitionCtrl,
                controllerAs: 'dialog',
                templateUrl: '/api/dtools/getpage?pagename=visionarycompetition',
                locals: {func: instructionFn, timer: timerFn}
            });

            function visionarycompetitionCtrl($scope, $rootScope, $mdDialog, $http, $timeout, func, timer, Upload) {
                $scope.superuser = $rootScope.current_user.permission == '0'
                $scope.notpemission = function () {
                    $rootScope.notificationToast("You are not permited.")
                }
                $scope.instruction = function () {

                    $http({
                            method: 'GET',
                            url: "/api/dtools/gettaskfile",
                            params: {
                                task_id: task._id
                            }
                        }
                    ).success(function (d) {
                        func(d, visionarycompetitionfn, task)
                    })

                }
                $scope.close = function () {
                    $mdDialog.cancel();
                    //$rootScope.ipc.off('visionarycompetition')
                };

                $scope.selectedNiches = [];
                $scope.toggle = function (item, list) {
                    var idx = list.indexOf(item);
                    if (idx > -1) list.splice(idx, 1);
                    else list.push(item);
                };

                $scope.exists = function (item, list) {
                    return list.indexOf(item) > -1;
                };

                // $http({
                //         method: 'GET',
                //         url: "/api/dtools/visionarycompetition",
                //         params: {
                //             username: $rootScope.current_user.username,
                //             taskID: task.taskID,
                //             companyName: task.companyName,
                //             teamName: task.teamName,
                //             period: task.period
                //         }
                //     }
                // )
                //     .success(function (data) {
                //     console.log(data)
                //         if (data) {
                //             $scope.visionaries = [{
                //                 name: 'VRKidEd',
                //                 infuenceUnits: data.negotiation.sumInfluenceSales.VRKidEd,
                //                 pitchCost: 40000
                //             },
                //                 {
                //                     name: 'GovVR',
                //                     infuenceUnits: data.negotiation.sumInfluenceSales.GovVR,
                //                     pitchCost: 30000
                //                 },
                //                 {
                //                     name: 'VRGames',
                //                     infuenceUnits: data.negotiation.sumInfluenceSales.VRGames,
                //                     pitchCost: 50000
                //                 },
                //                 {
                //                     name: 'MilitaryVR',
                //                     infuenceUnits: data.negotiation.sumInfluenceSales.MilitaryVR,
                //                     pitchCost: 40000
                //                 },
                //                 {
                //                     name: 'AdEdVR',
                //                     infuenceUnits: data.negotiation.sumInfluenceSales.AdEdVR,
                //                     pitchCost: 35000
                //                 },
                //                 {
                //                     name: 'VRCinema',
                //                     infuenceUnits: data.negotiation.sumInfluenceSales.VRCinema,
                //                     pitchCost: 25000
                //                 }
                //             ].sort(function () {
                //                 return Math.random() * 3 - 1
                //             })
                //             $scope.uncommittedTime = data.negotiation.funding.additinalProductDeveloperNumber * 120
                //             $scope.uncommittedSales = data.negotiation.funding.additinalSalesNumber * 40000
                //
                //             $scope.visionary = $scope.visionaries[0]
                //             $scope.progress = 0
                //             // setInterval(function () {
                //             //     //console.log($scope.progress)
                //             //     $scope.progress += 1
                //             //     if ($scope.progress >= 100) {
                //             //         $scope.progress = 0
                //             //         $scope.visionary = visionaries[Math.floor((Math.random() * 6))]
                //             //         $rootScope.notificationToast('Visionary changed to ' + $scope.visionary.name + '. Please wait two minutes.')
                //             //     }
                //             // }, 1000)
                //         }
                // })
                //
                // var vcStatus = {
                //     companyName: $rootScope.user_info.companyInfo.companyName,
                //     teamName: $rootScope.user_info.companyInfo.teamName,
                //     startTime: new Date()
                // }
                // $scope.progress = 0
                // $scope.bidtimecommitment = {value: 0}

                // $rootScope.ipc.emit('vcregister', vcStatus)

                // $rootScope.ipc.on('visionarycompetition', function (d) {
                //     //console.log(d) 2017-08-16T03:06:06.884Z
                //
                //     //calculate progree by time
                //     var dt = d.startTime.split('T')[0].split('-')
                //     var tm = d.startTime.split('T')[1].split('.')[0].split(':')
                //
                //     var dt_2 = d.currentTime.split(' ')[0].split('-')
                //     var tm_2 = d.currentTime.split(' ')[1].split(':')
                //     var now = new Date(dt_2[0], parseInt(dt_2[1]) - 1, dt_2[2], tm_2[0], parseInt(tm_2[1]), tm_2[2]);
                //     // var utc_now =new Date(now.getUTCFullYear(),now.getUTCMonth(), now.getUTCDate() ,
                //     //     now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
                //     // console.log(now.getUTCFullYear(),now.getUTCMonth(), now.getUTCDate() ,
                //     //     now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds())
                //     // console.log(now,d)
                //
                //     var endtime_obj = new Date(dt[0], parseInt(dt[1]) - 1, dt[2], tm[0], parseInt(tm[1]) + 1, tm[2])
                //
                //     var time_left = parseInt(Math.abs(endtime_obj - now) / 1000 - 1)
                //     console.log(time_left)
                //     $scope.progress = endtime_obj - now >= 0 ? (1 - (time_left % 60) / 60 ) * 100 : (1 - (time_left % 60) / 60 ) * 100
                //     //  console.log(endtime_obj,utc_now,time_left, $scope.progress)
                //
                //
                //     updateTimer(time_left)
                //     $scope.companiesStatus = d.companies
                //     // console.log(d.companies)
                //     $scope.currentRound = d.currentRound
                //     $scope.visionary = d.currentVisionary
                //     $scope.lastRoundResult = d.lastRoundResult
                //
                //     var currentCompany = d.companies.filter(function (com) {
                //         return com.teamName == $rootScope.user_info.companyInfo.teamName
                //     })
                //
                //     if (currentCompany.length > 0) {
                //         $scope.infuenceUnits = currentCompany[0].infuluenceUnit[d.currentVisionary.visionary]
                //     }
                //     if (currentCompany.length > 0 && Object.keys(currentCompany[0]).indexOf('uncommittedTime') >= 0) {
                //         $scope.uncommittedTime = currentCompany[0].uncommittedTime
                //         $scope.uncommittedSales = currentCompany[0].uncommittedSales
                //     }
                //
                //     if (currentCompany.length > 0 && (currentCompany[0].status == 'biding' || currentCompany[0].status == 'registered')) {
                //         $scope.permitbidstatus = true
                //     }
                //
                //     //$scope.progress += 0.333333333333333
                //     if ($scope.progress >= 100) {
                //         console.log($scope.progress)
                //         $scope.progress = 0
                //         // console.log($scope.progress)
                //         vcStatus.startTime = new Date()
                //         var bidInfo = {
                //             vsStatus: vcStatus,
                //             visionary: $scope.visionary,
                //             bidtimecommitment: $scope.bidtimecommitment.value,
                //             currentRound: $scope.currentRound,
                //             uncommittedTime: $scope.uncommittedTime,
                //             uncommittedSales: $scope.uncommittedSales
                //         }
                //         $rootScope.ipc.emit('vcbidtimeout', bidInfo)
                //         // $scope.visionary = $scope.visionaries[Math.floor((Math.random() * 6))]
                //         $rootScope.notificationToast('Visionary ' + $scope.visionary.visionary + 'Completed. ')
                //     }
                //
                //     $timeout(function () {
                //         $rootScope.ipc.emit('visionarycompetition', vcStatus)
                //     }, 1000)
                //
                // })
                //

                // $rootScope.ipc.on('stopVisionarycompetition', function (d) {
                //     console.log(d)
                //     $rootScope.notificationToast("Visionary Competition Completed.")
                //     $timeout(function () {
                //         $mdDialog.cancel();
                //         $rootScope.ipc.off('visionarycompetition')
                //         $rootScope.ipc.off('stopVisionarycompetition')
                //     }, 10000)
                //
                // })

                // $scope.bid = function () {
                //
                //     if ($scope.bidtimecommitment.value == undefined || $scope.bidtimecommitment.value == 0) {
                //         $rootScope.notificationToast('Please enter time Commitment Value. ')
                //     }
                //     else if ($scope.bidtimecommitment.value > $scope.uncommittedTime) {
                //         $rootScope.notificationToast('You do not have enough committed time. ')
                //     }
                //     else if ($scope.visionary.uncommittedSales > $scope.visionary.pitchCost) {
                //         $rootScope.notificationToast('You do not have enough funding. ')
                //     }
                //     else {
                //         var bidInfo = {
                //             vsStatus: vcStatus,
                //             visionary: $scope.visionary,
                //             bidtimecommitment: $scope.bidtimecommitment.value,
                //             currentRound: $scope.currentRound,
                //             uncommittedTime: $scope.uncommittedTime,
                //             uncommittedSales: $scope.uncommittedSales
                //         }
                //         $rootScope.ipc.emit('vcbid', bidInfo)
                //     }
                //
                //
                // }

                $scope.$watch('visionaries', function (nVal, oVal) {
                    if (nVal != undefined) {
                        $scope.uncommittedTime = $scope.uncommittedTime0
                        $scope.uncommittedSales = $scope.uncommittedSales0
                        console.log(nVal)
                        var bidTime = 0,
                            bidValue = 0
                        nVal.forEach(function (vis) {
                            if (vis.bid > 0) {
                                bidTime += vis.bid
                                bidValue += vis.pitchCost
                            }
                        })
                        $scope.uncommittedTime = $scope.uncommittedTime0 - bidTime
                        $scope.uncommittedSales = $scope.uncommittedSales0 - bidValue
                    }
                    if ($scope.uncommittedTime <= 0) {
                        $rootScope.notificationToast('You do not have enough committed time. ')
                    }
                    else if ($scope.uncommittedSales <= 0) {
                        $rootScope.notificationToast('You do not have enough funding. ')
                    }

                }, true)

                $scope.submit = function (selectedNiches, event) {

                    //console.log(selectedNiches)
                    // $http.post('server/visionarycompetition',data={companyName:$rootScope.userAtCompany.companyName,teamName:$rootScope.userAtCompany.teamName,
                    //     selectedNiches:selectedNiches})
                    var bidTime = 0,
                        bidValue = 0
                    $scope.visionaries.forEach(function (vis) {
                        if (vis.bid > 0) {
                            bidTime += vis.bid
                            bidValue += vis.pitchCost
                        }
                    })


                    if (bidTime > $scope.uncommittedTime) {
                        $rootScope.notificationToast('You do not have enough committed time. ')
                    }
                    else if (bidValue > $scope.uncommittedSales) {
                        $rootScope.notificationToast('You do not have enough funding. ')
                    }
                    else {
                        $http({
                                method: 'POST',
                                url: "/api/dtools/visionarycompetition",
                                data: {
                                    username: $rootScope.current_user.username,
                                    taskID: task.taskID,
                                    companyName: task.companyName,
                                    teamName: task.teamName,
                                    period: task.period,
                                    visionaries: $scope.visionaries
                                }
                            }
                        )
                            .success(function (d) {
                                // console.log(d)
                                // $window.location.reload();
                                $rootScope.user_info.companyInfo.currentPeriod = d.currentPeriod
                            })


                        $mdDialog.cancel();
                        $mdSidenav('taskslist').close()
                        $rootScope.notificationToast("Submitted application.")
                    }


                };
                $timeout(function () {
                    drawTimer()
                }, 1000)

                var getInitData = function () {
                    $http({
                            method: 'GET',
                            url: "/api/dtools/visionarycompetition",
                            params: {
                                username: $rootScope.current_user.username,
                                taskID: task.taskID,
                                companyName: task.companyName,
                                teamName: task.teamName,
                                period: task.period
                            }
                        }
                    )
                        .success(function (d) {
                            console.log(d)
                            $scope.visionaries = d.visionaries
                            $scope.uncommittedTime = $scope.uncommittedTime0 = d.negotiation.uncommittedTime
                            $scope.uncommittedSales = $scope.uncommittedSales0 = d.negotiation.uncommittedSales
                            if (Object.keys(d.negotiation).indexOf('infuluenceUnit') >= 0) {
                                d.visionaries.forEach(function (vis) {
                                    vis.influence = d.negotiation.infuluenceUnit[vis.visionary]
                                })
                            }


                        })
                }

                getInitData()

                function drawTimer() {
                    var svgUnderlay = d3.select(".clock svg"),
                        svgOverlay = d3.select(".clock").append(function () {
                            return svgUnderlay.node().cloneNode(true);
                        })
                    svgUnderlay.attr("id", "underlay");
                    svgOverlay.attr("id", "overlay");

                }

                function updateTimer(time_left) {
                    svg = d3.selectAll(".clock svg");
                    // var dt = endtime.split(' ')[0].split('-')
                    // var tm = endtime.split(' ')[1].split(':')
                    // var endtime_obj = new Date(dt[0], parseInt(dt[1]) - 1, dt[2], tm[0], parseInt(tm[1]) + 5, tm[2])
                    var digit = svg.selectAll(".digit"),
                        separator = svg.selectAll(".separator circle");
                    var digitPattern = [
                        [1, 0, 1, 1, 0, 1, 1, 1, 1, 1],
                        [1, 0, 0, 0, 1, 1, 1, 0, 1, 1],
                        [1, 1, 1, 1, 1, 0, 0, 1, 1, 1],
                        [0, 0, 1, 1, 1, 1, 1, 0, 1, 1],
                        [1, 0, 1, 0, 0, 0, 1, 0, 1, 0],
                        [1, 1, 0, 1, 1, 1, 1, 1, 1, 1],
                        [1, 0, 1, 1, 0, 1, 1, 0, 1, 1]
                    ];

                    // (function tick() {
                    // var now = new Date();
                    // var time_left = parseInt(Math.abs(endtime_obj - now) / 1000)
                    var hours = parseInt(parseInt(time_left / 3600) % 24),
                        minutes = parseInt(parseInt(time_left / 60) % 60),
                        seconds = parseInt(time_left % 60);

                    digit = digit.data([hours / 10 | 0, hours % 10, minutes / 10 | 0, minutes % 10, seconds / 10 | 0, seconds % 10]);
                    digit.select("path:nth-child(1)").classed("lit", function (d) {
                        return digitPattern[0][d];
                    });
                    digit.select("path:nth-child(2)").classed("lit", function (d) {
                        return digitPattern[1][d];
                    });
                    digit.select("path:nth-child(3)").classed("lit", function (d) {
                        return digitPattern[2][d];
                    });
                    digit.select("path:nth-child(4)").classed("lit", function (d) {
                        return digitPattern[3][d];
                    });
                    digit.select("path:nth-child(5)").classed("lit", function (d) {
                        return digitPattern[4][d];
                    });
                    digit.select("path:nth-child(6)").classed("lit", function (d) {
                        return digitPattern[5][d];
                    });
                    digit.select("path:nth-child(7)").classed("lit", function (d) {
                        return digitPattern[6][d];
                    });
                    separator.classed("lit", seconds & 1);

                    // setTimeout(tick, 1000 - now % 1000);
                    // })();
                }

                $scope.fileSelected = function (file) {
                    // var fileID =  fileUpload(file)
                    //   console.log(fileID)
                    Upload.upload({
                        url: '/files/upload',
                        data: {files: file}
                    }).then(function (response) {
                        $http({
                                method: 'POST',
                                url: "/api/dtools/updatetaskfile",
                                data: {
                                    task_id: task._id,
                                    infoFile: response.data[0]
                                }
                            }
                        ).success(function () {
                                $rootScope.tasklists.forEach(function (t) {
                                    if (t._id == task._id) {
                                        t.infoFile = response.data[0]
                                    }
                                })
                                $rootScope.notificationToast('File uploaded.')
                            }
                        )

                    });
                }
            }
        }

            function visionarycompetitionfn_backup(task) {
            // Show the dialog
            $mdDialog.show({
                clickOutsideToClose: false,
                bindToController: true,
                controller: visionarycompetitionCtrl,
                controllerAs: 'dialog',
                templateUrl:  '/api/dtools/getpage?pagename=visionarycompetition',
                locals:{func:instructionFn,timer:timerFn}
            });

            function visionarycompetitionCtrl ($scope,$rootScope,$mdDialog,$http,$timeout,func,timer,Upload) {
                $scope.superuser = $rootScope.current_user.permission == '0'
                $scope.notpemission = function () {
                    $rootScope.notificationToast("You are not permited.")
                }
                $scope.instruction = function () {

                    $http({
                            method: 'GET',
                            url: "/api/dtools/gettaskfile",
                            params: {
                                task_id: task._id
                            }
                        }
                    ).success(function (d) {
                        func(d, visionarycompetitionfn, task)
                    })

                }
                $scope.close = function () {
                    $mdDialog.cancel();
                    $rootScope.ipc.off('visionarycompetition')
                };

                $scope.selectedNiches = [];
                $scope.toggle = function (item, list) {
                    var idx = list.indexOf(item);
                    if (idx > -1) list.splice(idx, 1);
                    else list.push(item);
                };

                $scope.exists = function (item, list) {
                    return list.indexOf(item) > -1;
                };

                // $http({
                //         method: 'GET',
                //         url: "/api/dtools/visionarycompetition",
                //         params: {
                //             username: $rootScope.current_user.username,
                //             taskID: task.taskID,
                //             companyName: task.companyName,
                //             teamName: task.teamName,
                //             period: task.period
                //         }
                //     }
                // )
                //     .success(function (data) {
                //     console.log(data)
                //         if (data) {
                //             $scope.visionaries = [{
                //                 name: 'VRKidEd',
                //                 infuenceUnits: data.negotiation.sumInfluenceSales.VRKidEd,
                //                 pitchCost: 40000
                //             },
                //                 {
                //                     name: 'GovVR',
                //                     infuenceUnits: data.negotiation.sumInfluenceSales.GovVR,
                //                     pitchCost: 30000
                //                 },
                //                 {
                //                     name: 'VRGames',
                //                     infuenceUnits: data.negotiation.sumInfluenceSales.VRGames,
                //                     pitchCost: 50000
                //                 },
                //                 {
                //                     name: 'MilitaryVR',
                //                     infuenceUnits: data.negotiation.sumInfluenceSales.MilitaryVR,
                //                     pitchCost: 40000
                //                 },
                //                 {
                //                     name: 'AdEdVR',
                //                     infuenceUnits: data.negotiation.sumInfluenceSales.AdEdVR,
                //                     pitchCost: 35000
                //                 },
                //                 {
                //                     name: 'VRCinema',
                //                     infuenceUnits: data.negotiation.sumInfluenceSales.VRCinema,
                //                     pitchCost: 25000
                //                 }
                //             ].sort(function () {
                //                 return Math.random() * 3 - 1
                //             })
                //             $scope.uncommittedTime = data.negotiation.funding.additinalProductDeveloperNumber * 120
                //             $scope.uncommittedSales = data.negotiation.funding.additinalSalesNumber * 40000
                //
                //             $scope.visionary = $scope.visionaries[0]
                //             $scope.progress = 0
                //             // setInterval(function () {
                //             //     //console.log($scope.progress)
                //             //     $scope.progress += 1
                //             //     if ($scope.progress >= 100) {
                //             //         $scope.progress = 0
                //             //         $scope.visionary = visionaries[Math.floor((Math.random() * 6))]
                //             //         $rootScope.notificationToast('Visionary changed to ' + $scope.visionary.name + '. Please wait two minutes.')
                //             //     }
                //             // }, 1000)
                //         }
                // })

                var vcStatus = {
                    companyName: $rootScope.user_info.companyInfo.companyName,
                    teamName: $rootScope.user_info.companyInfo.teamName,
                    startTime: new Date()
                }
                $scope.progress = 0
                $scope.bidtimecommitment = {value: 0}
                console.log('registerTime', vcStatus)
                $rootScope.ipc.emit('vcregister', vcStatus)

                $rootScope.ipc.on('visionarycompetition', function (d) {
                    //console.log(d) 2017-08-16T03:06:06.884Z

                    //calculate progree by time
                    var dt = d.startTime.split('T')[0].split('-')
                    var tm = d.startTime.split('T')[1].split('.')[0].split(':')

                    var dt_2 = d.currentTime.split(' ')[0].split('-')
                    var tm_2 = d.currentTime.split(' ')[1].split(':')
                    var now = new Date(dt_2[0], parseInt(dt_2[1]) - 1, dt_2[2], tm_2[0], parseInt(tm_2[1]), tm_2[2]);
                    // var utc_now =new Date(now.getUTCFullYear(),now.getUTCMonth(), now.getUTCDate() ,
                    //     now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
                    // console.log(now.getUTCFullYear(),now.getUTCMonth(), now.getUTCDate() ,
                    //     now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds())
                    // console.log(now,d)

                    var endtime_obj = new Date(dt[0], parseInt(dt[1]) - 1, dt[2], tm[0], parseInt(tm[1]) + 1, tm[2])

                    var time_left = parseInt(Math.abs(endtime_obj - now) / 1000 - 1)
                    console.log(time_left)
                    $scope.progress = endtime_obj - now >= 0 ? (1 - (time_left % 60) / 60 ) * 100 : (1 - (time_left % 60) / 60 ) * 100
                    //  console.log(endtime_obj,utc_now,time_left, $scope.progress)


                    updateTimer(time_left)
                    $scope.companiesStatus = d.companies
                    // console.log(d.companies)
                    $scope.currentRound = d.currentRound
                    $scope.visionary = d.currentVisionary
                    $scope.lastRoundResult = d.lastRoundResult

                    var currentCompany = d.companies.filter(function (com) {
                        return com.teamName == $rootScope.user_info.companyInfo.teamName
                    })

                    if (currentCompany.length > 0) {
                        $scope.infuenceUnits = currentCompany[0].infuluenceUnit[d.currentVisionary.visionary]
                    }
                    if (currentCompany.length > 0 && Object.keys(currentCompany[0]).indexOf('uncommittedTime') >= 0) {
                        $scope.uncommittedTime = currentCompany[0].uncommittedTime
                        $scope.uncommittedSales = currentCompany[0].uncommittedSales
                    }

                    if (currentCompany.length > 0 && (currentCompany[0].status == 'biding' || currentCompany[0].status == 'registered')) {
                        $scope.permitbidstatus = true
                    }

                    //$scope.progress += 0.333333333333333
                    if ($scope.progress >= 100) {
                        console.log($scope.progress)
                        $scope.progress = 0
                        // console.log($scope.progress)
                        vcStatus.startTime = new Date()
                        var bidInfo = {
                            vsStatus: vcStatus,
                            visionary: $scope.visionary,
                            bidtimecommitment: $scope.bidtimecommitment.value,
                            currentRound: $scope.currentRound,
                            uncommittedTime: $scope.uncommittedTime,
                            uncommittedSales: $scope.uncommittedSales
                        }
                        $rootScope.ipc.emit('vcbidtimeout', bidInfo)
                        // $scope.visionary = $scope.visionaries[Math.floor((Math.random() * 6))]
                        $rootScope.notificationToast('Visionary ' + $scope.visionary.visionary + 'Completed. ')
                    }

                    $timeout(function () {
                        $rootScope.ipc.emit('visionarycompetition', vcStatus)
                    }, 1000)

                })


                $rootScope.ipc.on('stopVisionarycompetition', function (d) {
                    console.log(d)
                    $rootScope.notificationToast("Visionary Competition Completed.")
                    $timeout(function () {
                        $mdDialog.cancel();
                        $rootScope.ipc.off('visionarycompetition')
                        $rootScope.ipc.off('stopVisionarycompetition')
                    }, 10000)

                })

                $scope.bid = function () {

                    if ($scope.bidtimecommitment.value == undefined || $scope.bidtimecommitment.value == 0) {
                        $rootScope.notificationToast('Please enter time Commitment Value. ')
                    }
                    else if ($scope.bidtimecommitment.value > $scope.uncommittedTime) {
                        $rootScope.notificationToast('You do not have enough committed time. ')
                    }
                    else if ($scope.visionary.uncommittedSales > $scope.visionary.pitchCost) {
                        $rootScope.notificationToast('You do not have enough funding. ')
                    }
                    else {
                        var bidInfo = {
                            vsStatus: vcStatus,
                            visionary: $scope.visionary,
                            bidtimecommitment: $scope.bidtimecommitment.value,
                            currentRound: $scope.currentRound,
                            uncommittedTime: $scope.uncommittedTime,
                            uncommittedSales: $scope.uncommittedSales
                        }
                        $rootScope.ipc.emit('vcbid', bidInfo)
                    }


                }

                $scope.submit = function (selectedNiches,event) {

                    //console.log(selectedNiches)
                    // $http.post('server/visionarycompetition',data={companyName:$rootScope.userAtCompany.companyName,teamName:$rootScope.userAtCompany.teamName,
                    //     selectedNiches:selectedNiches})
                    $http({
                            method:'POST',
                            url:"/api/dtools/visionarycompetition",
                            data:{
                                username: $rootScope.current_user.username,
                                taskID:task.taskID,
                                companyName :task.companyName,
                                teamName : task.teamName,
                                period:task.period,
                                selectedNiches:selectedNiches
                            }
                        }
                    )
                        .success(function(d){
                        console.log(d)
                            // $window.location.reload();
                            $rootScope.user_info.companyInfo.currentPeriod = d.currentPeriod
                    })


                    $mdDialog.cancel();
                    $mdSidenav('taskslist').close()
                    $rootScope.notificationToast("Submitted application.")

                };
                $timeout(function () {
                    drawTimer()
                },1000)


                function drawTimer() {
                    var svgUnderlay = d3.select(".clock svg"),
                        svgOverlay = d3.select(".clock").append(function () {
                            return svgUnderlay.node().cloneNode(true);
                        })
                    svgUnderlay.attr("id", "underlay");
                    svgOverlay.attr("id", "overlay");

                }

                function updateTimer(time_left) {
                    svg = d3.selectAll(".clock svg");
                    // var dt = endtime.split(' ')[0].split('-')
                    // var tm = endtime.split(' ')[1].split(':')
                    // var endtime_obj = new Date(dt[0], parseInt(dt[1]) - 1, dt[2], tm[0], parseInt(tm[1]) + 5, tm[2])
                    var digit = svg.selectAll(".digit"),
                        separator = svg.selectAll(".separator circle");
                    var digitPattern = [
                        [1, 0, 1, 1, 0, 1, 1, 1, 1, 1],
                        [1, 0, 0, 0, 1, 1, 1, 0, 1, 1],
                        [1, 1, 1, 1, 1, 0, 0, 1, 1, 1],
                        [0, 0, 1, 1, 1, 1, 1, 0, 1, 1],
                        [1, 0, 1, 0, 0, 0, 1, 0, 1, 0],
                        [1, 1, 0, 1, 1, 1, 1, 1, 1, 1],
                        [1, 0, 1, 1, 0, 1, 1, 0, 1, 1]
                    ];

                    // (function tick() {
                    // var now = new Date();
                    // var time_left = parseInt(Math.abs(endtime_obj - now) / 1000)
                    var hours = parseInt(parseInt(time_left / 3600) % 24),
                        minutes = parseInt(parseInt(time_left / 60) % 60),
                        seconds = parseInt(time_left % 60);

                    digit = digit.data([hours / 10 | 0, hours % 10, minutes / 10 | 0, minutes % 10, seconds / 10 | 0, seconds % 10]);
                    digit.select("path:nth-child(1)").classed("lit", function (d) {
                        return digitPattern[0][d];
                    });
                    digit.select("path:nth-child(2)").classed("lit", function (d) {
                        return digitPattern[1][d];
                    });
                    digit.select("path:nth-child(3)").classed("lit", function (d) {
                        return digitPattern[2][d];
                    });
                    digit.select("path:nth-child(4)").classed("lit", function (d) {
                        return digitPattern[3][d];
                    });
                    digit.select("path:nth-child(5)").classed("lit", function (d) {
                        return digitPattern[4][d];
                    });
                    digit.select("path:nth-child(6)").classed("lit", function (d) {
                        return digitPattern[5][d];
                    });
                    digit.select("path:nth-child(7)").classed("lit", function (d) {
                        return digitPattern[6][d];
                    });
                    separator.classed("lit", seconds & 1);

                    // setTimeout(tick, 1000 - now % 1000);
                    // })();
                }

                $scope.fileSelected=function(file) {
                    // var fileID =  fileUpload(file)
                    //   console.log(fileID)
                    Upload.upload({
                        url: '/files/upload',
                        data: {files: file}
                    }).then(function (response) {
                        $http({
                                method:'POST',
                                url:"/api/dtools/updatetaskfile",
                                data:{
                                    task_id:task._id,
                                    infoFile:response.data[0]
                                }
                            }
                        ).success(function () {
                                $rootScope.tasklists.forEach(function (t) {
                                    if (t._id == task._id){
                                        t.infoFile = response.data[0]
                                    }
                                })
                                $rootScope.notificationToast('File uploaded.')
                            }

                        )

                    });
                }
            }
        }
        function negotiate2fn(task) {
            $mdDialog.show({
                clickOutsideToClose: false,
                bindToController: true,
                controller: negotiate2Ctrl,
                controllerAs: 'dialog',
                templateUrl:  '/api/dtools/getpage?pagename=negotiation2',
                locals:{func:instructionFn,timer:timerFn}
            });

            function negotiate2Ctrl ($scope,$rootScope,$mdDialog,$http,$timeout,func,timer,Upload) {
                $scope.superuser = $rootScope.current_user.permission == '0'
                $scope.notpemission = function () {
                    $rootScope.notificationToast("You are not permited.")
                }
                $scope.instruction = function () {

                    $http({
                            method: 'GET',
                            url: "/api/dtools/gettaskfile",
                            params: {
                                task_id: task._id
                            }
                        }
                    ).success(function (d) {
                        func(d, negotiate2fn, task)
                    })

                }
                $scope.close = function () {
                    $mdDialog.cancel();
                };
                $scope.currentPeriod = $rootScope.user_info.companyInfo.currentPeriod
                $scope.companyName = $rootScope.user_info.companyInfo.companyName

                $http({
                        method:'GET',
                        url:"/api/dtools/negotiate2",
                        params:{
                            username: $rootScope.current_user.username,
                            taskID:task.taskID,
                            companyName :task.companyName,
                            teamName : task.teamName,
                            period:task.period
                        }
                    }
                )
                    .success(function(data){
                    console.log(data)
                    if (data.negotiation != null) {
                        $scope.status = data.status
                        $scope.estimatedIncome= data.negotiation.estimatedIncome
                        $scope.Costs = data.negotiation.costs
                        $scope.expenditure =data.negotiation.expenditure
                        $scope.grand_total1 = data.negotiation.grand_total1
                    }

                    else{
                        $scope.estimatedIncome=[{"period":4,"VREducation":{"customers":0,"share":0},"VRGovernment":{"customers":0,"share":0},"VREntertainment":{"customers":0,"share":0}},
                            {"period":5,"VREducation":{"customers":0,"share":0},"VRGovernment":{"customers":0,"share":0},"VREntertainment":{"customers":0,"share":0}}]
                        $scope.Costs=[{"period":4,"marketing":0,"sales":0,"support":0,"logisticsit":0,"development":0},
                            {"period":5,"marketing":0,"sales":0,"support":0,"logisticsit":0,"development":0}]

                    }
                        $scope.workforce = data.workforce
                        $scope.workforce_def = data.workforce_def
                        // console.log($scope.workforce['Product Development'].adjustedworkforce_total)
                })
                if ($scope.grand_total1 == undefined) {
                    $scope.grand_total1 = 0
                }
                $scope.grand_total = [0, 0]
                $scope.Costs = [{total_cost: 0}, {total_cost: 0}]

                $scope.expenditure = [{total: 0}, {total: 0}]

                $scope.estimatedIncome = [{gross_margin: 0}, {gross_margin: 0}]


                $scope.$watch('Costs', function (nVal, oVal) {
                    if (nVal != undefined && $scope.workforce_def != undefined) {
                        console.log($scope.workforce_def)
                        $scope.Costs.forEach(function (c) {
                            c.total_wage = 0
                            c.hiring_costs = 0
                            c.associated_expenses = 0
                            Object.keys(c).forEach(function (k) {
                                if (k == 'development') {
                                    var worker_cost = $scope.workforce_def.filter(function (worker) {
                                        return worker.functions == "Product Development"
                                    })[0]
                                    c.total_wage += c[k] * worker_cost.avWage
                                    c.associated_expenses += c[k] * worker_cost.avExpense
                                    var rate = c[k] >= 0 ? worker_cost.costOfHire : worker_cost.costOfFire * (-1)
                                    c.hiring_costs = c.hiring_costs + rate * c[k] * (worker_cost.avWage + worker_cost.avExpense)
                                }
                                if (k == 'logisticsit') {
                                    var worker_cost = $scope.workforce_def.filter(function (worker) {
                                        return worker.functions == "Logistics"
                                    })[0]
                                    c.total_wage += c[k] * worker_cost.avWage
                                    c.associated_expenses += c[k] * worker_cost.avExpense
                                    var rate = c[k] >= 0 ? worker_cost.costOfHire : worker_cost.costOfFire * (-1)
                                    c.hiring_costs = c.hiring_costs + rate * c[k] * (worker_cost.avWage + worker_cost.avExpense)
                                }
                                if (k == 'marketing') {
                                    var worker_cost = $scope.workforce_def.filter(function (worker) {
                                        return worker.functions == "Marketing"
                                    })[0]
                                    c.associated_expenses += c[k] * worker_cost.avExpense
                                    var rate = c[k] >= 0 ? worker_cost.costOfHire : worker_cost.costOfFire * (-1)
                                    c.hiring_costs = c.hiring_costs + rate * c[k] * (worker_cost.avWage + worker_cost.avExpense)
                                    c.total_wage += c[k] * worker_cost.avWage
                                }
                                if (k == 'sales') {
                                    var worker_cost = $scope.workforce_def.filter(function (worker) {
                                        return worker.functions == "Sales"
                                    })[0]
                                    c.associated_expenses += c[k] * worker_cost.avExpense
                                    var rate = c[k] >= 0 ? worker_cost.costOfHire : worker_cost.costOfFire * (-1)
                                    c.hiring_costs = c.hiring_costs + rate * c[k] * (worker_cost.avWage + worker_cost.avExpense)
                                    c.total_wage += c[k] * worker_cost.avWage
                                }
                                if (k == 'support') {
                                    var worker_cost = $scope.workforce_def.filter(function (worker) {
                                        return worker.functions == "Social Media"
                                    })[0]
                                    c.associated_expenses += c[k] * worker_cost.avExpense
                                    var rate = c[k] >= 0 ? worker_cost.costOfHire : worker_cost.costOfFire * (-1)
                                    c.hiring_costs = c.hiring_costs + rate * c[k] * (worker_cost.avWage + worker_cost.avExpense)
                                    c.total_wage += c[k] * worker_cost.avWage
                                }
                            })
                            c.total_cost = c.total_wage + c.hiring_costs + c.associated_expenses
                            c.total_wage_text = formatNum(c.total_wage)
                            c.hiring_costs_text = formatNum(c.hiring_costs)
                            c.associated_expenses_text = formatNum(c.associated_expenses)
                            c.total_cost_text = formatNum(c.total_cost)
                        })
                        // console.log('$scope.Costs',$scope.Costs)
                        $scope.grand_total[0] = -$scope.Costs[0].total_cost -
                            $scope.expenditure[0].total +
                            $scope.estimatedIncome[0].gross_margin
                        $scope.grand_total[1] = -$scope.Costs[1].total_cost -
                            $scope.expenditure[1].total +
                            $scope.estimatedIncome[1].gross_margin
                        $scope.grand_total_text = [formatNum($scope.grand_total[0]), formatNum($scope.grand_total[1])]
                    }

                }, true)

                $scope.$watch('estimatedIncome', function (nVal, oVal) {

                    if (nVal) {

                        $scope.estimatedIncome.forEach(function (income) {
                            // console.log(income)
                            income.total_revenue = 0
                            Object.keys(income).forEach(function (k) {

                                if (['VREducation', 'VREntertainment', 'VRGovernment'].indexOf(k) >= 0) {
                                    var revenuePerCustomer = 0
                                    console.log(k)
                                    if (k == 'VREducation') {
                                        revenuePerCustomer = 450
                                    }
                                    else if (k == 'VREntertainment') {
                                        revenuePerCustomer = 500
                                    }
                                    else {
                                        revenuePerCustomer = 550
                                    }
                                    income[k].revenue = income[k].customers * income[k].share * revenuePerCustomer
                                    income[k].revenue_text = formatNum(income[k].revenue)
                                    income.total_revenue += income[k].revenue
                                }


                            })
                            income.gross_margin = income.total_revenue * 0.75
                            income.total_revenue_text = formatNum(income.total_revenue)
                            income.gross_margin_text = formatNum(income.gross_margin)
                        })
                        // console.log('$scope.Costs',$scope.Costs)
                        $scope.grand_total[0] = -$scope.Costs[0].total_cost -
                            $scope.expenditure[0].total +
                            $scope.estimatedIncome[0].gross_margin
                        $scope.grand_total[1] = -$scope.Costs[1].total_cost -
                            $scope.expenditure[1].total +
                            $scope.estimatedIncome[1].gross_margin
                        $scope.grand_total_text = [formatNum($scope.grand_total[0]), formatNum($scope.grand_total[1])]
                    }

                }, true)
                $scope.$watch('expenditure', function (nVal, oVal) {
                    if (nVal) {
                        console.log(nVal)
                        Object.keys($scope.expenditure).forEach(function (ek) {
                            $scope.expenditure[ek].total = 0
                            Object.keys($scope.expenditure[ek]).forEach(function (k) {
                                if (['ad', 'dm', 'pd'].indexOf(k) >= 0) {
                                    $scope.expenditure[ek].total += $scope.expenditure[ek][k]
                                }

                            })

                            $scope.expenditure[ek].total_text = formatNum($scope.expenditure[ek].total)

                        })

                        // console.log('$scope.Costs',$scope.Costs)
                        $scope.grand_total[0] = -$scope.Costs[0].total_cost -
                            $scope.expenditure[0].total +
                            $scope.estimatedIncome[0].gross_margin
                        $scope.grand_total[1] = -$scope.Costs[1].total_cost -
                            $scope.expenditure[1].total +
                            $scope.estimatedIncome[1].gross_margin
                        $scope.grand_total_text = [formatNum($scope.grand_total[0]), formatNum($scope.grand_total[1])]
                    }

                }, true)

                // $scope.$watch('grand_total1', function (nVal, oVal) {
                //     if (nVal) {
                //         $scope.grand_total_text = formatNum($scope.grand_total1)
                //     }
                // })

                $scope.submit = function (action) {

                    // $http.post('server/negotiation2',data={username:$rootScope.current_user.username,
                    //     estimatedIncome:estimatedIncome,costs:Costs,expenditure:expenditure,action:action})
                    $http({
                            method:'POST',
                            url:"/api/dtools/negotiate2",
                            data:{
                                username: $rootScope.current_user.username,
                                taskID:task.taskID,
                                companyName :task.companyName,
                                teamName : task.teamName,
                                period:task.period,
                                estimatedIncome: $scope.estimatedIncome,
                                costs: $scope.Costs,
                                expenditure: $scope.expenditure,
                                grand_total: $scope.grand_total,
                                grand_total1: $scope.grand_total1,
                                action: action
                            }
                        }
                    )
                        .success(function (d) {
                            // $window.location.reload();
                            $rootScope.user_info.companyInfo.currentPeriod = d.currentPeriod
                        console.log(d)})
                    $mdDialog.cancel();
                    $mdSidenav('taskslist').close()
                    $rootScope.notificationToast("Submitted application.")
                };

                $scope.fileSelected=function(file) {
                    // var fileID =  fileUpload(file)
                    //   console.log(fileID)
                    Upload.upload({
                        url: '/files/upload',
                        data: {files: file}
                    }).then(function (response) {
                        $http({
                                method:'POST',
                                url:"/api/dtools/updatetaskfile",
                                data:{
                                    task_id:task._id,
                                    infoFile:response.data[0]
                                }
                            }
                        ).success(function () {
                                $rootScope.tasklists.forEach(function (t) {
                                    if (t._id == task._id){
                                        t.infoFile = response.data[0]
                                    }
                                })
                                $rootScope.notificationToast('File uploaded.')
                            }

                        )

                    });
                }
            }
        }
        function nichesfn(task) {
            // Show the dialog
            $mdDialog.show({
                clickOutsideToClose: false,
                bindToController: true,
                controller: nichesCtrl,
                controllerAs: 'dialog',
                templateUrl:  '/api/dtools/getpage?pagename=niches',
                locals:{func:instructionFn,timer:timerFn}
            });

            function nichesCtrl ($scope,$rootScope,$mdDialog,$http,$timeout,func,timer,Upload) {
                $scope.superuser = $rootScope.current_user.permission == '0'
                $scope.notpemission = function () {
                    $rootScope.notificationToast("You are not permited.")
                }
                $scope.instruction = function () {

                    $http({
                            method: 'GET',
                            url: "/api/dtools/gettaskfile",
                            params: {
                                task_id: task._id
                            }
                        }
                    ).success(function (d) {
                        func(d, nichesfn, task)
                    })

                }
                $scope.close = function () {
                    $mdDialog.cancel();
                };
                $scope.submit = function (niches) {
                    console.log(niches)
                    $http({
                        method: 'POST',
                        url: "/api/dtools/niches",
                        data: {
                            username: $rootScope.current_user.username,
                            taskID: task.taskID,
                            companyName: task.companyName,
                            teamName: task.teamName,
                            period: task.period,
                            niches: niches
                        }
                    })
                        .success(function (d) {
                            // $window.location.reload();
                            $rootScope.user_info.companyInfo.currentPeriod = d.currentPeriod
                        console.log(d)})


                    $mdDialog.cancel();
                    $mdSidenav('taskslist').close()
                    $rootScope.notificationToast("Submitted application.")

                };
                $http({
                        method: 'GET',
                        url: "/api/dtools/niches",
                        params: {
                            username: $rootScope.current_user.username,
                            taskID: task.taskID,
                            companyName: task.companyName,
                            teamName: task.teamName,
                            period: task.period
                        }
                    }
                )
                    .success(function (d) {

                    $scope.niches =[{'niche':'',p4:'',p5:'',p6:'',p7:'',p8:''},{'niche':'',p4:'',p5:'',p6:'',p7:'',p8:''},{'niche':'',p4:'',p5:'',p6:'',p7:'',p8:''}]
                        d.forEach(function (n) {
                            console.log(n)
                            if (n.niche == "Education" || n.niche == "Creatives") {

                                if (n.period == 4) {
                                    $scope.niches[0].niche = n.niche, $scope.niches[0].p4 = n;
                                }
                                if (n.period == 5) {
                                    $scope.niches[0].niche = n.niche, $scope.niches[0].p5 = n;
                                }
                            if (n.period == 6) {
                                $scope.niches[0].niche = n.niche, $scope.niches[0].p6 = n;
                                $scope.niches[0].p6.selected = true;
                            }
                            if (n.period == 7) {
                                $scope.niches[0].niche = n.niche, $scope.niches[0].p7 = n;
                                $scope.niches[0].p7.selected = true;
                            }
                            if (n.period == 8) {
                                $scope.niches[0].niche = n.niche, $scope.niches[0].p8 = n;
                                $scope.niches[0].p8.selected = true;
                            }
                        }
                            if (n.niche == "Government" || n.niche == "Viewers") {
                                if (n.period == 4) {
                                    $scope.niches[1].niche = n.niche, $scope.niches[1].p4 = n;
                                }
                                if (n.period == 5) {
                                    $scope.niches[1].niche = n.niche, $scope.niches[1].p5 = n;
                                }
                            if (n.period == 6) {
                                $scope.niches[1].niche = n.niche, $scope.niches[1].p6 = n;
                                $scope.niches[1].p6.selected = true;
                            }
                            if (n.period == 7) {
                                $scope.niches[1].niche = n.niche, $scope.niches[1].p7 = n;
                                $scope.niches[1].p7.selected = true;
                            }
                            if (n.period == 8) {
                                $scope.niches[1].niche = n.niche, $scope.niches[1].p8 = n;
                                $scope.niches[1].p8.selected = true;
                            }
                        }
                            if (n.niche == "Entertainment" || n.niche == "Subscribers") {
                                if (n.period == 4) {
                                    $scope.niches[2].niche = n.niche, $scope.niches[2].p4 = n;
                                }
                                if (n.period == 5) {
                                    $scope.niches[2].niche = n.niche, $scope.niches[2].p5 = n;
                                }
                            if (n.period == 6) {
                                $scope.niches[2].niche = n.niche, $scope.niches[2].p6 = n;
                                $scope.niches[2].p6.selected = true;
                            }
                            if (n.period == 7) {
                                $scope.niches[2].niche = n.niche, $scope.niches[2].p7 = n;
                                $scope.niches[2].p7.selected = true;
                            }
                            if (n.period == 8) {
                                $scope.niches[2].niche = n.niche, $scope.niches[2].p8 = n;
                                $scope.niches[2].p8.selected = true;
                            }
                        }
                    })
                        console.log($scope.niches)
                })
                $timeout(function () {
                    timer('2016-09-16 01:01:38')
                },1000)

                $scope.fileSelected=function(file) {
                    // var fileID =  fileUpload(file)
                    //   console.log(fileID)
                    Upload.upload({
                        url: '/files/upload',
                        data: {files: file}
                    }).then(function (response) {
                        $http({
                                method:'POST',
                                url:"/api/dtools/updatetaskfile",
                                data:{
                                    task_id:task._id,
                                    infoFile:response.data[0]
                                }
                            }
                        ).success(function () {
                                $rootScope.tasklists.forEach(function (t) {
                                    if (t._id == task._id){
                                        t.infoFile = response.data[0]
                                    }
                                })
                                $rootScope.notificationToast('File uploaded.')
                            }

                        )

                    });
                }
            }
        }
        function corporateacquisitionsfn(task) {
            // Show the dialog
            $mdDialog.show({
                clickOutsideToClose: false,
                bindToController: true,
                controller: corporateacquisitionsCtrl,
                controllerAs: 'dialog',
                templateUrl:  '/api/dtools/getpage?pagename=corporate_acquisitions',
                locals:{func:instructionFn,timer:timerFn}
            });

            function corporateacquisitionsCtrl ($scope,$rootScope,$mdDialog,$http,$timeout,func,timer,Upload,$interval) {
                $scope.superuser = $rootScope.current_user.permission == '0'
                $scope.notpemission = function () {
                    $rootScope.notificationToast("You are not permited.")
                }
                $scope.instruction = function () {

                    $http({
                            method: 'GET',
                            url: "/api/dtools/gettaskfile",
                            params: {
                                task_id: task._id
                            }
                        }
                    ).success(function (d) {
                        func(d, corporateacquisitionsfn, task)
                    })

                }
                $scope.close = function () {

                    $mdDialog.cancel();

                };


                $scope.selectedCorporate = [];
                $scope.toggle = function (item, list) {
                    var idx = list.indexOf(item);
                    if (idx > -1) list.splice(idx, 1);
                    else {
                        if (list.length>=1){
                            notificationToast({"message":'Only one corporate could be selected at ont time.'})
                        }
                        else
                        {list.push(item)}
                    };
                };

                $scope.exists = function (item, list) {
                    return list.indexOf(item) > -1;
                };

                // $http.get('/server/querycorporateswithconditions?company='+$rootScope.userAtCompany.companyName+
                //     "&period="+$rootScope.userAtCompany.currentPeriod)
                $http({
                        method: 'GET',
                        url: "/api/dtools/corporateacquisitions",
                        params: {
                            username: $rootScope.current_user.username,
                            taskID: task.taskID,
                            companyName: task.companyName,
                            teamName: task.teamName,
                            period: task.period
                        }
                    }
                )
                    .success(function (data) {
                        // console.log(data)
                        data.forEach(function (d) {
                            d.developmentCost_text = formatNum(d.developmentCost)
                            d.minimumBid_text = formatNum(d.minimumBid)
                        })
                    $scope.corporates = data

                    $scope.progress= 1
                    var total_time = 660
                    var interval =    $interval(function (){
                        //console.log($scope.progress)
                        total_time -= 1
                        $scope.progress= parseInt((1-total_time/660)*100)
                        $scope.stop_watch = parseInt(total_time/60)  + ' M  ' + total_time%60 +' S '
                        if(total_time==30){
                            notificationToast({"message":"Corporate Bid will closed after 30 seconds."})
                        }
                        if (total_time == 0){
                            $interval.cancel(interval)
                            $mdDialog.cancel();
                        }
                    },1000)

                })

                $http.get('/api/general/querydashboarddata', {
                    params: {username: $rootScope.current_user.username}
                })
                    .success(function (res) {
                        // console.log(res)
                        var marketPerformance = res.marketPerformance
                        var managementPerformance = res.managementPerformance
                        var financialPerformance = res.financialPerformance

                        var niches = ['B2B', 'B2C', 'Education', 'Government', 'Entertainment']
                        var periods = ['Previous', 'Current']
                        var accountDescID = ['AB010', 'AB011', 'AB012', 'AB013', 'AB014', 'AB015']
                        var accountDesc = ['Leadership', 'Marketing & Sales', 'Digital Marketing', 'Offering Suppport', 'Product development', 'Logistics & IT']
                        var financialItem = ['Return on Sales', 'Return on Assets', 'Net Operating Cash Generated']

                        $scope.marketPerformance_value = {}
                        niches.forEach(function (n, i) {
                            var value = {}
                            periods.forEach(function (p) {
                                if (marketPerformance != undefined && marketPerformance.length > 0) {
                                    var mp = marketPerformance.filter(function (m) {
                                        return m.niche == n && m.period == p
                                    })
                                    value[p] = mp.length > 0 ? (mp[0].shareRate * 100).toFixed(0) + '%' : 0
                                    value['rank' + p] = mp.length > 0 ? '#' + mp[0].ranking : '#'

                                }


                            })

                            $scope.marketPerformance_value[n] = {"niche": n, "values": value}
                        })


                        $scope.query = {order: 'niche', page: 1};
                        $scope.limit_marketPerformance_value = {limit: $scope.marketPerformance_value.length};
//console.log($scope.marketPerformance_value)


                        //console.log(managementValue)
                        $scope.managementPerformance_value = {}
                        accountDescID.forEach(function (acc, i) {

                            var value = {}
                            periods.forEach(function (p) {
                                if (managementPerformance != undefined && managementPerformance.length > 0) {
                                    var mp = managementPerformance.filter(function (m) {
                                        return m.accountDescID == acc && m.period == p
                                    })

                                    value['competenceIndex' + p] = mp.length > 0 ? (mp[0].competenceIndex * 100).toFixed(0) : 100
                                    value['competenceIndexRank' + p] = mp.length > 0 ? "#" + mp[0].competenceIndexRank : '#'
                                    value['stressIndex' + p] = mp.length > 0 ? (mp[0].stressIndex * 100).toFixed(0) : 100
                                    value['stressIndexRank' + p] = mp.length > 0 ? "#" + mp[0].stressIndexRank : '#'
                                    value['adaptabilityIndex' + p] = mp.length > 0 ? (mp[0].adaptabilityIndex * 100).toFixed(0) : 100
                                    value['adaptabilityIndexRank' + p] = mp.length > 0 ? "#" + mp[0].adaptabilityIndexRank : '#'
                                }
                            })

                            $scope.managementPerformance_value[acc] = {"function": accountDesc[i], "values": value}
                        })
                        $scope.query_mp = {order: 'Item', page: 1};
                        $scope.limit_managementPerformance_value = {limit: $scope.managementPerformance_value.length};


                        //console.log(financialValue)
                        $scope.financialPerformance_value = {}
                        financialItem.forEach(function (fi, i) {

                            var value = {}
                            var value_return_on_sales = {}
                            var value_return_on_assest = {}
                            periods.forEach(function (p, j) {


                                if (financialPerformance != undefined && financialPerformance.length > 0) {
                                    financialPerformance.forEach(function (m) {
                                        if (m.values) {
                                            if (i == 0 && m.period == p) {
                                                value_return_on_sales[p] = (m.values.ROS * 100).toFixed(0) + '%'
                                                value_return_on_sales['rank' + p] = "#" + m.values.ROSrank
                                            }
                                            if (i == 1 && m.period == p) {
                                                value_return_on_assest[p] = (m.values.ROA * 100).toFixed(0) + '%'
                                                value_return_on_assest['rank' + p] = "#" + m.values.ROArank
                                            }
                                            if (i == 2 && m.period == p) {

                                                value[p] = format(m.values.NOCG.toFixed(0))
                                                value['rank' + p] = "#" + m.values.NOCGrank
                                            }
                                        }

                                    })
                                }
                            })
                            if (i == 0) {
                                $scope.financialPerformance_value[fi] = {
                                    "financialItem": fi,
                                    "values": value_return_on_sales
                                }
                            }
                            else if (i == 1) {
                                $scope.financialPerformance_value[fi] = {
                                    "financialItem": fi,
                                    "values": value_return_on_assest
                                }
                            }
                            else {
                                $scope.financialPerformance_value[fi] = {"financialItem": fi, "values": value}
                            }


                            //$scope.financialPerformance_value[acc] = {"function":accountDesc[i],"values":value}
                        })
                        //console.log($scope.financialPerformance_value)
                        $scope.query_mp = {order: 'Item', page: 1};
                        $scope.limit_financialPerformance_value = {limit: $scope.financialPerformance_value.length};


                        //console.log('market', res)
                        var marketValue = res.marketValue
                        var managementValue = res.managementValue
                        var financialValue = res.financialValue


                        //calculate great value

                        //console.log("value", marketValue, managementValue, financialValue)
                        var total_great_value = {}
                        Object.keys(marketValue).forEach(function (teamName) {
                            total_great_value[teamName] = {}
                            Object.keys(marketValue[teamName]).forEach(function (period) {
                                console.log(period)
                                if (period != 'teamName' && period > 1) {
                                    //console.log(financialValue[teamName][period - 1])
                                    if (financialValue[teamName][period - 1]) {
                                        if (financialValue[teamName][period - 1].NOCG <= 0) {
                                            financialValue[teamName][period - 1].NOCG = 1
                                        }
                                    }
                                    else {
                                        financialValue[teamName][period - 1] = {}
                                        financialValue[teamName][period - 1].NOCG = 1
                                        financialValue[teamName][period - 1].EBITDA = 1
                                    }

                                    total_great_value[teamName][period] = marketValue[teamName][period] * 0.3 * managementValue[teamName][period] * 0.3 * financialValue[teamName][period - 1].NOCG * 0.4
                                }
                            })


                        })
                        //console.log(total_great_value)
                        var max_total_great_value = {}
                        //var currentPeriod = $rootScope.userAtCompany.currentPeriod
                        Object.keys(total_great_value).forEach(function (teamName) {
                            Object.keys(total_great_value[teamName]).forEach(function (currentPeriod) {
                                //console.log(total_great_value[teamName][currentPeriod])
                                if (Object.keys(max_total_great_value).indexOf(currentPeriod) < 0) {
                                    max_total_great_value[currentPeriod] = 0
                                }
                                if (total_great_value[teamName][currentPeriod] > max_total_great_value[currentPeriod]) {
                                    max_total_great_value[currentPeriod] = total_great_value[teamName][currentPeriod]
                                }
                            })
                        })
                        // console.log(max_total_great_value)
                        Object.keys(total_great_value).forEach(function (teamName) {
                            Object.keys(total_great_value[teamName]).forEach(function (currentPeriod) {
                                var value = total_great_value[teamName][currentPeriod]
                                total_great_value[teamName][currentPeriod] = {}
                                total_great_value[teamName][currentPeriod].value = value
                                total_great_value[teamName][currentPeriod].percentage = value / max_total_great_value[currentPeriod]
                                var pe = 0
                                if ($rootScope.user_info.companyInfo.companyName == 'LegacyCo' && currentPeriod <= 4) {
                                    pe = 20
                                }
                                else if ($rootScope.user_info.companyInfo.companyName == 'LegacyCo' && currentPeriod == 5) {
                                    pe = 5
                                }
                                else if ($rootScope.user_info.companyInfo.companyName == 'LegacyCo' && currentPeriod == 6) {
                                    pe = 50
                                }
                                else if ($rootScope.user_info.companyInfo.companyName == 'LegacyCo' && currentPeriod == 7) {
                                    pe = 70
                                }
                                else if ($rootScope.user_info.companyInfo.companyName == 'LegacyCo' && currentPeriod == 8) {
                                    pe = 80
                                }
                                else if ($rootScope.user_info.companyInfo.companyName == 'NewCo' && currentPeriod == 5) {
                                    pe = 50
                                }
                                else if ($rootScope.user_info.companyInfo.companyName == 'NewCo' && currentPeriod == 6) {
                                    pe = 70
                                }
                                else if ($rootScope.user_info.companyInfo.companyName == 'NewCo' && currentPeriod == 7) {
                                    pe = 80
                                }
                                else if ($rootScope.user_info.companyInfo.companyName == 'NewCo' && currentPeriod == 8) {
                                    pe = 40
                                }
                                else {
                                    pe = 0
                                }
                                total_great_value[teamName][currentPeriod].PE = pe
                                total_great_value[teamName][currentPeriod].realPE = pe * total_great_value[teamName][currentPeriod].percentage
                                total_great_value[teamName][currentPeriod].EBITDA = financialValue[teamName][currentPeriod - 1].EBITDA
                                total_great_value[teamName][currentPeriod].companyValue = financialValue[teamName][currentPeriod - 1].EBITDA * total_great_value[teamName][currentPeriod].realPE / 100
                                total_great_value[teamName][currentPeriod].sharePrice = total_great_value[teamName][currentPeriod].companyValue / 100000
                            })
                        })
                        console.log(total_great_value)
                        var great_value = total_great_value[$rootScope.user_info.teamInfo.teamName]


                        // $scope.great_value = {}

                        // var previusCompanyValue = ($rootScope.user_info.companyInfo.currentPeriod - 1) > 1 ?
                        //     great_value[$rootScope.user_info.companyInfo.currentPeriod - 1].companyValue.toFixed(0) : 0
                        // var previusSharePrice = ($rootScope.user_info.companyInfo.currentPeriod - 1) > 1 ?
                        //     great_value[$rootScope.user_info.companyInfo.currentPeriod - 1].sharePrice.toFixed(0) : 0
                        // $scope.great_value.companyValue = {
                        //     "key": "Company Value",
                        //     "Previus": format(previusCompanyValue),
                        //     "Current": format(great_value[$rootScope.user_info.companyInfo.currentPeriod].companyValue.toFixed(0))
                        // }
                        // $scope.great_value.sharePrice = {
                        //     "key": "Share Price",
                        //     "Previus": format(previusSharePrice),
                        //     "Current": format(great_value[$rootScope.user_info.companyInfo.currentPeriod].sharePrice.toFixed(0))
                        // }

                        // console.log($scope.great_value)
                        $scope.offer = {
                            cash: 0,

                            current_share_price: parseInt(format(great_value[$rootScope.user_info.companyInfo.currentPeriod].sharePrice.toFixed(0))),
                            treasury_shares: 100000
                        }


                        // $scope.query = {order: 'niche', page: 1};
                        // $scope.limit_great_value = {limit: $scope.great_value.length};
                    })

                // $scope.$watch('offer',function (nVal,oVal) {
                //     console.log(nVal,$scope.offer)
                //     if (nVal != undefined) {
                //
                //         $scope.offer.offerValue=$scope.offer.treasury_shares* $scope.offer.current_share_price+$scope.offer.cash
                //     }
                // })

                $scope.submit = function (offer) {

                    //console.log(selectedNiches)
                    // $http.post('server/visionarycompetition',data={companyName:$rootScope.userAtCompany.companyName,teamName:$rootScope.userAtCompany.teamName,selectedNiches:selectedNiches})
                    $http({
                            method: 'POST',
                            url: "/api/dtools/corporateacquisitions",
                            data: {
                                username: $rootScope.current_user.username,
                                taskID: task.taskID,
                                companyName: task.companyName,
                                teamName: task.teamName,
                                period: task.period,
                                offer: $scope.offer
                            }
                        }
                    )
                        .success(function (d) {
                        console.log(d)
                            $rootScope.user_info.companyInfo.currentPeriod = d.currentPeriod
                            // $window.location.reload();
                    })


                    $mdDialog.cancel();
                    $mdSidenav('taskslist').close()
                    $rootScope.notificationToast("Submitted application.")
                };
                $timeout(function () {
                    timer('2017-03-16 21:00:00')
                },1000)

                $scope.fileSelected=function(file) {
                    // var fileID =  fileUpload(file)
                    //   console.log(fileID)
                    Upload.upload({
                        url: '/files/upload',
                        data: {files: file}
                    }).then(function (response) {
                        $http({
                                method:'POST',
                                url:"/api/dtools/updatetaskfile",
                                data:{
                                    task_id:task._id,
                                    infoFile:response.data[0]
                                }
                            }
                        ).success(function () {
                                $rootScope.tasklists.forEach(function (t) {
                                    if (t._id == task._id){
                                        t.infoFile = response.data[0]
                                    }
                                })
                                $rootScope.notificationToast('File uploaded.')
                            }

                        )

                    });
                }
            }
        }
        function forecastfn(task) {

            $mdDialog.show({
                clickOutsideToClose: false,
                bindToController: true,
                controller: forecastingCtrl,
                controllerAs: 'dialog',
                templateUrl:  '/api/dtools/getpage?pagename=forecast',
                locals:{func:instructionFn,timer:timerFn}
            });

            function forecastingCtrl ($scope,$rootScope,$mdDialog,$http,$timeout,func,timer,Upload) {
                $scope.superuser = $rootScope.current_user.permission == '0'
                $scope.LegacyCo = task.companyName == 'LegacyCo'
                $scope.notpemission = function () {
                    $rootScope.notificationToast("You are not permited.")
                }
                $scope.instruction = function () {

                    $http({
                            method: 'GET',
                            url: "/api/dtools/gettaskfile",
                            params: {
                                task_id: task._id
                            }
                        }
                    ).success(function (d) {
                        func(d, forecastfn, task)
                    })

                }
                $scope.close = function () {
                    $mdDialog.hide();
                };
                $scope.forecast={}
                // console.log(($scope.workforce.projectedsales.b2b)+($scope.workforce.projectedsales.b2c)+($scope.workforce.projectedsales.newoffering))
               $scope.$watchCollection('forecast',function (nVal) {
                       var res = 0
                       if (nVal) {
                           Object.keys(nVal).forEach(function (d) {
                               res += nVal[d]
                           })
                       }
                   $scope.forecast_total = formatNum(res)
               })

                $http({
                        method:'GET',
                        url:"/api/dtools/forecast",
                        params:{
                            username: $rootScope.current_user.username,
                            taskID:task.taskID,
                            companyName :task.companyName,
                            teamName : task.teamName,
                            period:task.period
                        }
                    }
                )
                    .success(function(d){

                    if (d){
                        $scope.forecast = d
                    }

                })

                //$scope.selectedIndex=1

                $scope.submit = function (forecast) {

                    $http({
                            method:'POST',
                            url:"/api/dtools/forecast",
                            data:{
                                username: $rootScope.current_user.username,
                                taskID:task.taskID,
                                companyName :task.companyName,
                                teamName : task.teamName,
                                period:task.period,
                                forecast:forecast
                            }
                        }
                    )
                        .success(function(d){
                            //$window.location.reload();
                        })
                        $mdDialog.cancel();
                        $mdSidenav('taskslist').close()
                    //$rootScope.notificationToast("Submitted application.")
                    $rootScope.sendMessage("Forecast Completed.")
                };
                $timeout(function () {
                    timer('2016-09-16 01:01:38')
                },1000)

                $scope.fileSelected=function(file) {
                    // var fileID =  fileUpload(file)
                    //   console.log(fileID)
                    Upload.upload({
                        url: '/files/upload',
                        data: {files: file}
                    }).then(function (response) {
                        $http({
                                method:'POST',
                                url:"/api/dtools/updatetaskfile",
                                data:{
                                    task_id:task._id,
                                    infoFile:response.data[0]
                                }
                            }
                        ).success(function () {
                                $rootScope.tasklists.forEach(function (t) {
                                    if (t._id == task._id){
                                        t.infoFile = response.data[0]
                                    }
                                })
                                $rootScope.notificationToast('File uploaded.')
                            }
                        )
                    });
                }
            }
        }

        $rootScope.notificationToast = function (message) {
            var toast = $mdToast.simple()
                .content(message)
                .action('OK')
                .highlightAction(false)
                .hideDelay(20000)
                .position('bottom right');
            $mdToast.show(toast).then(function (response) {
                if (response == 'ok') {
                    $mdToast.cancel()
                }
            });
        };
    }])


