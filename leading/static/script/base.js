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
                            $rootScope.ipc = io('http://' + document.domain + ':' + location.port + "/ipc")
                        }
                        $rootScope.ipc.on('connect', function (d) {
                            console.log('connected.')
                            $rootScope.ipc.emit("join", $rootScope.user_info)
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
                console.log(message)
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
                    //$scope.pdfName = task.taskName+ '  Introduction';
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
                if (['04006','05006','06006','07006'].indexOf(taskName)>=0){actionsfn(task);}
                if (['04008','05008'].indexOf(taskName)>=0){nichesfn(task);}
            }
            if (companyName=='LegacyCo'){
                if (['01001','03001','04001'].indexOf(taskName)>=0){hiringfn(task);}
                if (['01003','05003','06003'].indexOf(taskName)>=0){resourcesfn(task);}
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

                $http.get('/api/general/instruction')

                    .success(function (list) {
                        $scope.instructionMeterial = [[], []]
                        if (list) {
                            list.forEach(function (d) {
                                if (d.content_type == 'application/pdf') {
                                    $scope.instructionMeterial[0].push(d)
                                }
                                else {
                                    $scope.instructionMeterial[1].push(d)
                                }
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
                console.log('addContent')
                Upload.upload({
                    url: '/files/upload',
                    data: {files: file}
                }).then(function (response) {
                    console.log(response)
                $http({
                        method: 'POST',
                    url: "/api/general/instruction",
                        data: {
                            file: response.data[0]
                        }
                    }
                ).success(function (list) {
                    console.log(list)
                    $scope.instructionMeterial = [[], []]
                    if (list) {
                        list.forEach(function (d) {
                            if (d.content_type == 'application/pdf') {
                                $scope.instructionMeterial[0].push(d)
                            }
                            else {
                                $scope.instructionMeterial[1].push(d)
                            }
                        })
                    }
                    $rootScope.notificationToast('Instruction material uploaded.')
                })

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
                    $scope.instructionMeterial = [[], []]
                    if (list) {
                        list.forEach(function (d) {
                            if (d.content_type == 'application/pdf') {
                                $scope.instructionMeterial[0].push(d)
                            }
                            else {
                                $scope.instructionMeterial[1].push(d)
                            }
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
                        console.log(selectedTeam)
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
                         if (e.salaryOffer){offeredEmployees.push(e)}
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
                            $window.location.reload();
                        })
                        $mdDialog.cancel();
                        $mdSidenav('taskslist').close()
                        $rootScope.notificationToast("You made offers to  " + offeredEmployees.length + "  candidates.")

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

                    //$http.post('server/resources',data={"username":$rootScope.current_user.username,"companyName":$rootScope.userAtCompany.companyName,
                    // "teamName":$rootScope.userAtCompany.teamName,selectedResources:$scope.selectedResources})
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
                            $rootScope.notificationToast("Submit application for resources.")
                    })

                    $mdDialog.cancel();
                    $mdSidenav('taskslist').close()
                    $window.location.reload();
                };

                $http({
                        method:'GET',
                        url:"/api/dtools/resource",
                        params:{
                            username: $rootScope.current_user.username,
                            taskID:task.taskID,
                            companyName :task.companyName,
                            teamName : task.teamName,
                            period:task.period
                        }
                    }
                )

               // $http.get('/server/queryresourcesbyusername?username='+$rootScope.current_user.username)
                    .success(function(d){
                        console.log(d)
                    $scope.resources_ls = d.data.filter(function(e){return e.resourceType == "Lobbyist"})
                    $scope.resources_ma = d.data.filter(function(e){return e.resourceType == "AD&DM"})
                    $scope.resources_sa = d.data.filter(function(e){return e.resourceType == "Distribution Partners"})
                    $scope.resources_su = d.data.filter(function(e){return e.resourceType == "Call Centre (inbound)"})
                    $scope.resources_li = d.data.filter(function(e){return e.resourceType == "Production Outsourcer"})
                    $scope.resources_pd = d.data.filter(function(e){return e.resourceType == "Development Partners"})

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
        function workforcefn(task) {

            $mdDialog.show({
                clickOutsideToClose: false,
                bindToController: true,
                controller: workforceCtrl,
                controllerAs: 'dialog',
                templateUrl:  '/api/dtools/getpage?pagename=workforce',
                locals:{func:instructionFn,timer:timerFn}
            });

            function workforceCtrl ($scope,$rootScope,$mdDialog,$http,$timeout,func,timer,Upload) {

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
                    if (d){
                        var forecast =d.forecast.b2b+d.forecast.b2c+d.forecast.newoffering
                        console.log(d)
                        if (d.valueatstart) {
                            d.valueatstart.forEach(function (sv) {
                                d.workforce_def.forEach(function (dv) {
                                    if (sv.functions == dv.functions) {
                                        dv.valueatstart_core = parseInt(sv.adjustedworkforce_core)
                                        dv.valueatstart_contract = parseInt(sv.valueatstart_contract)
                                        dv.valueatstart_total = parseInt(sv.valueatstart_total)
                                    }
                                    else {
                                        dv.valueatstart_core = 0
                                        dv.valueatstart_contract = 0
                                        dv.valueatstart_total = 0
                                    }
                                })

                            })
                        }

                        // for(i=0;i<d.valueatstart.length;i++){
                        //
                        //
                        //     d.workforce_def[i].valueatstart_core = parseInt(d.valueatstart[i].adjustedworkforce_core)
                        //     d.workforce_def[i].valueatstart_contract =  parseInt(d.valueatstart[i].adjustedworkforce_contract)
                        //     d.workforce_def[i].valueatstart_total =  parseInt(d.valueatstart[i].adjustedworkforce_total)
                        //
                        // } }
                        else {
                            for (i = 0; i < d.workforce_def.length; i++) {
                                d.workforce_def[i].valueatstart_core = 0
                                d.workforce_def[i].valueatstart_contract = 0
                                d.workforce_def[i].valueatstart_total = 0
                            }
                        }



                        for (i=0;i<d.workforce_def.length;i++){
                          //  d.workforce_def[i].valueatstart_core = 0
                           // d.workforce_def[i].valueatstart_contract = 0
                            d.workforce_def[i].valueatstart_total =  d.workforce_def[i].valueatstart_core+ d.workforce_def[i].valueatstart_contract

                            d.workforce_def[i].recommended_core =parseInt(forecast/(d.workforce_def[i].recommend_base)*(d.workforce_def[i].coreEmployeeRate))
                            d.workforce_def[i].recommended_contract =parseInt( forecast/(d.workforce_def[i].recommend_base)*(1-d.workforce_def[i].coreEmployeeRate))
                        }
                        $scope.workforce = d.workforce_def
                        //console.log($scope.workforce )
                    }

                })
                $scope.$watch('workforce',function (nVal,oVal) {
                   // console.log(nVal)
                 if (nVal != undefined){
                     $scope.workforce.forEach(function (wf) {
                         if (wf.adjustment_core != undefined || wf.adjustment_contract != undefined){
                             wf.adjustment_core = wf.adjustment_core == undefined? 0: wf.adjustment_core
                             wf.adjustment_contract = wf.adjustment_contract == undefined? 0: wf.adjustment_contract

                             wf.adjustment_total =wf.adjustment_core + wf.adjustment_contract

                             wf.adjustedworkforce_core = formatNum(wf.valueatstart_core + wf.adjustment_core)
                             wf.adjustedworkforce_contract = formatNum(wf.valueatstart_contract + wf.adjustment_contract)
                             wf.adjustedworkforce_total = formatNum(wf.valueatstart_total + wf.adjustment_total)


                             wf.adjustmentcost_core =formatNum((wf.avWage+wf.avExpense)*wf.adjustment_core  + (wf.avWage+wf.avExpense)* (wf.adjustment_core >0? wf.costOfHire:wf.costOfFire))
                             wf.adjustmentcost_contract =formatNum((wf.avWage+wf.avExpense)*wf.adjustment_contract  + (wf.avWage+wf.avExpense)* (wf.adjustment_contract >0? wf.costOfHire:wf.costOfFire))
                             wf.adjustmentcost_total =formatNum((wf.avWage+wf.avExpense)*wf.adjustment_total  + (wf.avWage+wf.avExpense)* (wf.adjustment_total >0? wf.costOfHire:wf.costOfFire))

                             wf.adjustwages_core =formatNum(wf.avWage*wf.adjustment_core  + wf.avWage* (wf.adjustment_core >0? wf.costOfHire:wf.costOfFire))
                             wf.adjustwages_contract =formatNum(wf.avWage*wf.adjustment_contract  + wf.avExpense* (wf.adjustment_contract >0? wf.costOfHire:wf.costOfFire))
                             wf.adjustwages_total =formatNum(wf.avWage*wf.adjustment_total   + wf.avExpense* (wf.adjustment_total  >0? wf.costOfHire:wf.costOfFire))

                             wf.adjustexpenses_core =formatNum(wf.avExpense*wf.adjustment_core  + wf.avExpense* (wf.adjustment_core >0? wf.costOfHire:wf.costOfFire))
                             wf.adjustexpenses_contract =formatNum(wf.avExpense*wf.adjustment_contract  + wf.avExpense* (wf.adjustment_contract >0? wf.costOfHire:wf.costOfFire))
                             wf.adjustexpenses_total =formatNum(wf.avExpense*wf.adjustment_total  + wf.avExpense* (wf.adjustment_total  >0? wf.costOfHire:wf.costOfFire))

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
                        $window.location.reload();})
                    $mdDialog.cancel();
                    $mdSidenav('taskslist').close()
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
                    return $rootScope.user_info.companyInfo.companyName==company || ($rootScope.user_info.companyInfo.companyName =='LegacyCo' && $rootScope.user_info.companyInfo.currentPeriod == 5)
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
                        $window.location.reload();
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
                    //console.log(item)

                    var idx = list.indexOf(item);
                    if (idx > -1) {
                        list.splice(idx, 1);
                    }
                    else {
                        list.push(item);

                        $scope.technicalExperts = item.technicalExperts
                        //console.log(list)

                        $scope.calculatedValues={'marketingLoss':1,'developmentLoss':1,'marketingGain':1,"developmentGain":1}

                        list.forEach(function(d) {
                            $scope.calculatedValues.marketingLoss = $scope.calculatedValues.marketingLoss * d.marketingLoss
                            $scope.calculatedValues.developmentLoss = $scope.calculatedValues.developmentLoss * d.developmentLoss
                            $scope.calculatedValues.marketingGain = $scope.calculatedValues.marketingGain * d.marketingGain
                            $scope.calculatedValues.developmentGain = $scope.calculatedValues.developmentLoss * d.developmentGain
                        })
                        $scope.calculatedValues.marketingLoss =($scope.calculatedValues.marketingLoss*100).toFixed(2)
                        $scope.calculatedValues.developmentLoss =($scope.calculatedValues.developmentLoss*100).toFixed(2)
                        $scope.calculatedValues.marketingGain =($scope.calculatedValues.marketingGain*100).toFixed(2)
                        $scope.calculatedValues.developmentGain =($scope.calculatedValues.developmentGain*100).toFixed(2)

                        var sumInfluence={'VRKidEd':0,"GovVR":0,"VRGames":0,"MilitaryVR":0,"AdEdVR":0,"VRCinema":0}
                        list.forEach(function(d){

                            if(d.category == "ProductDeveloper"){
                                sumInfluence.VRKidEd += d.technicalExperts.sum* d.influenceBVs.VRKidEd
                                sumInfluence.GovVR += d.technicalExperts.sum* d.influenceBVs.GovVR
                                sumInfluence.VRGames += d.technicalExperts.sum* d.influenceBVs.VRGames
                                sumInfluence.MilitaryVR += d.technicalExperts.sum* d.influenceBVs.MilitaryVR
                                sumInfluence.AdEdVR += d.technicalExperts.sum* d.influenceBVs.AdEdVR
                                sumInfluence.VRCinema += d.technicalExperts.sum* d.influenceBVs.VRCinema
                            }

                        })

                        $scope.sumInfluenceSales={'VRKidEd':0,"GovVR":0,"VRGames":0,"MilitaryVR":0,"AdEdVR":0,"VRCinema":0}
                        list.forEach(function(d){
                            if(d.category == "Salespeople"){
                                $scope.sumInfluenceSales.VRKidEd +=sumInfluence.VRKidEd * d.influenceBVs.VRKidEd
                                $scope.sumInfluenceSales.GovVR += sumInfluence.GovVR * d.influenceBVs.GovVR
                                $scope.sumInfluenceSales.VRGames += sumInfluence.VRGames * d.influenceBVs.VRGames
                                $scope.sumInfluenceSales.MilitaryVR += sumInfluence.MilitaryVR * d.influenceBVs.MilitaryVR
                                $scope.sumInfluenceSales.AdEdVR += sumInfluence.AdEdVR * d.influenceBVs.AdEdVR
                                $scope.sumInfluenceSales.VRCinema += sumInfluence.VRCinema * d.influenceBVs.VRCinema
                            }

                        })
                    }

                };

                $scope.exists = function (item, list) {

                    return list.indexOf(item) > -1 ;
                };
                $scope.funding={additionalProductDevelopment:0,desiredSalesBudget:0}

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
                       $window.location.reload();
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
                            console.log(data)
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

                                    if (d.title=="Top Salespeople") {
                                        $scope.negotiationhr_sales.forEach(function (e) {
                                            //console.log(e.employeeID, d.employeeID,e)
                                            if (e.employeeID == d.employeeID) {e.selected = true}
                                        })}
                                    else if (d.title=="Technical Experts"){
                                        $scope.negotiationhr_te.forEach(function (e) {
                                            if (e.employeeID == d.employeeID) {e.selected = true}
                                        })}
                                    else{$scope.negotiationhr_pd.forEach(function (e) {
                                        if (e.employeeID == d.employeeID) {e.selected = true}
                                    })}

                                    $scope.toggle(d,$scope.selectedEmployees)

                                })

                                $scope.funding =data.taskdata.negotiation.funding
                                $scope.sumInfluenceSales =data.taskdata.negotiation.sumInfluenceSales
                                $scope.calculatedValues =data.taskdata.negotiation.calculatedValues
                                $scope.applyStatus = data.taskdata.status
                            }
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

                            $mdDialog.cancel();
                            $mdSidenav('taskslist').close()
                            $window.location.reload();
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
                   // console.log($rootScope.userAtCompany.companyName)
                    $scope.actions = d.data.filter(function (d) {
                        return d.companyName ==task.companyName
                    })
                    $scope.leadershipActions=[]
                    $scope.marketingActions=[]
                    $scope.salesActions=[]
                    $scope.supportActions=[]
                    $scope.logisticsActions=[]
                    $scope.productdevelopmentActions=[]
                    console.log(d)
                    $scope.actions.forEach(function(action){
                        if (action.category == "leadership"){  $scope.leadershipActions.push(action)}
                        else if (action.category == "marketing"){$scope.marketingActions.push(action)}
                        else if (action.category == "sales"){$scope.salesActions.push(action)}
                        else if (action.category == "support"){$scope.supportActions.push(action)}
                        else if (action.category == "logisticsit"){$scope.logisticsActions.push(action)}
                        else if (action.category == "productdevelopment"){$scope.productdevelopmentActions.push(action)}
                    })

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
                            $window.location.reload();
                        })


                        $mdDialog.cancel();
                        $mdSidenav('taskslist').close()
                    },function(){
                        projectfn($event)
                    })

                };
                // $http.get('/server/querywithdata?keyword=allprojects')
                $http({
                        method:'GET',
                        url:"/api/dtools/projects",
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
                        console.log(d)
                    $scope.projects = d.data
                    $scope.projects.forEach(function(d){
                        d.totalCost = d.costHitPDbudget.period2+d.costHitPDbudget.period3+d.costHitPDbudget.period4+d.costHitPDbudget.period5+d.costHitPDbudget.period6+d.costHitPDbudget.period7
                        d.elapsedDevTimePeriods= d.finalAtPeriod- d.startAtPeriodconsole
                        if (d.status == "Compulsory"){
                            $scope.selectedProjects.push(d)
                        }
                    })
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
        function visionarycompetitionfn(task) {
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
                    .success(function (data) {
                    console.log(data)
                        if (data) {
                            var visionaries = [{
                                name: 'VRKidEd',
                                infuenceUnits: data.negotiation.sumInfluenceSales.VRKidEd,
                                pitchCost: 40000
                            },
                                {
                                    name: 'GovVR',
                                    infuenceUnits: data.negotiation.sumInfluenceSales.GovVR,
                                    pitchCost: 30000
                                },
                                {
                                    name: 'VRGames',
                                    infuenceUnits: data.negotiation.sumInfluenceSales.VRGames,
                                    pitchCost: 50000
                                },
                                {
                                    name: 'MilitaryVR',
                                    infuenceUnits: data.negotiation.sumInfluenceSales.MilitaryVR,
                                    pitchCost: 40000
                                },
                                {
                                    name: 'AdEdVR',
                                    infuenceUnits: data.negotiation.sumInfluenceSales.AdEdVR,
                                    pitchCost: 35000
                                },
                                {
                                    name: 'VRCinema',
                                    infuenceUnits: data.negotiation.sumInfluenceSales.VRCinema,
                                    pitchCost: 25000
                                }
                            ].sort(function () {
                                return Math.random() * 3 - 1
                            })
                            $scope.uncommittedTime = data.negotiation.funding.additinalProductDeveloperNumber * 120
                            $scope.uncommittedSales = data.negotiation.funding.additinalSalesNumber * 40000

                            $scope.visionary = visionaries[0]
                            $scope.progress = 0
                            setInterval(function () {
                                //console.log($scope.progress)
                                $scope.progress += 1
                                if ($scope.progress >= 100) {
                                    $scope.progress = 0
                                    $scope.visionary = visionaries[Math.floor((Math.random() * 6))]
                                    $rootScope.notificationToast('Visionary changed to ' + $scope.visionary.name + '. Please wait two minutes.')
                                }
                            }, 100)
                        }
                })


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
                        $window.location.reload();
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

                //$http.get('/server/querynewconegotiation2withconditions?teamname='+$rootScope.userAtCompany.teamName)
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
                    }

                    else{
                        $scope.estimatedIncome=[{"period":4,"VREducation":{"customers":0,"share":0},"VRGovernment":{"customers":0,"share":0},"VREntertainment":{"customers":0,"share":0}},
                            {"period":5,"VREducation":{"customers":0,"share":0},"VRGovernment":{"customers":0,"share":0},"VREntertainment":{"customers":0,"share":0}}]
                        $scope.Costs=[{"period":4,"marketing":0,"sales":0,"support":0,"logisticsit":0,"development":0},
                            {"period":5,"marketing":0,"sales":0,"support":0,"logisticsit":0,"development":0}]

                    }
                })
                //$scope.selectedIndex=1
                // $http.get('/server/queryworkforceatstart?username='+$rootScope.current_user.username).success(function(d){
                //     // console.log(d)
                //     $scope.workforce={"marketing": {"valueatstart": d.marketing.adjustment+d.marketing.valueatstart, "valuebyhr": d.marketing.adjustment+d.marketing.valueatstart+100, "adjustment": 0},
                //         "sales": {"valueatstart": d.sales.adjustment+d.sales.valueatstart, "valuebyhr": d.sales.adjustment+d.sales.valueatstart+100, "adjustment": 0},
                //         "support": {"valueatstart": d.support.adjustment+d.support.valueatstart, "valuebyhr": d.support.adjustment+d.support.valueatstart+100, "adjustment": 0},
                //         "logisticsit": {"valueatstart": d.logisticsit.adjustment+d.logisticsit.valueatstart, "valuebyhr": d.logisticsit.adjustment+d.logisticsit.valueatstart+100, "adjustment": 0},
                //         "productdevelopment": {"valueatstart": d.productdevelopment.adjustment+d.productdevelopment.valueatstart, "valuebyhr": d.productdevelopment.adjustment+d.productdevelopment.valueatstart+100, "adjustment": 0}}
                // })

                $scope.submit = function (estimatedIncome,Costs,expenditure,action) {

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
                                estimatedIncome:estimatedIncome,costs:Costs,expenditure:expenditure,action:action
                            }
                        }
                    )

                        .success(function(d){
                        $window.location.reload();
                        console.log(d)})
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
                        $window.location.reload();
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
                    console.log(d)
                    $scope.niches =[{'niche':'',p4:'',p5:'',p6:'',p7:'',p8:''},{'niche':'',p4:'',p5:'',p6:'',p7:'',p8:''},{'niche':'',p4:'',p5:'',p6:'',p7:'',p8:''}]
                        d.forEach(function (n) {
                        if (n.niche == "Education"){
                            if(n.period == 4){ $scope.niches[0].niche= "Education",$scope.niches[0].p4 = n;}
                            if(n.period == 5){ $scope.niches[0].niche= "Education",$scope.niches[0].p5 = n;}
                            if(n.period == 6){ $scope.niches[0].niche= "Education",$scope.niches[0].p6 = n;}
                            if(n.period == 7){ $scope.niches[0].niche= "Education",$scope.niches[0].p7 = n;}
                            if(n.period == 8){ $scope.niches[0].niche= "Education",$scope.niches[0].p8 = n;}
                        }
                        if  (n.niche == "Government"){
                            if(n.period == 4){ $scope.niches[1].niche= "Government",$scope.niches[1].p4 = n;}
                            if(n.period == 5){ $scope.niches[1].niche= "Government",$scope.niches[1].p5 = n;}
                            if(n.period == 6){ $scope.niches[1].niche= "Government",$scope.niches[1].p6 = n;}
                            if(n.period == 7){ $scope.niches[1].niche= "Government",$scope.niches[1].p7 = n;}
                            if(n.period == 8){ $scope.niches[1].niche= "Government",$scope.niches[1].p8 = n;}
                        }
                        if  (n.niche == "Entertainment"){
                            if(n.period == 4){ $scope.niches[2].niche= "Entertainment",$scope.niches[2].p4 = n;}
                            if(n.period == 5){ $scope.niches[2].niche= "Entertainment",$scope.niches[2].p5 = n;}
                            if(n.period == 6){ $scope.niches[2].niche= "Entertainment",$scope.niches[2].p6 = n;}
                            if(n.period == 7){ $scope.niches[2].niche= "Entertainment",$scope.niches[2].p7 = n;}
                            if(n.period == 8){ $scope.niches[2].niche= "Entertainment",$scope.niches[2].p8 = n;}
                        }
                    })
                    //  console.log($scope.niches)
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

                $http.get('/server/querycorporateswithconditions?company='+$rootScope.userAtCompany.companyName+
                    "&period="+$rootScope.userAtCompany.currentPeriod).success(function(data){
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

                $scope.offer={current_share_price:98,treasury_shares:4900}

                $scope.submit = function (selectedNiches,event) {

                    //console.log(selectedNiches)
                    $http.post('server/visionarycompetition',data={companyName:$rootScope.userAtCompany.companyName,teamName:$rootScope.userAtCompany.teamName,selectedNiches:selectedNiches}).success(function(d){
                        console.log(d)
                        $window.location.reload();
                    })


                    $mdDialog.cancel();
                    $mdSidenav('left').close()
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


