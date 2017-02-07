/**
 * Created by isaacjiang on 2016-10-15.
 */

app.controller("accountCtrl", ["$scope", "$http", "windowsize", "current_user", "$rootScope", "$timeout", '$mdDialog', 'Upload',
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
            console.log($rootScope.current_user)

            $http.get('/api/workflow/queryworkflow', {
                params: {
                    processName: 'account'
                }
            })
                .success(function (res) {

                    $scope.tasks = res
                    $scope.tasks.forEach(function (t) {
                        if (t.taskKey == "summary") {
                            t.icon = 'ic_traffic_black_48px.svg'
                            $rootScope.toggleFunction(t)
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

            $http.get('/api/account/getaccountinfo', {
                params: {username: $rootScope.current_user.username}
            })
                .success(function (res) {
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
                    //console.log($scope.data_profitAndLoss)

                    // console.log(d3.select(".accountcard"))
                    // d3.select(".accountcard").style('width',(windowsize.width-320)+"px").style('height',"100px")
                    // $scope.query = {order: 'accountDescID', page: 1};
                    //
                    // $scope.limit_profitAndLoss = {limit: $scope.data_profitAndLoss.length};
                    // $scope.limit_balance = {limit: $scope.data_balance.length};
                    // $scope.limit_cashflow = {limit: $scope.data_cashflow.length};
                    // $scope.limit_total = {limit: $scope.data_total.length};
                    //console.log($scope.settings)
                    //$scope.columns = Object.keys($scope.data[0])


                })
        })

        $scope.query = {
            order: 'accountDescID',
            limit: 10,
            page: 1
        };
        $rootScope.toggleFunction = function (func) {

            $scope.selectedFunc = func


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