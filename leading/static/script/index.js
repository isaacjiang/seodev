/**
 * Created by isaacjiang on 10/4/15.
 */

app.controller('contentCtrl', ["$scope", "$http", "windowsize", "current_user", "$rootScope", "$timeout", '$mdDialog', 'Upload',
    function ($scope, $http, windowsize, current_user, $rootScope, $timeout, $mdDialog, Upload) {
        //$scope.stopvideo = true
        $timeout(function () {
            $scope.stopvideo = true
            console.log($scope.stopvideo)
        }, 2000)

        $scope.setTableHeight = function (n) {
            var style = {height: (windowsize.height - 160) / n + 'px'}
            return style
        }
        format = function (num) {
            var n = num.toString(), p = n.indexOf('.');
            return n.replace(/\d(?=(?:\d{3})+(?:\.|$))/g, function ($0, i) {
                return p < 0 || i < p ? ($0 + ',') : $0;
            });
        }
        current_user.getData().then(function () {
            $rootScope.current_user = {}
            $rootScope.current_user.username = current_user.username()
            $rootScope.current_user.permission = current_user.permission()
            $rootScope.current_user.status = current_user.status()
            $http.get('/api/workflow/queryworkflow', {
                params: {
                    processName: 'mainpage'
                }
            })
                .success(function (res) {
                    //console.log(res)
                    $scope.tasks = res
                    // $scope.functions = []
                    $scope.tasks.forEach(function (t) {

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
                    console.log(res)
                    $scope.hiredEmployees = res.hiredEmployees

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

