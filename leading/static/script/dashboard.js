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
            $http.get('/api/general/querydashboarddata', {
                params: {username: $rootScope.current_user.username}
            })
                .success(function (res) {
                    console.log(res)
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


                })
        })
        $scope.query = {
            order: '_id',
            limit: 5,
            page: 1
        };
        $rootScope.toggleFunction = function (func) {

            console.log(func)
            $scope.selectedFunc = func

        }


    }
])