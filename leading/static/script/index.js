/**
 * Created by isaacjiang on 10/4/15.
 */

app.controller('contentCtrl', ["$scope", "$http", "windowsize", "current_user", "$rootScope", "$timeout", '$mdDialog', 'Upload',
    function ($scope, $http, windowsize, current_user, $rootScope, $timeout, $mdDialog, Upload) {

        // $timeout(function () {
        //     $scope.stopvideo = true
        //     console.log($scope.stopvideo)
        // }, 2000)



        $scope.setTableHeight = function (n) {
            if (n == 1) {
                var style = {height: (windowsize.height - 160) / n + 'px'}
            }
            else {
                var style = {height: (windowsize.height - 174) / n + 'px'}
            }
            return style
        }
        format = function (num) {
            if (num) {
                var n = num.toString(), p = n.indexOf('.');
                return n.replace(/\d(?=(?:\d{3})+(?:\.|$))/g, function ($0, i) {
                    return p < 0 || i < p ? ($0 + ',') : $0;
                });
            }
            else return 0

        }
        current_user.getData().then(function () {
            $rootScope.current_user = {}
            $rootScope.current_user.username = current_user.username()
            $rootScope.current_user.permission = current_user.permission()
            $rootScope.current_user.status = current_user.status()

            $scope.stopvideo = $rootScope.current_user.status.is_active

            $http.get('/api/workflow/queryworkflow', {
                params: {
                    processName: 'mainpage'
                }
            })
                .success(function (res) {
                    //console.log(res)
                    $scope.tasks = []
                    // $scope.functions = []
                    res.forEach(function (t) {
                        $scope.tasks.push(t)
                        //$scope.functions.push(t)
                        if (t.taskKey == "kpi") {
                            t.icon = 'ic_flag_black_48px.svg'

                            // t.colspan = 5
                            // t.rowspan = 5
                            $rootScope.toggleFunction(t)
                        }
                        else if (t.taskKey == "analysis") {

                            t.icon = 'ic_local_shipping_black_48px.svg'
                        }

                        else {
                            t.icon = 'ic_star_black_48px.svg'
                        }
                    })
                })
            $http.get('/api/general/querykpidata', {
                params: {username: $rootScope.current_user.username}
            })
                .success(function (res) {

                    if (Object.keys(res).length > 0) {
                    $scope.hiredEmployees = res.hiredEmployees
                    $scope.workforce = res.workforce
                    $scope.actions = res.actions
                    $scope.resources = res.resources

                    if (res.forecast) {
                        res.forecast.forEach(function (fs) {
                            fs.forecast.b2b = format(fs.forecast.b2b)
                            fs.forecast.b2c = format(fs.forecast.b2c)
                            fs.forecast.newoffering = format(fs.forecast.newoffering)
                        })
                    }
                    $scope.forecast = res.forecast
                        if (res.budget[0]) {
                    $scope.budget = [{
                        name: "B2B",
                        aa: format(res.budget[0].acc_budget.B2B_AA),
                        dm: format(res.budget[0].acc_budget.B2B_DM),
                        pd: format(res.budget[0].acc_budget.B2B_PD)
                    }, {
                        name: "B2C", aa: format(res.budget[0].acc_budget.B2C_AA),
                        dm: format(res.budget[0].acc_budget.B2C_DM), pd: format(res.budget[0].acc_budget.B2C_PD)
                    }]
                        }
                    }

                })


        })
        $scope.query = {
            order: '_id',
            limit: 5,
            page: 1
        };
        $rootScope.toggleFunction = function (func) {
            $scope.selectedFunc = func

        }


}]);

