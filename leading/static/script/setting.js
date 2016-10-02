/**
 * Created by isaac on 31/08/15.
 */

app.controller('lefttopMenuCtrlSettings', ['$scope', function ($scope) {

        $scope.backtomap = function () {
            window.location.href = '/'
        }
    }])

    .controller('SideNavCtrl', ['$rootScope', "$mdSidenav", function ($rootScope, $mdSidenav) {

    }])

    .controller("settingsCtrl", ["$scope", "$http", "windowsize", "current_user", "$rootScope", "$timeout", '$mdDialog', '$mdEditDialog', function ($scope, $http, windowsize, current_user, $rootScope, $timeout, $mdDialog, $mdEditDialog) {
        current_user.getData().then(function () {
            $scope.current_user = {}
            $scope.current_user.username = current_user.username()
            $scope.current_user.permission = current_user.permission()
            $scope.current_user.status = current_user.status()
            $scope.current_user.settings = current_user.settings()
            console.log($scope.current_user.status)

            $http.get('/rest/workflow/queryworkflow', {
                params: {
                    processName: 'settings',
                    username: $scope.current_user.username
                }
            }).success(function (res) {
                $scope.tasks = res
                $http.get('/rest/tags/gettags', {
                    params: {
                        params: 'all' //also the params could be 'all'
                    }
                }).success(function (res) {
                    $scope.tags = res
                })

                $http({
                    method: 'GET',
                    url: '/rest/users/listallusers',
                    params: {'params': 'all'}
                }).then(function success(res) {
                    $scope.users = res.data
                })

                $http.post('/rest/devices/getdeviceconfig', data = {
                    'key': 'Device',
                    'type': ['IPX', 'FP', 'MUX', 'DEMUX']
                }).then(function success(res) {
                    $scope.deviceConfigs = res.data
                })

                $http.post('/rest/devices/getdeviceconfig', data = {
                    'key': 'Device',
                    'type': ['IPX', 'FP', 'MUX', 'DEMUX']
                }).then(function success(res) {
                    $scope.deviceConfigs = res.data
                })

                //console.log(res)
                $scope.functions = []
                $scope.tasks.forEach(function (t) {
                    t.colspan = 1
                    t.rowspan = 1
                    if (t.taskKey == "systemsettings") {
                        t.icon = 'ic_beenhere_black_48px.svg'
                        t.colspan = 5
                        t.rowspan = 5
                        $rootScope.toggleFunction("systemsettings")
                    }
                    else if (t.taskKey == "userpermission") {
                        t.icon = 'ic_person_black_48px.svg'
                    }
                    else if (t.taskKey == "usersettings") {
                        t.icon = 'ic_folder_shared_black_48px.svg'
                    }
                    else if (t.taskKey == "databackup") {
                        t.icon = 'ic_cloud_download_black_48px.svg'
                    }
                    else if (t.taskKey == "deviceconfig") {
                        t.icon = 'ic_dns_black_48px.svg'
                    }
                    else if (t.taskKey == "tagsmaintenance") {
                        t.icon = 'ic_local_offer_black_48px.svg'
                    }
                    if (t.taskKey != "systemsettings" || t.taskKey != "usersettings")
                        $scope.functions.push(t)
                })
            })

        })

        $scope.setHeight = function () {
            var style = {height: windowsize.height - 80 + 'px'}
            return style
        }
        $scope.setTableHeight = function () {
            var style = {height: windowsize.height - 160 + 'px'}
            return style
        }

        $rootScope.showProgress = function () {
            $mdDialog.show({
                controller: dialogController,
                template: '<md-dialog>' +
                '  <md-dialog-content>' +
                '<div class="md-dialog-content">' +
                '<h4>Hang on, We\'re working for you.</h4>' +
                //'<span flex></span>' +
                '</div>' +
                '  <div style="min-height: 20px;min-width:480px" layout-padding layout-align="center center" layout> ' +
                '<md-progress-linear md-mode="indeterminate" style="width:300px"></md-progress-linear>' +
                '</div>' +
                '<div layout="row" layout-align="end end"><md-button type="button" ng-click="closeDialog()" class="md-primary">Cancel</md-button></div>' +
                '</md-dialog-content>' +
                '</md-dialog>'
            })
        };
        function dialogController($scope, $mdDialog) {
            $scope.closeDialog = function () {
                $mdDialog.hide();
            }
        }

        $scope.cancel = function () {
            $mdDialog.cancel();
        };

        $rootScope.toggleFunction = function (func) {
            $scope.query = {
                order: '_id',
                limit: 5,
                page: 1
            };
            if (func == 'tagsmaintenance') {
                $http.get('/rest/tags/gettags', {
                    params: {
                        params: 'all' //also the params could be 'all'
                    }
                }).success(function (res) {
                    $scope.tags = res
                    //$scope.columns = Object.keys($scope.data[0])

                    $scope.deleteTag = function (d) {
                        confirm = $mdDialog.confirm().title('Delete Tag')
                            .content('<strong> Are you sure to delete tag: ' + d.tagName + '? </strong>')
                            .cancel('No').ok('Yes')

                        $mdDialog.show(confirm).then(function () {
                            $http.post('/rest/tags/deletetag', data = d).success(function (res) {
                                $rootScope.toggleFunction('tagsmaintenance')
                            })
                        }, function () {
                            $mdDialog.cancel()
                        }).finally(function () {
                            confirm = undefined;
                        });
                    }

                    $scope.onChange = function (rec) {
                        $http.post('/rest/tags/settag', data = rec).success(function (res) {
                            $rootScope.toggleFunction('tagsmaintenance')
                        })
                    }

                    $scope.editTag = function (d) {
                        $mdDialog.show({
                            controller: tagCtrl,
                            templateUrl: '/app/workflow/launchworkflow?process=addtags',
                            parent: angular.element(document.body),
                            //targetEvent: task.ev,
                            clickOutsideToClose: false,
                            locals: {selectedTag: d, method: 'edit'}
                        })
                    }

                    $scope.addTag = function () {
                        $mdDialog.show({
                            controller: tagCtrl,
                            templateUrl: '/app/workflow/launchworkflow?process=addtags',
                            parent: angular.element(document.body),
                            //targetEvent: task.ev,
                            clickOutsideToClose: false,
                            locals: {selectedTag: {}, method: 'add'}
                        })
                    }

                    function tagCtrl($scope, $http, selectedTag, method) {
                        $http.post('/rest/devices/getdeviceconfig', data = {
                            'key': 'Device',
                            'type': ['IPX', 'FP', 'MUX', 'DEMUX']
                        }).then(function success(res) {
                            $scope.deviceType = res.data
                            $scope.cancelTag = function () {
                                $mdDialog.cancel();
                            };
                            $scope.selectedType = []
                            if (selectedTag.deviceTypeList != undefined) {
                                $scope.deviceType.forEach(function (d) {
                                    selectedTag.deviceTypeList.forEach(function (t) {
                                        if (t == d.deviceGeneralName) {
                                            $scope.selectedType.push(d)
                                        }
                                    })
                                });
                            }

                            $scope.exists = function (item, list) {
                                return list.indexOf(item) > -1;
                            };

                            $scope.toggle = function (item, list) {
                                var idx = list.indexOf(item);
                                if (idx > -1) {
                                    list.splice(idx, 1);
                                }
                                else {
                                    list.push(item);
                                }
                            };

                            if (method == 'add') {
                                $scope.newTag = {}
                                $scope.title_dialog = 'Add Tag'
                                $scope.newTag.tagType = 'Port'
                                $scope.newTag.method = 'add'
                            } else {
                                $scope.title_dialog = 'Edit Tag'
                                $scope.newTag = selectedTag
                                $scope.newTag.method = 'edit'
                            }

                            $scope.submitTag = function (t) {
                                //console.log($scope.selectedType)
                                var typeList = [];
                                $scope.newTag.deviceTypeList = []
                                $scope.selectedType.forEach(function (t) {
                                    typeList.push(t.deviceGeneralName)
                                })
                                $scope.newTag.deviceTypeList = typeList

                                if ($scope.newTag.tagName == undefined || $scope.newTag.tagName == '' || $scope.newTag.tagName == null) {
                                    $scope.message = 'Tag Name is required.';
                                    $rootScope.notificationToast('Tag Name is required.');
                                } else {
                                    $scope.newTag.tagFilter = false

                                    $http.post('/rest/tags/settag', data = t).success(function (res) {
                                        $mdDialog.cancel();
                                        $rootScope.toggleFunction('tagsmaintenance')
                                    })
                                }
                            }
                        })


                    }


                })

            }
            else if (func == 'userpermission') {
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
            else if (func == 'deviceconfig') {
                $http.post('/rest/devices/getdeviceconfig', data = {
                    'key': 'Device',
                    'type': ['IPX', 'FP', 'MUX', 'DEMUX']
                }).then(function success(res) {
                    $scope.deviceConfigs = res.data
                    //console.log($scope.deviceConfigs)
                    $scope.deviceConfigs.forEach(function (d) {
                        if (d.deviceType == 'IPX') {
                            d.deviceType = 'SWITCH'
                        }
                        if (d.deviceType == 'FP') {
                            d.properties.portsCount = 'None'
                        }
                    })

                })
            }
            else if (func == 'databackup') {
                //console.log(func, func == 'databackup')
                $http.get('/rest/syssetting/listbackup', {
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
                            $http.post('/rest/syssetting/backupsetting', data = t).success(function (res) {
                                $mdDialog.cancel()
                                $rootScope.toggleFunction('userpermission')
                            })

                        }

                        $scope.backup = function () {
                            console.log('backup')
                            $rootScope.showProgress()
                            $http.get('/rest/syssetting/startbackup', {
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
                            $http.post('/rest/syssetting/deletebackup', data = d).success(function (res) {
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
                            $http.post('/rest/syssetting/restore', data = d).success(function (res) {
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
                            $http.post('/rest/syssetting/downloadbackup', data = d).success(function (res) {
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
            else if (func == 'systemsettings') {
                $http.get('/rest/syssetting/getsettings', {
                    params: {
                        params: 'all' //also the params could be 'all'
                    }
                }).success(function (res) {
                    $scope.settings = res
                    //console.log($scope.settings)
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
            else {
                $scope.data = []
                $scope.columns = []
            }

            $scope.functions.forEach(function (f) {
                if (f.taskKey == func) {
                    $timeout(function () {
                        $scope.functions.splice(0, 0, $scope.functions.splice($scope.functions.indexOf(f), 1)[0]);
                        f.colspan = 5;
                        f.rowspan = 5;
                    }, 10)
                }
                else {
                    f.colspan = 1;
                    f.rowspan = 1;
                }
            })
        }


    }
    ])
