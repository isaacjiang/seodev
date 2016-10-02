/**
 * Created by isaacjiang on 10/5/15.
 */

app.controller('contentCtrl', ['$scope', "$http", "$rootScope", "$timeout", 'current_user','$q',function ($scope, $http, $rootScope,  $timeout,  current_user,$q) {

  current_user.getData().then(function () {
   $rootScope.current_user = {}
   $rootScope.current_user.username = current_user.username()
   $rootScope.current_user.permission = current_user.permission()
   $rootScope.current_user.status = current_user.status()
   $scope.current_user.settings = current_user.settings()


    $http.get("/server/queryaccounts",{params:{username:$rootScope.current_user.username}}).success(function(data){

       $scope.data_profitAndLoss = data.filter(function(d){return d.accountDescType=="PL"})
       $scope.data_balance = data.filter(function(d){return d.accountDescType=="BALANCE"})
       $scope.data_cashflow = data.filter(function(d){return d.accountDescType=="CF"})
       $scope.data_total = data.filter(function(d){return d.summaryFLag==true})

        console.log(data)


       $scope.query = {order: 'accountDescID', page: 1};

       $scope.limit_profitAndLoss = {limit: $scope.data_profitAndLoss.length};
       $scope.limit_balance = {limit: $scope.data_balance.length};
       $scope.limit_cashflow = {limit: $scope.data_cashflow.length};
        $scope.limit_total = {limit: $scope.data_total.length};



   })

 })



  $scope.onpagechange = function(page, limit) {

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

  $scope.onorderchange = function(order) {

    //console.log('Scope Order: ' + $scope.query.order);
    //console.log('Order: ' + order);

    var deferred = $q.defer();

    $timeout(function () {
      deferred.resolve();
    }, 2000);

    return deferred.promise;
  };




}])
