/**
 * Created by isaacjiang on 10/5/15.
 */
app.service('dashboard_data', function ($http, $location, $q, $rootScope) {
    var deffered = $q.defer();
    var current_data = {};

    current_data.getData = function () {
        $http.get("/api/general/querydashboarddata?username=" + $rootScope.current_user.username).success(function (d) {
            currentData = d
            deffered.resolve();
        });
        return deffered.promise;
    }
    current_data.marketPerformance = function () {
        return currentData.marketPerformance
    }

    current_data.managementPerformance = function () {
        return currentData.managementPerformance
    }
    current_data.financialPerformance = function () {
        return currentData.financialPerformance
    }
    return current_data
})
   .service('current_market_data', function ($http, $location, $q,$rootScope) {
        var deffered = $q.defer();
        var current_data = {};

        current_data.getData = function () {
             $http.get("/server/querycurrentmarketdata?username=" + $rootScope.current_user.username).success(function (d) {
                currentData = d
                deffered.resolve();
            });
            return deffered.promise;
        }

      current_data.marketValue = function () {
            return currentData.marketValue
        }
       current_data.managementValue = function () {
            return currentData.managementValue
        }

            current_data.financialValue = function () {
            return currentData.financialValue
        }

        return current_data
    })
   .controller('contentCtrl', ['$scope', 'windowsize', "$rootScope", "$http", "current_user", "dashboard_data", "current_market_data","$timeout", function ($scope, windowsize, $rootScope, $http, current_user, dashboard_data, current_market_data,$timeout) {
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
           // $scope.current_user.settings = current_user.settings()


            if ($rootScope.current_user.status.is_authenticated){
             dashboard_data.getData().then(function () {
                var graphwidth = windowsize.width * 0.6,
                    graphheigh = windowsize.height * 0.3

                var marketPerformance = dashboard_data.marketPerformance()
                var managementPerformance = dashboard_data.managementPerformance()
                var financialPerformance = dashboard_data.financialPerformance()

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

             current_market_data.getData().then(function () {
                var marketValue = current_market_data.marketValue()
                var managementValue= current_market_data.managementValue()
                var financialValue = current_market_data.financialValue()


              //calculate great value

                console.log("value",marketValue,managementValue,financialValue)
                 var total_great_value = {}
                 Object.keys(marketValue).forEach(function (teamName) {
                    total_great_value[teamName] ={}
                     Object.keys(marketValue[teamName]).forEach(function (period) {
                        if (period != 'teamName'){
                        if (financialValue[teamName][period-1].NOCG <=0){financialValue[teamName][period-1].NOCG = 1}
                         total_great_value[teamName][period]= marketValue[teamName][period]*0.3 * managementValue[teamName][period]*0.3 * financialValue[teamName][period-1].NOCG*0.4
                     } })


                 })
                console.log(total_great_value)
                 var max_total_great_value = {}
                 //var currentPeriod = $rootScope.userAtCompany.currentPeriod
                 Object.keys(total_great_value).forEach(function (teamName) {
                     Object.keys(total_great_value[teamName]).forEach(function (currentPeriod) {
                         //console.log(total_great_value[teamName][currentPeriod])
                         if (Object.keys(max_total_great_value).indexOf(currentPeriod)<0){
                              max_total_great_value[currentPeriod] =0
                         }
                         if (total_great_value[teamName][currentPeriod] > max_total_great_value[currentPeriod]) {
                             max_total_great_value[currentPeriod] = total_great_value[teamName][currentPeriod]
                         }
                     })
                 })
                 console.log(max_total_great_value)
                 Object.keys(total_great_value).forEach(function (teamName) {
                     Object.keys(total_great_value[teamName]).forEach(function (currentPeriod) {
                         var value = total_great_value[teamName][currentPeriod]
                         total_great_value[teamName][currentPeriod] = {}
                         total_great_value[teamName][currentPeriod].value = value
                         total_great_value[teamName][currentPeriod].percentage = value / max_total_great_value[currentPeriod]
                         var pe = 0
                         if ($rootScope.userAtCompany.companyName == 'LegacyCo' && currentPeriod <= 4) {
                             pe = 20
                         }
                         else if ($rootScope.userAtCompany.companyName == 'LegacyCo' && currentPeriod == 5) {
                             pe = 5
                         }
                         else if ($rootScope.userAtCompany.companyName == 'LegacyCo' && currentPeriod == 6) {
                             pe = 50
                         }
                         else if ($rootScope.userAtCompany.companyName == 'LegacyCo' && currentPeriod == 7) {
                             pe = 70
                         }
                         else if ($rootScope.userAtCompany.companyName == 'LegacyCo' && currentPeriod == 8) {
                             pe = 80
                         }
                         else if ($rootScope.userAtCompany.companyName == 'NewCo' && currentPeriod == 5) {
                             pe = 50
                         }
                         else if ($rootScope.userAtCompany.companyName == 'NewCo' && currentPeriod == 6) {
                             pe = 70
                         }
                         else if ($rootScope.userAtCompany.companyName == 'NewCo' && currentPeriod == 7) {
                             pe = 80
                         }
                         else if ($rootScope.userAtCompany.companyName == 'NewCo' && currentPeriod == 8) {
                             pe = 40
                         }
                         else {
                             pe = 0
                         }
                         total_great_value[teamName][currentPeriod].PE = pe
                         total_great_value[teamName][currentPeriod].realPE = pe* total_great_value[teamName][currentPeriod].percentage
                         total_great_value[teamName][currentPeriod].EBITDA = financialValue[teamName][currentPeriod-1].EBITDA
                         total_great_value[teamName][currentPeriod].companyValue = financialValue[teamName][currentPeriod-1].EBITDA * total_great_value[teamName][currentPeriod].realPE/100
                         total_great_value[teamName][currentPeriod].sharePrice = total_great_value[teamName][currentPeriod].companyValue/100000
                     })
                 })
                 console.log(total_great_value)
               var great_value =   total_great_value[$rootScope.userAtCompany.teamName]




               $scope.great_value = {}
              var previusCompanyValue = ($rootScope.userAtCompany.currentPeriod-1)>1 ? great_value[$rootScope.userAtCompany.currentPeriod-1].companyValue.toFixed(0): 0
                  var previusSharePrice = ($rootScope.userAtCompany.currentPeriod-1)>1 ? great_value[$rootScope.userAtCompany.currentPeriod-1].sharePrice.toFixed(0): 0
               $scope.great_value.companyValue ={"key":"Company Value","Previus":format(previusCompanyValue),"Current":format(great_value[$rootScope.userAtCompany.currentPeriod].companyValue.toFixed(0))}
               $scope.great_value.sharePrice ={"key":"Share Price","Previus":format(previusSharePrice),"Current":format(great_value[$rootScope.userAtCompany.currentPeriod].sharePrice.toFixed(0))}

console.log($scope.great_value)

                $scope.query = {order: 'niche', page: 1};
                $scope.limit_great_value = {limit: $scope.great_value.length};


            })
            }



        })


        $scope.onpagechange = function (page, limit) {

            //console.log('Scope Page: ' + $scope.query.page + ' Scope Limit: ' + $scope.query.limit);
            //console.log('Page: ' + page + ' Limit: ' + limit);

            var deferred = $q.defer();

            $timeout(function () {
                deferred.resolve();
            }, 2000);

            return deferred.promise;
        };

        $scope.loadStuff = function () {
            var deferred = $q.defer();

            $timeout(function () {
                deferred.reject();
            }, 2000);

            $scope.deferred = deferred.promise;
        };

        $scope.onorderchange = function (order) {

            //console.log('Scope Order: ' + $scope.query.order);
            //console.log('Order: ' + order);

            var deferred = $q.defer();

            $timeout(function () {
                deferred.resolve();
            }, 2000);

            return deferred.promise;
        };




    }])
