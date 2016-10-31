/**
 * Created by isaacjiang on 2016-10-15.
 */

app.controller("dashboardCtrl", ["$scope", "$http", "windowsize", "current_user", "$rootScope", "$timeout", '$mdDialog', 'Upload',
    function ($scope, $http, windowsize, current_user, $rootScope, $timeout, $mdDialog, Upload) {

        $scope.setTableHeight = function () {
            var style = {width: windowsize.width - 160 + 'px', height: windowsize.height - 160 + 'px'}
            return style
        }
        format =function (num){
            var n = num.toString(), p = n.indexOf('.');
            return n.replace(/\d(?=(?:\d{3})+(?:\.|$))/g, function($0, i){
                return p<0 || i<p ? ($0+',') : $0;
            });
        }
        current_user.getData().then(function () {
            $rootScope.current_user = {}
            $rootScope.current_user.username = current_user.username()
            $rootScope.current_user.permission = current_user.permission()
            $rootScope.current_user.status = current_user.status()
            $http.get('/api/workflow/queryworkflow', {
                params: {
                    processName: 'dashboard'
                }
            })
                .success(function (res) {
                    //console.log(res)
                    $scope.tasks = res
                    // $scope.functions = []
                    $scope.tasks.forEach(function (t) {

                        //$scope.functions.push(t)
                        if (t.taskKey == "value") {
                            t.icon = 'ic_flag_black_48px.svg'
                            // t.colspan = 5
                            // t.rowspan = 5
                            $rootScope.toggleFunction(t)
                        }
                        else if (t.taskKey == "market") {
                            t.icon = 'ic_local_shipping_black_48px.svg'
                        }
                        else if (t.taskKey == "financial") {
                            t.icon = 'ic_multiline_chart_black_48px.svg'
                        }
                        else if (t.taskKey == "management") {
                            t.icon = 'ic_business_center_black_48px.svg'
                        }
                        else{
                            t.icon = 'ic_star_black_48px.svg'
                        }
                    })
                })
        })

        $rootScope.toggleFunction = function (func) {
            $scope.query = {
                order: '_id',
                limit: 5,
                page: 1
            };
            console.log(func)
            $scope.selectedFunc = func
            if (func.taskKey == 'value') {
                $http.get('/api/general/querydashboarddata', {
                    params:{username:$rootScope.current_user.username}
                }).success(function (res) {
                    console.log(res)
                    var marketPerformance = res.marketPerformance
                    var managementPerformance = res.managementPerformance
                    var financialPerformance = res.financialPerformance
                    var niches = ['B2B', 'B2C', 'Education', 'Government', 'Entertainment']
                    var periods = ['Previous', 'Current']
                    var accountDescID = ['AB010','AB011', 'AB012', 'AB013', 'AB014', 'AB015']
                    var accountDesc = ['Leadership','Marketing & Sales', 'Digital Marketing', 'Offering Suppport', 'Product development', 'Logistics & IT']
                    var financialItem = ['Return on Sales', 'Return on Assets', 'Net Operating Cash Generated']

                    $scope.marketPerformance_value = {}
                    niches.forEach(function (n, i) {
                        var value = {}
                        periods.forEach(function (p) {
                            if (marketPerformance != undefined && marketPerformance.length > 0) {
                                var mp = marketPerformance.filter(function (m) {
                                    return m.niche == n && m.period == p
                                })
                                value[p] = mp.length > 0 ? (mp[0].shareRate*100).toFixed(0) +'%': 0
                                value['rank'+p] = mp.length > 0 ? '#' +mp[0].ranking:'#'

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

                                value['competenceIndex'+p] = mp.length > 0 ? (mp[0].competenceIndex * 100).toFixed(0) : 100
                                value['competenceIndexRank'+p] = mp.length > 0 ? "#"+mp[0].competenceIndexRank : '#'
                                value['stressIndex'+p] = mp.length > 0 ? (mp[0].stressIndex * 100).toFixed(0) : 100
                                value['stressIndexRank'+p] = mp.length > 0 ? "#"+mp[0].stressIndexRank : '#'
                                value['adaptabilityIndex'+p] = mp.length > 0 ? (mp[0].adaptabilityIndex * 100).toFixed(0) : 100
                                value['adaptabilityIndexRank'+p] = mp.length > 0 ? "#"+mp[0].adaptabilityIndexRank : '#'
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

                                    if (i == 0 && m.period == p) {
                                        value_return_on_sales[p] = (m.values.ROS*100).toFixed(0)+'%'
                                        value_return_on_sales['rank'+p] = "#"+ m.values.ROSrank
                                    }
                                    if (i == 1 && m.period == p) {
                                        value_return_on_assest[p] = (m.values.ROA*100).toFixed(0)+'%'
                                        value_return_on_assest['rank'+p] =  "#"+m.values.ROArank
                                    }
                                    if (i == 2 && m.period == p) {

                                        value[p] = format(m.values.NOCG.toFixed(0))
                                        value['rank'+p] = "#"+ m.values.NOCGrank
                                    }
                                })
                            }
                        })
                        if (i == 0) {
                            $scope.financialPerformance_value[fi] = {"financialItem": fi, "values": value_return_on_sales}
                        }
                        else if (i == 1) {
                            $scope.financialPerformance_value[fi] = {"financialItem": fi, "values": value_return_on_assest}
                        }
                        else {
                            $scope.financialPerformance_value[fi] = {"financialItem": fi, "values": value}
                        }


                        //$scope.financialPerformance_value[acc] = {"function":accountDesc[i],"values":value}
                    })
                    //console.log($scope.financialPerformance_value)
                    $scope.query_mp = {order: 'Item', page: 1};
                    $scope.limit_financialPerformance_value = {limit: $scope.financialPerformance_value.length};


                })

            }
            else if (func.taskKey == 'market') {
                //console.log(func, func == 'databackup')
                $http.get('/api/syssetting/listbackup', {
                    params: {
                        params: 'all' //also the params could be 'all'
                    }
                }).success(function (res) {
                    $scope.backupRecords = res
                    //$scope.columns = Object.keys($scope.data[0])
                    //console.log(res)

                    $scope.backupsetting = function () {
                        $mdDialog.show({
                            controller: backupsettingCtrl,
                            templateUrl: '/app/system/backupsetting',
                            parent: angular.element(document.body),
                            clickOutsideToClose: false,
                            locals: {username: $scope.current_user.username}
                        })
                    }

                    function backupsettingCtrl($scope, $http, username) {
                        //console.log('username', username)
                        $scope.cancel = function () {
                            $mdDialog.cancel();
                        };
                        $scope.newSetting = {username: username}
                        $scope.selectedMethod = 'single'
                        $scope.newSetting.startDate = new Date()
                        $scope.newSetting.starthour = new Date().getHours()
                        $scope.newSetting.startminute = (new Date().getMinutes() / 5).toFixed(0) * 5
                        //console.log($scope.newSetting.startminute)
                        $scope.hours = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]
                        $scope.minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]
                        //console.log($scope.newSetting)

                        $scope.saveBackupSetting = function (t) {
                            $http.post('/api/syssetting/backupsetting', data = t).success(function (res) {
                                console.log(res)
                                $mdDialog.cancel()
                                $rootScope.toggleFunction('userpermission')
                            })

                        }

                        $scope.backup = function () {
                            console.log('backup')
                            // $rootScope.showProgress()
                            $http.get('/api/syssetting/startbackup', {
                                params: {
                                    username: username
                                }

                            }).success(function (res) {
                                $scope.backupRecords = res
                                $rootScope.toggleFunction('databackup')
                                $timeout(function () {
                                    $mdDialog.cancel()
                                }, 500)


                            })

                        }
                    }

                    $scope.deleteBackup = function (d) {

                        var confirm = $mdDialog.confirm().title('Delete Backup!')
                            .content('<strong> Are you sure to delete \"' + d.backupName + '\" ? </strong>')
                            .cancel('No').ok('Yes')

                        $mdDialog.show(confirm).then(function () {
                            $rootScope.showProgress()
                            $http.post('/api/syssetting/deletebackup', data = d).success(function (res) {
                                $scope.backupRecords = res
                                $mdDialog.cancel()
                                $rootScope.toggleFunction('databackup')
                            })
                        }, function () {
                            $mdDialog.cancel()
                            $rootScope.toggleFunction('databackup')
                        }).finally(function () {
                            confirm = undefined;
                        });
                    }

                    $scope.restore = function (d) {
                        var confirm = $mdDialog.confirm().title('restore Backup!')
                            .content('<strong> Are you sure to restore \"' + d.backupName + '\" ? </strong>')
                            .cancel('No').ok('Yes')

                        $mdDialog.show(confirm).then(function () {
                            $rootScope.showProgress()
                            $http.post('/api/syssetting/restore', data = d).success(function (res) {
                                $scope.cancel()
                                $scope.backupRecords = res
                            })
                        }, function () {
                            $mdDialog.cancel()
                            $rootScope.toggleFunction('databackup')
                        }).finally(function () {
                            confirm = undefined;
                        });
                    }

                    $scope.downloadbackup = function (d) {
                        // console.log(d)
                        var confirm = $mdDialog.confirm().title('Download Backup file')
                            .content('<strong> Download \"' + d.backupName + '\" ? </strong>')
                            .cancel('No').ok('Yes')

                        $mdDialog.show(confirm).then(function () {
                            $rootScope.showProgress()
                            $http.post('/api/syssetting/downloadbackup', data = d).success(function (res) {
                                $mdDialog.cancel()
                                $scope.backupRecords = res
                                $rootScope.toggleFunction('databackup')
                            })
                        }, function () {
                            $mdDialog.cancel()
                        }).finally(function () {
                            confirm = undefined;
                        });
                    }

                })
            }
            else if (func.taskKey == 'financial') {
                $http({
                    method: 'GET',
                    url: '/rest/users/listallusers',
                    params: {'params': 'all'}
                }).then(function success(res) {
                    //console.log(res.data)
                    $scope.users = res.data
                    $scope.users.forEach(function (u) {
                        switch (u.permission) {
                            case '0':
                                u.permissionText = 'Superuser (Read/Write)';
                                break;
                            case '1':
                                u.permissionText = 'User (Read/Write)';
                                break;
                            case '2':
                                u.permissionText = 'User (Read Only)';
                                break;
                            default:
                                break;
                        }
                    })

                    $scope.deleteUser = function (u) {
                        confirm = $mdDialog.confirm().title('Delete Tag!')
                            .content('<strong> Are you sure to delete user: ' + u.username + '? </strong>')
                            .cancel('No').ok('Yes')

                        $mdDialog.show(confirm).then(function () {
                            $http.post('/rest/users/deleteuser', data = u).success(function (res) {
                                $rootScope.toggleFunction('userpermission')
                            })
                        }, function () {
                            $mdDialog.cancel()
                        }).finally(function () {
                            confirm = undefined;
                        });
                    }

                    $scope.editUser = function (t) {
                        $mdDialog.show({
                            controller: userCtrl,
                            templateUrl: '/app/workflow/launchworkflow?process=editusers',
                            parent: angular.element(document.body),
                            //targetEvent: task.ev,
                            clickOutsideToClose: false,
                            locals: {selectedUser: t, method: 'edit', allUser: $scope.users}
                        })
                    }

                    $scope.addUser = function () {
                        $mdDialog.show({
                            controller: userCtrl,
                            templateUrl: '/app/workflow/launchworkflow?process=addusers',
                            parent: angular.element(document.body),
                            //targetEvent: task.ev,
                            clickOutsideToClose: false,
                            locals: {selectedUser: {}, method: 'add', allUser: $scope.users}
                        })
                    }

                    function userCtrl($scope, $http, selectedUser, method, allUser) {
                        $scope.cancel = function () {
                            $mdDialog.cancel();
                        };
                        if (method == 'add') {
                            $scope.newUser = {}
                            $scope.title_dialog = 'Add User'
                            userUrl = "/rest/users/register"
                        } else {
                            $scope.title_dialog = 'Edit User'
                            $scope.newUser = selectedUser
                            userOriginName = selectedUser.username
                            $scope.newUser.password = ''
                            userUrl = "/rest/users/modifieduser"
                        }

                        $scope.saveUser = function (newUser) {
                            userExist = false
                            allUser.forEach(function (d) {
                                if (d.username == newUser.username) {
                                    userExist = true
                                }
                            })
                            if (newUser.username == "" || newUser.username == undefined) {
                                $scope.message = "Please enter a username and password."
                            }
                            else if ((method == 'add' && userExist) || (newUser.username != selectedUser.username && userExist)) {
                                $scope.message = "This user name already exist, Please enter another one."
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
                                if (method != 'add' && userOriginName != undefined && userOriginName != selectedUser.username) {
                                    newUser.OriginName = userOriginName
                                    console.log(userOriginName)
                                }


                                $http.post(userUrl, newUser).success(function (d) {
                                    $mdDialog.cancel();
                                    $rootScope.toggleFunction('userpermission')
                                })
                            }
                        }
                    }
                })
            }
            else if (func.taskKey == 'management') {
                $http({
                        method:'GET',
                        url:"/api/syssetting/getdataconfig"
                    }
                )
                    .success(function(d){
                        // console.log(d)
                        $scope.dataConf =d
                    })

                $scope.fileSelected=function(file,dataConf) {

                    Upload.upload({
                        url: '/api/syssetting/savefiletmp',
                        data: {files: file}
                    }).then(function (response) {

                        dataConf['filename']=response.data.filename
                        dataConf['upload_date']=response.data.upload_date
                        dataConf['objectID'] = response.data.objectID
                        dataConf['content_type'] = response.data.content_type
                        dataConf['length'] = response.data.length
                        dataConf['status']=response.data.status

                        $http({
                                method:'POST',
                                url:"/api/syssetting/datainitialize",
                                data:dataConf
                            }
                        )
                            .success(function(d){
                                console.log(d)
                                $rootScope.notificationToast(d.status)
                                $mdDialog.cancel();
                                $rootScope.toggleFunction('datainitialization')
                            })
                    });
                }
                $scope.downloadfile = function (dataConf) {
                    console.log(dataConf)
                    $http({
                            method: 'POST',
                            url: "/api/syssetting/generatefile",
                            data: dataConf
                        }
                    )
                        .success(function (d) {
                            //if(!contentType) contentType = 'application/octet-stream';
                            location.href = '/api/syssetting/getfiletmp?filename=' + d['filename']
                            console.log(d)
                        })

                }

                $scope.addDataConf = function () {
                    $mdDialog.show({
                        controller: addDataConfCtrl,
                        templateUrl: '/app/system/datainit',
                        parent: angular.element(document.body),
                        clickOutsideToClose: false,
                        locals: {}
                    })
                    function addDataConfCtrl($scope, $http) {
                        $scope.cancel = function () {
                            $mdDialog.cancel();
                        };
                        $scope.saveDataConf = function (dataConf) {
                            $http({
                                    method:'POST',
                                    url:"/api/syssetting/setdataconfig",
                                    data:dataConf
                                }
                            ).success(function (d) {
                                console.log(d)
                                $mdDialog.cancel();
                                $rootScope.toggleFunction('datainitialization')
                            })
                        }
                    }
                }
            }
            else {
                $scope.data = []
                $scope.columns = []
            }

            // $scope.functions.forEach(function (f) {
            //     if (f.taskKey == func) {
            //         $timeout(function () {
            //             $scope.functions.splice(0, 0, $scope.functions.splice($scope.functions.indexOf(f), 1)[0]);
            //             f.colspan = 5;
            //             f.rowspan = 5;
            //         }, 10)
            //     }
            //     else {
            //         f.colspan = 1;
            //         f.rowspan = 1;
            //     }
            // })
        }


    }
])