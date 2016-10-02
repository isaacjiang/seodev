/**
 * Created by isaacjiang on 10/5/15.
 */
 app.service('current_market_data', function ($http, $location, $q,$rootScope) {
        var deffered = $q.defer();
        var current_data = {};

        current_data.getData = function () {
             $http.get("/server/querycurrentmarketdata?username=" + $rootScope.current_user.username).success(function (d) {
                currentData = d
                deffered.resolve();
            });
            return deffered.promise;
        }
   
      current_data.marketPerformance = function () {
            return currentData.marketPerformance
        }
      current_data.managementPerformance_ci = function () {
            return currentData.managementPerformance_ci
        }
           current_data.managementPerformance_si = function () {
            return currentData.managementPerformance_si
        }
           current_data.managementPerformance_ai = function () {
            return currentData.managementPerformance_ai
        }
            current_data.financialPerformance = function () {
            return currentData.financialPerformance
        }
       
        return current_data
    })

.controller('contentCtrl', ['$scope','windowsize',"$rootScope","$http","current_user","current_market_data",function ($scope,windowsize,$rootScope,$http,current_user,current_market_data) {
      current_user.getData().then(function () {
            $rootScope.current_user = {}
            $rootScope.current_user.username = current_user.username()
            $rootScope.current_user.permission = current_user.permission()
            $rootScope.current_user.status = current_user.status()
            $scope.current_user.settings = current_user.settings()

          current_market_data.getData().then(function(){

              //console.log(current_market_data.managementPerformance_ci())
              var graphwidth=windowsize.width,
                  graphheigh=windowsize.height*0.3

              $scope.marketPerformance = current_market_data.marketPerformance()

              Object.keys($scope.marketPerformance).forEach(function (niche) {
                  var data=[]
                  Object.keys($scope.marketPerformance[niche]).forEach(function (team) {
                      if (team != 'niche'){

                          var periods = [1,2,3,4,5,6,7]
                          periods.forEach(function (p) {
                              console.log()
                              if ($scope.marketPerformance[niche][team].filter(function (n) {
                                      return n.x == p
                                  }).length>0) {

                              }
                              else{
                                  $scope.marketPerformance[niche][team].push({x:p,y:0})
                              }
                          })


                        $scope.marketPerformance[niche][team].sort(function (a,b) {
                               if (a.x > b.x) {
                                    return 1;
                                  }
                                  if (a.x < b.x) {
                                    return -1;
                                  }
                                  // a must be equal to b
                                  return 0;
                          })
                          data.push({values:$scope.marketPerformance[niche][team],key:team,strike:4,color:'#'+Math.random().toString(16).substr(-6)})
                      }
                  })

                  nv.addGraph(function() {
                      var chart = nv.models.lineChart()
                          .clipEdge(true)
                        .useInteractiveGuideline(true)
                          .width(graphwidth)
                          .height(graphheigh)
                        ;

                      chart.xAxis
                        .axisLabel('Market Performance')
                        .tickFormat(function(d){
                            return 'Period '+d
                        });

                      chart.yAxis
                        .axisLabel('%')
                        .tickFormat(d3.format('.02f'))
                        ;

                      d3.select('#'+niche+' svg')
                        .datum(data)
                        .transition().duration(500)
                        .call(chart)
                        .style({ 'width': graphwidth, 'height': graphheigh})
                        ;

                      nv.utils.windowResize(chart.update);

                      return chart;
                });


              })



              $scope.managementPerformance_ci = current_market_data.managementPerformance_ci()

              Object.keys($scope.managementPerformance_ci).forEach(function (category) {
                  var data=[]
                  Object.keys($scope.managementPerformance_ci[category]).forEach(function (team) {
                      if (team != 'category' && team != 'accItem'){

                          var periods = [1,2,3,4,5,6,7]
                          periods.forEach(function (p) {
                              if ($scope.managementPerformance_ci[category][team].filter(function (n) {
                                      return n.x == p
                                  }).length>0) {

                              }
                              else{
                                  $scope.managementPerformance_ci[category][team].push({x:p,y:100})
                              }
                          })


                        $scope.managementPerformance_ci[category][team].sort(function (a,b) {
                               if (a.x > b.x) {
                                    return 1;
                                  }
                                  if (a.x < b.x) {
                                    return -1;
                                  }
                                  // a must be equal to b
                                  return 0;
                          })
                          data.push({values:$scope.managementPerformance_ci[category][team],key:team,color:'#'+Math.random().toString(16).substr(-6)})
                      }
                  })

    // console.log($scope.managementPerformance_ci[category])

                  nv.addGraph(function() {
                      var chart = nv.models.lineChart()
                          .clipEdge(true)
                        .useInteractiveGuideline(true)
                          .width(graphwidth)
                          .height(graphheigh)
                        ;

                      chart.xAxis
                        .axisLabel('Competence Index')
                        .tickFormat(function(d){
                            return 'Period '+d
                        });

                      chart.yAxis
                        .axisLabel('%')
                        .tickFormat(d3.format('.02f'))
                        ;

                      d3.select('#'+$scope.managementPerformance_ci[category].accItem+' svg')
                        .datum(data)
                        .transition().duration(500)
                        .call(chart)
                        .style({ 'width': graphwidth, 'height': graphheigh })
                        ;

                      nv.utils.windowResize(chart.update);

                      return chart;
                });


              })


              $scope.managementPerformance_si = current_market_data.managementPerformance_si()

              Object.keys($scope.managementPerformance_si).forEach(function (category) {
                  var data=[]
                  Object.keys($scope.managementPerformance_si[category]).forEach(function (team) {
                      if (team != 'category' && team != 'accItem'){

                          var periods = [1,2,3,4,5,6,7]
                          periods.forEach(function (p) {
                              if ($scope.managementPerformance_si[category][team].filter(function (n) {
                                      return n.x == p
                                  }).length>0) {

                              }
                              else{
                                  $scope.managementPerformance_si[category][team].push({x:p,y:100})
                              }
                          })


                        $scope.managementPerformance_si[category][team].sort(function (a,b) {
                               if (a.x > b.x) {
                                    return 1;
                                  }
                                  if (a.x < b.x) {
                                    return -1;
                                  }
                                  // a must be equal to b
                                  return 0;
                          })
                          data.push({values:$scope.managementPerformance_si[category][team],key:team,color:'#'+Math.random().toString(16).substr(-6)})
                      }
                  })

     //console.log($scope.managementPerformance_si[category])

                  nv.addGraph(function() {
                      var chart = nv.models.lineChart()
                          .clipEdge(true)
                        .useInteractiveGuideline(true)
                          .width(graphwidth)
                          .height(graphheigh)
                        ;

                      chart.xAxis
                        .axisLabel('Stress Index')
                        .tickFormat(function(d){
                            return 'Period '+d
                        });

                      chart.yAxis
                        .axisLabel('%')
                        .tickFormat(d3.format('.02f'))
                        ;

                      d3.select('#'+$scope.managementPerformance_si[category].accItem+' svg')
                        .datum(data)
                        .transition().duration(500)
                        .call(chart)
                        .style({ 'width': graphwidth, 'height': graphheigh })
                        ;

                      nv.utils.windowResize(chart.update);

                      return chart;
                });


              })


              $scope.managementPerformance_ai = current_market_data.managementPerformance_ai()

              Object.keys($scope.managementPerformance_ai).forEach(function (category) {
                  var data=[]
                  Object.keys($scope.managementPerformance_ai[category]).forEach(function (team) {
                      if (team != 'category' && team != 'accItem'){

                          var periods = [1,2,3,4,5,6,7]
                          periods.forEach(function (p) {
                              if ($scope.managementPerformance_ai[category][team].filter(function (n) {
                                      return n.x == p
                                  }).length>0) {

                              }
                              else{
                                  $scope.managementPerformance_ai[category][team].push({x:p,y:100})
                              }
                          })


                        $scope.managementPerformance_ai[category][team].sort(function (a,b) {
                               if (a.x > b.x) {
                                    return 1;
                                  }
                                  if (a.x < b.x) {
                                    return -1;
                                  }
                                  // a must be equal to b
                                  return 0;
                          })
                          data.push({values:$scope.managementPerformance_ai[category][team],key:team,color:'#'+Math.random().toString(16).substr(-6)})
                      }
                  })

     //console.log($scope.managementPerformance_ai[category])

                  nv.addGraph(function() {
                      var chart = nv.models.lineChart()
                          .clipEdge(true)
                        .useInteractiveGuideline(true)
                          .width(graphwidth)
                          .height(graphheigh)
                        ;

                      chart.xAxis
                        .axisLabel('Adaptability Index')
                        .tickFormat(function(d){
                            return 'Period '+d
                        });

                      chart.yAxis
                        .axisLabel('%')
                        .tickFormat(d3.format('.02f'))
                        ;

                      d3.select('#'+$scope.managementPerformance_ai[category].accItem+' svg')
                        .datum(data)
                        .transition().duration(500)
                        .call(chart)
                        .style({ 'width': graphwidth, 'height': graphheigh })
                        ;

                      nv.utils.windowResize(chart.update);

                      return chart;
                });


              })


              $scope.financialPerformance = current_market_data.financialPerformance()

              Object.keys($scope.financialPerformance).forEach(function (item) {
                  var data=[]
                  Object.keys($scope.financialPerformance[item]).forEach(function (team) {
                      if (team != 'item'){

                          var periods = [1,2,3,4,5,6,7]
                          periods.forEach(function (p) {

                              if ($scope.financialPerformance[item][team].filter(function (n) {
                                      n.y = (n.y/1000).toFixed(0)
                                      return n.x == p
                                  }).length>0) {

                              }
                              else{
                                  $scope.financialPerformance[item][team].push({x:p,y:0})
                              }
                          })


                        $scope.financialPerformance[item][team].sort(function (a,b) {
                               if (a.x > b.x) {
                                    return 1;
                                  }
                                  if (a.x < b.x) {
                                    return -1;
                                  }
                                  // a must be equal to b
                                  return 0;
                          })
                          data.push({values:$scope.financialPerformance[item][team],key:team,color:'#'+Math.random().toString(16).substr(-6)})
                      }
                  })

                  nv.addGraph(function() {
                      var chart = nv.models.lineChart()
                          .clipEdge(true)
                        .useInteractiveGuideline(true)
                          .width(graphwidth)
                          .height(graphheigh)
                        ;

                      chart.xAxis
                        .axisLabel('Financial Performance')
                        .tickFormat(function(d){
                            return 'Period '+d
                        });

                      chart.yAxis
                        .axisLabel('$ k')
                        .tickFormat(d3.format('.02f'))
                        ;

                      d3.select('#'+item+' svg')
                        .datum(data)
                        .transition().duration(500)
                        .call(chart)
                        .style({ 'width': graphwidth, 'height': graphheigh })
                        ;

                      nv.utils.windowResize(chart.update);

                      return chart;
                });


              })
          })
        })




}])
