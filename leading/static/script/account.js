/**
 * Created by isaacjiang on 2016-10-15.
 */

app.controller("accountCtrl", ["$scope", "$http", "windowsize", "current_user", "$rootScope", "$timeout", '$mdDialog', 'Upload',
    function ($scope, $http, windowsize, current_user, $rootScope, $timeout, $mdDialog, Upload) {
        $scope.setHeight = function () {
            var style = {height: windowsize.height - 80 + 'px'}
            return style
        }
        $scope.setTableHeight = function () {
            var style = {height: windowsize.height - 160 + 'px'}
            return style
        }

        current_user.getData().then(function () {
            $rootScope.current_user = {}
            $rootScope.current_user.username = current_user.username()
            $rootScope.current_user.permission = current_user.permission()
            $rootScope.current_user.status = current_user.status()
            console.log($rootScope.current_user)

            $http.get('/api/workflow/queryworkflow', {
                params: {
                    processName: 'account'
                }
            })
                .success(function (res) {
                   // console.log(res)
                    $scope.tasks = res
                    $scope.functions = []
                    $scope.tasks.forEach(function (t) {
                        t.colspan = 1
                        t.rowspan = 1
                        $scope.functions.push(t)
                        if (t.taskKey == "summary") {
                            t.icon = 'ic_traffic_black_48px.svg'
                            t.colspan = 5
                            t.rowspan = 5
                            $rootScope.toggleFunction("summary")
                        }
                        else if (t.taskKey == "pl") {
                            t.icon = 'ic_network_check_black_48px.svg'
                        }

                        else if (t.taskKey == "balance") {
                            t.icon = 'ic_redeem_black_48px.svg'
                        }
                        else if (t.taskKey == "cashflow") {
                            t.icon = 'ic_attach_money_black_48px.svg'
                        }
                        else{
                            t.icon = 'ic_star_black_48px.svg'
                        }


                    })
                })

        })


        $rootScope.toggleFunction = function (func) {
            $scope.query = {
                order: 'accountDescID',
                limit: 10,
                page: 1
            };

            $http.get('/api/account/getaccountinfo', {
                params: {username: $rootScope.current_user.username}
            }).success(function (res) {
                console.log(res)
                $scope.data_profitAndLoss = res.filter(function (d) {
                    return d.accountDescType == "PL"
                })
                $scope.data_balance = res.filter(function (d) {
                    return d.accountDescType == "BALANCE"
                })
                $scope.data_cashflow = res.filter(function (d) {
                    return d.accountDescType == "CF"
                })
                $scope.data_total = res.filter(function (d) {
                    return d.summaryFLag == true
                })


                // $scope.query = {order: 'accountDescID', page: 1};
                //
                // $scope.limit_profitAndLoss = {limit: $scope.data_profitAndLoss.length};
                // $scope.limit_balance = {limit: $scope.data_balance.length};
                // $scope.limit_cashflow = {limit: $scope.data_cashflow.length};
                // $scope.limit_total = {limit: $scope.data_total.length};
                //console.log($scope.settings)
                //$scope.columns = Object.keys($scope.data[0])


            })

            //
            // if (func == 'summary') {
            //
            // }
            // else if (func == 'pl') {
            //     //console.log(func, func == 'databackup')
            //
            // }
            // else if (func == 'balance') {
            //
            // }
            // else if (func== 'cashflow'){
            //
            // }
            // else {
            //     $scope.data = []
            //     $scope.columns = []
            // }

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