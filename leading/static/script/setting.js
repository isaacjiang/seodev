/**
 * Created by isaac on 31/08/15.
 */

app.controller("settingsCtrl", ["$scope", "$http", "windowsize", "current_user", "$rootScope", "$timeout", '$mdDialog', 'Upload',
        function ($scope, $http, windowsize, current_user, $rootScope, $timeout, $mdDialog, Upload) {

        $scope.setTableHeight = function () {
            var style = {width: windowsize.width - 160 + 'px', height: windowsize.height - 160 + 'px'}
            return style
        }


            current_user.getData().then(function () {
            $rootScope.current_user = {}
            $rootScope.current_user.username = current_user.username()
            $rootScope.current_user.permission = current_user.permission()
            $rootScope.current_user.status = current_user.status()

        $http.get('/api/workflow/queryworkflow', {
                params: {
                    processName: 'settings'
                }
            })
                .success(function (res) {
               // console.log(res)
                $scope.tasks = res
                    //$scope.functions = []
                $scope.tasks.forEach(function (t) {

                    //t.rowspan = 1
                    // $scope.functions.push(t)
                    if (t.taskKey == "systemsettings") {
                        t.icon = 'ic_beenhere_black_48px.svg'
                        //$scope.selectedFunc = t
                        $rootScope.toggleFunction(t)
                    }
                    else if (t.taskKey == "userpermission") {
                        t.icon = 'ic_person_black_48px.svg'
                    }

                    else if (t.taskKey == "databackup") {
                        t.icon = 'ic_cloud_download_black_48px.svg'
                    }
                    else if (t.taskKey == "datainitialization") {
                        t.icon = 'ic_description_black_48px.svg'
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
                limit: 10,
                page: 1
            };
            $scope.selectedFunc = func
            console.log($scope.selectedFunc)
            if (func.taskKey == 'systemsettings') {
                $http.get('/api/syssetting/getsettings', {
                    params: {
                        params: 'all' //also the params could be 'all'
                    }
                }).success(function (res) {
                    $scope.settings = res
                    console.log($scope.settings)
                    //$scope.columns = Object.keys($scope.data[0])

                    $scope.editSetting = function (d) {
                        $mdDialog.show({
                            controller: settingCtrl,
                            templateUrl: '/app/workflow/launchworkflow?process=editsettings',
                            parent: angular.element(document.body),
                            //targetEvent: task.ev,
                            clickOutsideToClose: false,
                            locals: {selectedSetting: d, method: 'edit'}
                        })
                    }

                    function settingCtrl($scope, $http, selectedSetting, method) {
                        $scope.cancelTag = function () {
                            $mdDialog.cancel();
                        };

                        $scope.title_dialog = 'Edit ' + selectedSetting.group
                        $scope.currentSetting = selectedSetting
                        $scope.currentSetting.method = 'edit'


                        $scope.submitTag = function (t) {

                            $http.post('/rest/syssetting/setsystemsetting', data = t).success(function (res) {
                                $mdDialog.cancel();
                                $rootScope.toggleFunction('systemsettings')
                                $rootScope.notificationToast('System setting changed!');
                            })

                        }

                    }

                })

            }
            else if (func.taskKey == 'databackup') {
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
                            // $rootScope.toggleFunction($scope.selectedFunc)
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
            else if (func.taskKey == 'userpermission') {
                $http({
                    method: 'GET',
                    url: '/api/entities/getuserslist'
                }).then(function success(res) {
                    console.log(res)
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
                        confirm = $mdDialog.confirm().title('Delete User!')
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
            else if (func.taskKey == 'datainitialization') {
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
                        //dataConf['objectID'] = response.data.objectID
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
                               // console.log(d)
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
                            //console.log(d)
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
                                //$rootScope.toggleFunction('datainitialization')
                            })
                        }
                    }
                }
            }
            else {
                // $scope.selectedFunc={}
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
