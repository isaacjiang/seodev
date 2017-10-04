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


                        }
                        else if (t.taskKey == "market") {
                            t.icon = 'ic_local_shipping_black_48px.svg'
                            $rootScope.toggleFunction(t)
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
                    //console.log(res)
                    var marketPerformance = res.marketPerformance
                    var managementPerformance = res.managementPerformance
                    var financialPerformance = res.financialPerformance
                    console.log(financialPerformance)

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


                    // console.log(financialPerformance)
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
                    // console.log('222', $scope.financialPerformance_value)

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
                            //console.log(period)
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
                            // console.log(total_great_value[teamName][currentPeriod])
                            if (Object.keys(max_total_great_value).indexOf(currentPeriod) < 0) {
                                max_total_great_value[currentPeriod] = 0
                            }
                            if (total_great_value[teamName][currentPeriod] > max_total_great_value[currentPeriod]) {
                                max_total_great_value[currentPeriod] = total_great_value[teamName][currentPeriod]
                            }
                        })
                    })
                    // console.log(max_total_great_value)
                    $scope.total_great_value = []
                    Object.keys(total_great_value).forEach(function (teamName) {

                        var companyValues = [], sharePrices = []

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

                            companyValues.push({
                                x: currentPeriod,
                                y: total_great_value[teamName][currentPeriod].companyValue / 1000000
                            })
                            sharePrices.push({
                                x: currentPeriod,
                                y: total_great_value[teamName][currentPeriod].sharePrice
                            })
                        })


                        $scope.total_great_value.push({
                            values: companyValues,      //values - represents the array of {x,y} data points
                            key: teamName + ' companyValues', //key  - the name of the series.
                            color: '#' + Math.random().toString(16).substr(-6) //color - optional: choose your own line color.
                        })
                        $scope.total_great_value.push({
                            values: sharePrices,      //values - represents the array of {x,y} data points
                            key: teamName + ' sharePrices', //key  - the name of the series.
                            color: '#' + Math.random().toString(16).substr(-6) //color - optional: choose your own line color.
                        })
                    })
                    //console.log(total_great_value)


                    var great_value = total_great_value[$rootScope.user_info.teamInfo.teamName]


                    $scope.great_value = {}
                    var previusCompanyValue = 0
                    var previusSharePrice = 0
                    if ($rootScope.user_info.companyInfo.companyName == "NewCo") {
                        previusCompanyValue = ($rootScope.user_info.companyInfo.currentPeriod - 1) > 3 ?
                            great_value[$rootScope.user_info.companyInfo.currentPeriod - 1].companyValue.toFixed(0) : 0
                        previusSharePrice = ($rootScope.user_info.companyInfo.currentPeriod - 1) > 3 ?
                            great_value[$rootScope.user_info.companyInfo.currentPeriod - 1].sharePrice.toFixed(0) : 0
                    }
                    else {
                        previusCompanyValue = ($rootScope.user_info.companyInfo.currentPeriod - 1) > 1 ?
                            great_value[$rootScope.user_info.companyInfo.currentPeriod - 1].companyValue.toFixed(0) : 0
                        previusSharePrice = ($rootScope.user_info.companyInfo.currentPeriod - 1) > 1 ?
                            great_value[$rootScope.user_info.companyInfo.currentPeriod - 1].sharePrice.toFixed(0) : 0
                    }

                    $scope.great_value.companyValue = {
                        "key": "Company Value",
                        "Previus": format(previusCompanyValue),
                        "Current": format(great_value[$rootScope.user_info.companyInfo.currentPeriod].companyValue.toFixed(0))
                    }
                    $scope.great_value.sharePrice = {
                        "key": "Share Price",
                        "Previus": format(previusSharePrice),
                        "Current": format(great_value[$rootScope.user_info.companyInfo.currentPeriod].sharePrice.toFixed(0))
                    }

                    // console.log($scope.great_value)

                    $scope.query = {order: 'niche', page: 1};
                    $scope.limit_great_value = {limit: $scope.great_value.length};
                })
        })
        $scope.query = {
            order: '_id',
            limit: 10,
            page: 1
        };
        $rootScope.toggleFunction = function (func) {

            $scope.selectedFunc = func
            if (func.taskKey == "value") {
                //console.log($scope.total_great_value)
                nv.addGraph(function () {
                    var chart = nv.models.lineChart()
                            .clipEdge(true)
                            .useInteractiveGuideline(true)
                            .margin({top: 100, left: 80, right: 40})
                            // .width(200)
                            .height(windowsize.height / 2)
                        ;

                    chart.xAxis
                        .axisLabel('Period')
                        .tickFormat(function (d) {
                            return 'Period ' + d
                        });

                    chart.yAxis
                        .axisLabel('Million $')
                        .tickFormat(d3.format('.02f'))
                    ;

                    d3.select('#valuegraph svg')
                        .datum($scope.total_great_value)
                        .transition().duration(500)
                        .call(chart)
                        .style({'width': '100%', 'height': windowsize.height / 2})
                    ;

                    nv.utils.windowResize(chart.update);

                    return chart;
                });

            }
        }


    }
])