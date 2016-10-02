/**
 * Created by isaacjiang on 9/29/15.
 */


var app = angular.module('supereoApp', ['ngMaterial','md.data.table','pdf']);

app.config(function($mdThemingProvider) {
   $mdThemingProvider.definePalette('supereoTheme', {
    '50': 'E5E5FF',
    '100': 'BBBBFF',
    '200': '9090FF',
    '300': '000090',
    '400': '000066',
    '500': '00005D',
    '600': '000055',
    '700': '00004D',
    '800': '000044',
    '900': '000033',
    'A100': 'FFDB4D',
    'A200': 'FFCC00',
    'A400': 'E6B800',
    'A700': 'CCA300',
    'contrastDefaultColor': 'light',    // whether, by default, text (contrast)
                                        // on this palette should be dark or light
    'contrastDarkColors': ['50', '100', //hues which contrast should be 'dark' by default
     '200', '300', '400', 'A100'],
    'contrastLightColors': 'dark'    // could also specify this if default was 'dark'
  });
   $mdThemingProvider.theme('default')
    .primaryPalette('supereoTheme')
    .accentPalette('blue');
})

  .config(function($locationProvider) {
  $locationProvider.html5Mode({enabled: true, requireBase: false}).hashPrefix('!');
})

  .service('current_user', function ($http, $location, $q) {
        var deffered = $q.defer();
        var current_user = {};

        current_user.getData = function () {
            $http({method: 'GET', url: '/system/userstatus'}).then(function success(res) {
                userStatus = res.data
                deffered.resolve();
            });
            return deffered.promise;
        }
        current_user.username = function () {
            return userStatus.username
        }
        current_user.permission = function () {
            return userStatus.permission
        }
        current_user.status = function () {
            return userStatus.status
        }
        current_user.settings = function () {
            return userStatus.settings
        }
        return current_user
    })


.service('windowsize',function($window){
        var windowsize= {"width":$window.innerWidth,"height":$window.innerHeight}
        return windowsize
    })

.controller('menubarCtrl', ['$scope', '$mdSidenav','$window','$rootScope','$http','current_user','$mdDialog','$mdToast',function($scope, $mdSidenav,$window,$rootScope,$http,current_user,$mdDialog,$mdToast){



    $rootScope.register = function (ev) {
        $mdDialog.show({
            controller: registerController,
            bindToController: true,
            templateUrl: '/system/register',
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose: true
        })
    };

    $rootScope.login = function (ev) {
        if (current_user.is_authenticated) {
            $window.location.href = '/resource'
        }
        else {
            $mdDialog.show({
                controller: loginController,
                bindToController: true,
                templateUrl: '/system/login',
                parent: angular.element(document.body),
                targetEvent: ev,
                clickOutsideToClose: true
            })
        }

    };

    function registerController($scope, $mdDialog,$http) {
        $scope.cancel = function () {
            $mdDialog.cancel();
        };
        $scope.newUser = {}

        $scope.registerUser = function(newUser){
            //console.log(newUser)
              if (newUser.username == undefined){
                $scope.message = "Please Enter Your Username."
            }
            else if (newUser.password == undefined){
                $scope.message = "Please Enter Your Password."
            }
            else {
                  $http.post("/system/register", newUser).success(function (d) {
                    if ((d.register_status == false) && (d.message != undefined)) {
                        $scope.message = d.message
                    }
                    if (d.register_status == true) {
                        $scope.current_user = {}
                        $scope.current_user.username = d.userStatus.username
                        $scope.current_user.permission = d.userStatus.permission
                        $scope.current_user.status = d.userStatus.status
                        $scope.current_user.settings = d.userStatus.settings
                        $mdDialog.cancel()
                        $window.location.href = '/'
                    }
                  })
              }
            notificationToast($scope.message)
        }


    }

    function loginController($scope, $mdDialog,$http) {

        $scope.cancel = function () {
            $mdDialog.cancel();
        };
       $scope.user = {}

        $scope.loginUser = function(user){

            if (user.username == undefined){
                $scope.message = "Please Enter Your Username."

            }
            else if (user.password == undefined){
                $scope.message = "Please Enter Your Password."
            }
            else
            {
             $http.post("/system/login",user).success(function(d){

           if ((d.login_status == false) && (d.message != undefined)) {
                            $scope.message = d.message
                        }
                        if (d.login_status == true) {
                            $scope.current_user = {}
                            $scope.current_user.username = d.userStatus.username
                            $scope.current_user.permission = d.userStatus.permission
                            $scope.current_user.status = d.userStatus.status
                            $scope.current_user.settings = d.userStatus.settings
                            $mdDialog.cancel()
                            $window.location.href = '/'
                        }
            })
            }

            notificationToast($scope.message)
        }

    }

    $scope.logout = function (ev) {
        $http.get('/system/logout').success(function(d){
                $scope.current_user = {}
                $scope.current_user.username = d.userStatus.username
                $scope.current_user.permission = d.userStatus.permission
                $scope.current_user.status = d.userStatus.status
                $scope.current_user.settings = d.userStatus.settings
                window.location.href = "/";
       })
    }

//console.log($rootScope.current_user.username)
  $rootScope.toggleSidenav = function(menuId) {
      if (menuId=='left'){
       $http.get("/server/tasklist?keyword="+$rootScope.current_user.username).success(function(d){
           //console.log(d.data)
           $rootScope.tasklists = d.data})}
      else {
       $http.get('/server/querywithdata?keyword=allstories').success(function(d){
         //console.log(d.data, $rootScope.userAtCompany.companyName)
         $rootScope.stories = d.data.filter(function(s){
             return (s.companyName == $rootScope.userAtCompany.companyName)&&(s.period == $rootScope.userAtCompany.currentPeriod)
         })

     })}
    $mdSidenav(menuId).toggle();
  };
     $scope.home = function() {
    $window.location.href = '/'
  };
     $scope.dashboard = function() {

              if ($rootScope.current_user.username == null){$window.location.href = '/'}
           else{//$window.location.href = '/dashboard'

                  console.log('dashboard') }

  };
     $scope.market = function() {
              if ($rootScope.current_user.username == null){$window.location.href = '/'}
           else{$window.location.href = '/market'}

  };
         $scope.finance= function() {
                 if ($rootScope.current_user.username == null){$window.location.href = '/'}
           else{$window.location.href = '/finance'}
  };
        $scope.help= function() {
    $window.location.href = '/help'
  };
     $scope.resert= function() {
      $http.get('/server/reset?username='+$rootScope.current_user.username)
  };
    $scope.accountBudgetfn = function () {
        accountBudgetfn();
    }


}])

.controller('SideNavCtrl', function ($scope, $timeout, $mdSidenav, $mdUtil) {
    $scope.toggleLeft = buildToggler('left');
    $scope.toggleRight = buildToggler('right');

    function buildToggler(navID) {
      var debounceFn =  $mdUtil.debounce(function(){
            $mdSidenav(navID).toggle()},200);
      return debounceFn;
    }
  })

.controller('LeftCtrl',['$scope','$window','$mdSidenav','$http','$mdDialog','current_user','$rootScope','$mdToast',function ($scope,$window,$mdSidenav,$http,$mdDialog,current_user,$rootScope,$mdToast) {

    //$scope.close = function () {$mdSidenav('left').close()};

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
         if ( $rootScope.current_user.username !=null && $rootScope.current_user.status.is_authenticated)
         {
        $http.get("/server/querywithusername?keyword="+ $rootScope.current_user.username).success(function(d2){

        $rootScope.teammembers = d2.teammembers;
        $rootScope.companies = d2.companyinfo
        $rootScope.userAtCompany = d2.userAtCompany
        if ($rootScope.companies != undefined) {
        $rootScope.companies.forEach(function(comp){
              if (comp.companyName == $rootScope.userAtCompany.companyName){
                  comp.calculate = true
                  $rootScope.userAtCompany.currentPeriod = comp.currentPeriod
                  //console.log($rootScope.userAtCompany)
              }
        })}})
              //console.log($scope.current_user.status.is_anonymous)
            if ($scope.current_user.status.is_anonymous) {
                //console.log($scope.current_user.status.is_anonymous)
          $rootScope.login.login()
            }
        $http.get('/server/querymessagesbyusername?username='+$rootScope.current_user.username).success(function(d){
                  if (d.length >0){
                          notificationToast(d)
                  }
               })
    }
         else{
             $rootScope.login()
         }
    })

    var instructionFn = function (func_name) {
        // Show the dialog
           $mdDialog.show({
            clickOutsideToClose: false,
            bindToController: true,
            controller: showpdfCtrl,
            templateUrl: '/server/showpdf',
            locals:{func_name:func_name}
        });

        function showpdfCtrl ($scope,$mdDialog,func_name) {
            console.log(func_name)
            $scope.info = function () {
                $mdSidenav('info').toggle();
            };
            $scope.close = function () {
                $mdDialog.cancel();
            };

            if (func_name=='hiring'){
                $scope.pdfName = 'Hiring introduction';
                $scope.pdfUrl = 'static/pdf/agenda P1.pdf';
            }
            
            $scope.scroll = 0;
            $scope.loading = 'loading';

            $scope.getNavStyle = function(scroll) {
                if(scroll > 100) return 'pdf-controls fixed';
                else return 'pdf-controls';
            }

            $scope.onError = function(error) {
                console.log(error);
            }

            $scope.onLoad = function() {
                $scope.loading = '';
            }

            $scope.onProgress = function(progress) {
                console.log(progress);
            }


        }
    }

    $scope.taskclick = function(taskName,companyName,task){
        //if (task.status == "completed" && task.taskName != 'End Period'){
         // notificationToast({"message":"Task : " +task.taskName + " has been done and you can not do it twice."})
       // }
        //else{

        //console.log(taskName,companyName)
        //console.log(['01005','02001','03001','05008'].indexOf(taskName))
        if (taskName == '00001'){joinTeam();}
        if (taskName == '00002'){companyRole();}
        if (taskName == '90001'){inintData();}
        if (['01005'].indexOf(taskName)>=0){negotiatefn();}
        if (['01002','02002','03002','04002','05002','06002','07002'].indexOf(taskName)>=0){workforcefn();}
        if (['01100','02100','03100','04100','05100','06100','07100'].indexOf(taskName)>=0){endperiodfn();}
        if (['03005'].indexOf(taskName)>=0){negotiate2fn();}
        if (['10001','10002','10003','10004','10005','10006','10007'].indexOf(taskName)>=0){forecastingfn();}

    if (companyName=='NewCo'){
        if (['01001','02001','03001','05001'].indexOf(taskName)>=0){hiringfn();}
        if (['03003','04003','05003','07003'].indexOf(taskName)>=0){resourcesfn();}
        if (['04004','05004','06004','07004'].indexOf(taskName)>=0){budgetfn();}
        if (['02005'].indexOf(taskName)>=0){winVisionaryfn();}
        if (['04006','05006','06006','07006'].indexOf(taskName)>=0){actionsfn();}
        if (['04008','05008'].indexOf(taskName)>=0){nichesfn();}
    }
    if (companyName=='LegacyCo'){
        if (['01001','03001','04001'].indexOf(taskName)>=0){hiringfn();}
        if (['01003','05003','06003'].indexOf(taskName)>=0){resourcesfn();}
        if (['01004','02004','03004','04004','05004','06004','07004'].indexOf(taskName)>=0){budgetfn();}
        if (['02005','04005'].indexOf(taskName)>=0){projectfn();}
        if (['01006','02006','03006','04006','05006','06006','07006'].indexOf(taskName)>=0){actionsfn();}
        if (['04008','05008'].indexOf(taskName)>=0){nichesfn();}
        if (['05009','06009','07009'].indexOf(taskName)>=0){corporateacquisitionsfn();}
    }

     $mdSidenav('left').close()
        }
   // }

    function joinTeam() {
        // Show the dialog
        $mdDialog.show({
            clickOutsideToClose: true,
            bindToController: true,
            controller: joinTeamCtrl,
            parent: angular.element(document.body),
            templateUrl: '/server/jointeam'
        });

       function joinTeamCtrl ($scope,$mdDialog,$http) {
        $scope.cancel = function () {
                $mdDialog.cancel();
            };
        $scope.submit = function (teams,event) {
                selectedTeam=[]
             teams.forEach(function(d){
                 if (d.selected) {
                   selectedTeam.push(d)
                 }

             })
             //console.log(current_user,selectedTeam)
             if (selectedTeam.length == 1){
                 $http.post('server/jointeam',data={username:$rootScope.current_user.username,teamName:selectedTeam[0].teamName}).success(function(d){
                 $mdDialog.cancel();
                $mdSidenav('left').close()
                     $window.location.href = '/'
                 })
             }
             else{
                $scope.message=="Pease select one and only one team."
                joinTeam()
                 }
         };
        $http.get('/server/querywithdata?keyword=allteam').success(function(d){$scope.teams = d.data})

        }
    }
    function companyRole() {
        // Show the dialog
        $mdDialog.show({
            clickOutsideToClose: true,
            bindToController: true,
            controller: companyRoleCtrl,
            controllerAs: 'dialog',
            templateUrl: '/server/companyrole'
        });

       function companyRoleCtrl ($scope,$mdDialog,$http,current_user) {
          $scope.close = function () {
            $mdDialog.cancel();
        };
         $scope.submit = function (companies,event) {
              selectedCompany=[]
             companies.forEach(function(d){
                 if (d.userrole) {
                   selectedCompany.push(d)
                 }

             })
              // console.log(selectedCompany)
                if (selectedCompany.length == 1) {
                    $http.post('server/companyrole', data = {
                        username: $rootScope.current_user.username,
                        companyName: selectedCompany[0].name,
                        userrole: selectedCompany[0].userrole
                    }).success(function (d) {
                        console.log(d)
                        $window.location.href = '/'
                    })
                $mdDialog.cancel();
                $mdSidenav('left').close()

                }

             else {
                    $scope.message=="Pease select one and only one Company and Role."
                      companyRole()
                   }

            };

   $scope.roles =('CEO CFO COO CMO').split(' ').map(function (role) { return { userrole: role }; });
  $scope.companies = [
        {
            name: 'LegacyCo',
            niches: 'electronic',
            logo: '',
            calculate:true
        },
        {
            name: 'NewCo',
            niches: 'electronic',
            logo: '',
            calculate:false
        },
    ];
        }
    }

    function inintData() {
        // Show the dialog
        $mdDialog.show({
            clickOutsideToClose: true,
            bindToController: true,
            controller: initDataCtrl,
            parent: angular.element(document.body),
            templateUrl: '/server/initdata'
        });

        function initDataCtrl ($scope,$mdDialog,$http) {
            $scope.cancel = function () {
                $mdDialog.cancel();
            };
            $scope.items = ['task_list', 'account_desc', 'employees', 'actions',
                'niches', 'negotiation', 'projects', 'resources', 'stories', 'corporates']
            $scope.selected = ['task_list'];
            $scope.toggle = function (item, list) {
                var idx = list.indexOf(item);
                if (idx > -1) {
                    list.splice(idx, 1);
                }
                else {
                    list.push(item);
                }
            };
            $scope.exists = function (item, list) {
                return list.indexOf(item) > -1;
            };
            $scope.isIndeterminate = function() {
                return ($scope.selected.length !== 0 &&
                $scope.selected.length !== $scope.items.length);
            };
            $scope.isChecked = function() {
                return $scope.selected.length === $scope.items.length;
            };
            $scope.toggleAll = function() {
                if ($scope.selected.length === $scope.items.length) {
                    $scope.selected = [];
                } else if ($scope.selected.length === 0 || $scope.selected.length > 0) {
                    $scope.selected = $scope.items.slice(0);
                }
            }
            $scope.downloadfile = function (list) {

              location.href = '/server/initdata?keyword=getfile'+'&list='+$scope.selected


            };
            $scope.uploadfile = function (file) {

            };


        }
    }

    function hiringfn() {
        // Show the dialog
        $mdDialog.show({
            clickOutsideToClose: false,
            bindToController: true,
            controller: hiringCtrl,
            templateUrl: '/server/hiring',
            locals:{func:instructionFn}
        });

       function hiringCtrl ($scope,$mdDialog,$http,func) {
         $scope.instruction = function () {
             func('hiring')
         }
         $scope.info = function () {

             $mdSidenav('info').toggle();
           };
       $scope.close = function () {
            $mdDialog.cancel();
        };
         $scope.submit = function (employees,event) {
            // console.log(employees)
             var offeredEmployees=[]
             if (employees.dc.length > 0) employees.dc.forEach(function(d){if (d.salaryOffer) {offeredEmployees.push(d)}})
             if (employees.lc.length > 0) employees.lc.forEach(function(d){if (d.salaryOffer) {offeredEmployees.push(d)}})
             if (employees.li.length > 0) employees.li.forEach(function(d){if (d.salaryOffer) {offeredEmployees.push(d)}})
             if (employees.ma.length > 0) employees.ma.forEach(function(d){if (d.salaryOffer) {offeredEmployees.push(d)}})
             if (employees.ms.length > 0) employees.ms.forEach(function(d){if (d.salaryOffer) {offeredEmployees.push(d)}})
             if (employees.pd.length > 0) employees.pd.forEach(function(d){if (d.salaryOffer) {offeredEmployees.push(d)}})
             if (employees.sd.length > 0) employees.sd.forEach(function(d){if (d.salaryOffer) {offeredEmployees.push(d)}})

           //  console.log(offeredEmployees)
               $mdDialog.show(
                  $mdDialog.confirm()
                    .title('Confirm')
                    .content('You made offers to  ' + offeredEmployees.length +"  candidates?")
                    .ariaLabel('Confirm')
                    .ok('OK')
                      .cancel('Cancel')
                    .targetEvent(event)
               ).then(function(d){
                       $http.post('server/hiring',data={username:$rootScope.current_user.username,employees:offeredEmployees}).success(function(d){
                           //console.log(d)
                            $window.location.reload();
                       })
                $mdDialog.cancel();
                $mdSidenav('left').close()


                   },function(){
                      hiringfn($event)
                   })
            };

          $http.get('/server/queryemployeewithconditions?username='+$rootScope.current_user.username).success(function(d){

              $scope.employees = {ma:[],sd:[],ms:[],li:[],pd:[],lc:[],dc:[]}
             d.data.forEach(function(e){
                 e.src = '/photo/'+ e.employeeName+'.GIF'

                 if(e.category == 'SENIOR LEGAL COUNSEL'){$scope.employees.lc.push(e)}
                 else if(e.category == 'DIRECTOR COMPLIANCE'){$scope.employees.dc.push(e)}
                 else if(e.category == 'Marketing & Advertizing'){$scope.employees.ma.push(e)}
                 else if(e.category == 'Sales & Distribution'){$scope.employees.sd.push(e)}
                 else if(e.category == 'Market Support'){$scope.employees.ms.push(e)}
                 else if(e.category == 'Logistics & IT'){$scope.employees.li.push(e)}
                 else if(e.category == 'Product Development'){$scope.employees.pd.push(e)}
             })



               })


        }
    }
    function resourcesfn() {
        // Show the dialog
        $mdDialog.show({
            clickOutsideToClose: false,
            bindToController: true,
            controller:resourcesCtrl,
            controllerAs: 'dialog',
            templateUrl: '/server/resources'
        });

       function resourcesCtrl ($scope,$mdDialog,$http) {
          $scope.close = function () {
            $mdDialog.cancel();
        };
           $scope.selectedResources = {ls:[],ma:[],sa:[],su:[],li:[],pd:[]};
          $scope.toggle = function (item,list,type) {
              var idx = list[type].indexOf(item);
              if (idx > -1) {list[type].splice(idx, 1);}
              else {
                  if (list[type].length >= 3) {
                      notificationToast("You can only choose three resources.")
                  }
                  else {
                      list[type].push(item);
                  }
              }

      };
         $scope.exists = function (item, list, type) {
        return list[type].indexOf(item) > -1;
      };
         $scope.submit = function () {

   $http.post('server/resources',data={"username":$rootScope.current_user.username,"companyName":$rootScope.userAtCompany.companyName,"teamName":$rootScope.userAtCompany.teamName,selectedResources:$scope.selectedResources}).success(function(d){
                   console.log(d)
                       })
             
                $mdDialog.cancel();
                $mdSidenav('left').close()
             $window.location.reload();
            };
         $http.get('/server/queryresourcesbyusername?username='+$rootScope.current_user.username).success(function(d){
             $scope.resources_ls = d.data.filter(function(e){return e.resourceType == "Lobbyist"})
             $scope.resources_ma = d.data.filter(function(e){return e.resourceType == "AD&DM"})
             $scope.resources_sa = d.data.filter(function(e){return e.resourceType == "Distribution Partners"})
             $scope.resources_su = d.data.filter(function(e){return e.resourceType == "Call Centre (inbound)"})
             $scope.resources_li = d.data.filter(function(e){return e.resourceType == "Production Outsourcer"})
             $scope.resources_pd = d.data.filter(function(e){return e.resourceType == "Development Partners"})

               })
        }
    }
    function workforcefn() {

        $mdDialog.show({
            clickOutsideToClose: false,
            bindToController: true,
            controller: workforceCtrl,
            controllerAs: 'dialog',
            templateUrl: '/server/workforce'
        });

       function workforceCtrl ($scope,$mdDialog,$http) {
          $scope.close = function () {
            $mdDialog.cancel();
        };
           var forecasting={}
           // console.log(($scope.workforce.projectedsales.b2b)+($scope.workforce.projectedsales.b2c)+($scope.workforce.projectedsales.newoffering))
           $http.get('/server/queryforecastingatstart?username='+$rootScope.current_user.username).success(function(d){
               console.log(d)
               if (d){
                  forecasting =parseInt((d.b2b+d.b2c+d.newoffering)/1000000)
                   console.log(forecasting)
               }




            $scope.projectedsales={}
        // console.log(($scope.workforce.projectedsales.b2b)+($scope.workforce.projectedsales.b2c)+($scope.workforce.projectedsales.newoffering))
          $http.get('/server/queryworkforceatstart?username='+$rootScope.current_user.username).success(function(d){

           $scope.workforce={"marketing": {"valueatstart": d.marketing.adjustment+d.marketing.valueatstart, "valuebyhr": forecasting, "adjustment": 0},
     "sales": {"valueatstart": d.sales.adjustment+d.sales.valueatstart, "valuebyhr": forecasting, "adjustment": 0},
     "support": {"valueatstart": d.support.adjustment+d.support.valueatstart, "valuebyhr": forecasting, "adjustment": 0},
     "logisticsit": {"valueatstart": d.logisticsit.adjustment+d.logisticsit.valueatstart, "valuebyhr": forecasting, "adjustment": 0},
     "productdevelopment": {"valueatstart": d.productdevelopment.adjustment+d.productdevelopment.valueatstart, "valuebyhr": forecasting, "adjustment": 0}}
               })
       })
         //$scope.selectedIndex=1

         $scope.submit = function (workforce) {

          $http.post('server/workforce',data={username:$rootScope.current_user.username,workforce:workforce}).success(function(d){
                   $window.location.reload();})
             $mdDialog.cancel();
            $mdSidenav('left').close()

            };

        }
    }
    function budgetfn() {

        // Show the dialog
        $mdDialog.show({
            clickOutsideToClose: false,
            bindToController: true,
            controller: budgetCtrl,
            controllerAs: 'dialog',
            templateUrl: '/server/budget'
        });

       function budgetCtrl ($scope,$mdDialog,$http) {

           //console.log($rootScope.userAtCompany.companyName,$rootScope.userAtCompany.currentPeriod )
           $scope.if_show = function(company){
               return $rootScope.userAtCompany.companyName==company || ($rootScope.userAtCompany.companyName =='LegacyCo' && $rootScope.userAtCompany.currentPeriod == 5)
           }
           //if ($rootScope.userAtCompany.companyName=='NewCo'){$scope.newco_show = true }
           //if ($rootScope.userAtCompany.companyName=='LegacyCo'){$scope.legacyco_show = true }
           $scope.acc_budget ={}
          $scope.close = function () {
            $mdDialog.cancel();
        };
         $scope.submit = function (acc_budget,event) {
                console.log(acc_budget)
          $http.post('server/budget',data={username:$rootScope.current_user.username,acc_budgets:acc_budget}).success(function(d){
                   console.log(d)
              $window.location.reload();
                       })
                           $mdDialog.cancel();
                $mdSidenav('left').close()

            };

        }
    }
    function negotiatefn() {
        // Show the dialog

        $mdDialog.show({
            clickOutsideToClose: false,
            bindToController: true,
            controller: negotiateCtrl,
            controllerAs: 'dialog',
            templateUrl: '/server/negotiation1'
        });

       function negotiateCtrl ($scope,$mdDialog,$http,$rootScope) {
          $scope.close = function () {
            $mdDialog.cancel();
        };
           //console.log($rootScope.userAtCompany.currentPeriod == 1)
     $scope.currentPeriod = $rootScope.userAtCompany.currentPeriod
     $scope.companyName = $rootScope.userAtCompany.companyName
     $scope.selectedEmployees = [];
           //console.log($scope.selectedEmployees)
      $scope.toggle = function (item, list) {
        //console.log(item)

        var idx = list.indexOf(item);
        if (idx > -1) {
            list.splice(idx, 1);
        }
        else {
            list.push(item);

          $scope.technicalExperts = item.technicalExperts
          //console.log(list)

          $scope.calculatedValues={'marketingLoss':1,'developmentLoss':1,'marketingGain':1,"developmentGain":1}

          list.forEach(function(d) {
                $scope.calculatedValues.marketingLoss = $scope.calculatedValues.marketingLoss * d.marketingLoss
                $scope.calculatedValues.developmentLoss = $scope.calculatedValues.developmentLoss * d.developmentLoss
                $scope.calculatedValues.marketingGain = $scope.calculatedValues.marketingGain * d.marketingGain
                $scope.calculatedValues.developmentGain = $scope.calculatedValues.developmentLoss * d.developmentGain
             })
          $scope.calculatedValues.marketingLoss =($scope.calculatedValues.marketingLoss*100).toFixed(2)
          $scope.calculatedValues.developmentLoss =($scope.calculatedValues.developmentLoss*100).toFixed(2)
          $scope.calculatedValues.marketingGain =($scope.calculatedValues.marketingGain*100).toFixed(2)
          $scope.calculatedValues.developmentGain =($scope.calculatedValues.developmentGain*100).toFixed(2)

          var sumInfluence={'VRKidEd':0,"GovVR":0,"VRGames":0,"MilitaryVR":0,"AdEdVR":0,"VRCinema":0}
              list.forEach(function(d){

                  if(d.category == "ProductDeveloper"){
                   sumInfluence.VRKidEd += d.technicalExperts.sum* d.influenceBVs.VRKidEd
                   sumInfluence.GovVR += d.technicalExperts.sum* d.influenceBVs.GovVR
                   sumInfluence.VRGames += d.technicalExperts.sum* d.influenceBVs.VRGames
                  sumInfluence.MilitaryVR += d.technicalExperts.sum* d.influenceBVs.MilitaryVR
                  sumInfluence.AdEdVR += d.technicalExperts.sum* d.influenceBVs.AdEdVR
                  sumInfluence.VRCinema += d.technicalExperts.sum* d.influenceBVs.VRCinema
                  }

              })

           $scope.sumInfluenceSales={'VRKidEd':0,"GovVR":0,"VRGames":0,"MilitaryVR":0,"AdEdVR":0,"VRCinema":0}
               list.forEach(function(d){
                  if(d.category == "Salespeople"){
                      $scope.sumInfluenceSales.VRKidEd +=sumInfluence.VRKidEd * d.influenceBVs.VRKidEd
                      $scope.sumInfluenceSales.GovVR += sumInfluence.GovVR * d.influenceBVs.GovVR
                      $scope.sumInfluenceSales.VRGames += sumInfluence.VRGames * d.influenceBVs.VRGames
                      $scope.sumInfluenceSales.MilitaryVR += sumInfluence.MilitaryVR * d.influenceBVs.MilitaryVR
                      $scope.sumInfluenceSales.AdEdVR += sumInfluence.AdEdVR * d.influenceBVs.AdEdVR
                      $scope.sumInfluenceSales.VRCinema += sumInfluence.VRCinema * d.influenceBVs.VRCinema
               }

                })
    }

      };

      $scope.exists = function (item, list) {
          
        return list.indexOf(item) > -1 ;
      };
    $scope.funding={additionalProductDevelopment:0,desiredSalesBudget:0}

    $scope.submit = function (selectedEmployees,funding,sumInfluenceSales,calculatedValues,action) {

          //console.log(selectedEmployees,funding)

              $http.post('server/negotiation1',data={username:$rootScope.current_user.username,selectedEmployees:selectedEmployees,funding:funding,sumInfluenceSales:sumInfluenceSales,calculatedValues:calculatedValues,action:action}).success(function(d){
                   console.log(d)
                   $window.location.reload();
                       })
                $mdDialog.cancel();
                $mdSidenav('left').close()

            };
          $http.get('/server/querywithdata?keyword=allnegotiationhr').success(function(data){
              console.log(data)
              $scope.negotiationhr_sales = []
              $scope.negotiationhr_pd = []
              $scope.negotiationhr_te =[]
              data.data.forEach(function(d){
                    d.src = '/photo/'+d.employeeName+'.GIF'
                  if (d.title=="Top Salespeople") {$scope.negotiationhr_sales.push(d)}
                      else if (d.title=="Technical Experts"){$scope.negotiationhr_te.push(d)}
                  else{$scope.negotiationhr_pd.push(d)}

                      })
                   })
           $http.get('/server/querynewconegotiationwithconditions?teamname='+$rootScope.userAtCompany.teamName).success(function(data){
               console.log(data)
               if (data.negotiation != null) {
                   $scope.status = data.status
               $scope.selectedEmployees = []
                data.negotiation.selectedEmployees.forEach(function (d) {

                      if (d.title=="Top Salespeople") {
                          $scope.negotiationhr_sales.forEach(function (e) {
                              //console.log(e.employeeID, d.employeeID,e)
                              if (e.employeeID == d.employeeID) {e.selected = true}
                          })}
                      else if (d.title=="Technical Experts"){
                          $scope.negotiationhr_te.forEach(function (e) {
                              if (e.employeeID == d.employeeID) {e.selected = true}
                          })}
                  else{$scope.negotiationhr_pd.forEach(function (e) {
                              if (e.employeeID == d.employeeID) {e.selected = true}
                          })}
  
    $scope.toggle(d,$scope.selectedEmployees)

})

               $scope.funding =data.negotiation.funding
               $scope.sumInfluenceSales =data.negotiation.sumInfluenceSales
               $scope.calculatedValues =data.negotiation.calculatedValues
               $scope.applyStatus = data.status
                 }  })

        }
    }
    function actionsfn() {
        // Show the dialog
        $mdDialog.show({
            clickOutsideToClose: false,
            bindToController: true,
            controller: actionsCtrl,
            controllerAs: 'dialog',
            templateUrl: '/server/action'
        });

       function actionsCtrl ($scope,$mdDialog,$http) {
          $scope.close = function () {
            $mdDialog.cancel();
        };
       $scope.selectedActions = [];
      $scope.toggle = function (item, list) {
        var idx = list.indexOf(item);
        if (idx > -1) list.splice(idx, 1);
        else list.push(item);
      };
      $scope.exists = function (item, list) {
        return list.indexOf(item) > -1;
      };
         $scope.submit = function (event) {
             $mdDialog.show(
                  $mdDialog.confirm()
                    .title('Confirm')
                    .content('Are you confirm selecting: ' + $scope.selectedActions.length +" Actions")
                    .ariaLabel('Confirm')
                    .ok('OK')
                      .cancel('Cancel')
                    .targetEvent(event)
               ).then(function(d){
                       $http.post('server/action',data={username:$rootScope.current_user.username,actions:$scope.selectedActions}).success(function(d){
                   console.log(d)

                                           $mdDialog.cancel();
                $mdSidenav('left').close()
                          $window.location.reload();
                       })
                //$mdDialog.hide();
                   },function(){
                      actionsfn($event)
                   })
            };
         $http.get('/server/querywithdata?keyword=allactions').success(function(d){
             console.log($rootScope.userAtCompany.companyName)
             $scope.actions = d.data.filter(function (d) {
                 return d.companyName ==$rootScope.userAtCompany.companyName
             })
             $scope.leadershipActions=[]
             $scope.marketingActions=[]
             $scope.salesActions=[]
             $scope.supportActions=[]
             $scope.logisticsActions=[]
             $scope.productdevelopmentActions=[]
             console.log(d)
              $scope.actions.forEach(function(action){
                if (action.category == "leadership"){  $scope.leadershipActions.push(action)}
                  else if (action.category == "marketing"){$scope.marketingActions.push(action)}
                  else if (action.category == "sales"){$scope.salesActions.push(action)}
                  else if (action.category == "support"){$scope.supportActions.push(action)}
                  else if (action.category == "logisticsit"){$scope.logisticsActions.push(action)}
                  else if (action.category == "productdevelopment"){$scope.productdevelopmentActions.push(action)}
              })

               })
        }
    }
    function endperiodfn() {
        // Show the dialog
        $mdDialog.show({
            clickOutsideToClose: false,
            bindToController: true,
            controller: endperiodCtrl,
            controllerAs: 'dialog',
            templateUrl: '/server/endperiod'
        });

       function endperiodCtrl ($scope,$mdDialog,$http) {
          $scope.close = function () {
            $mdDialog.cancel();
        };
             var notCompleted= false
         $scope.submit = function (tasks) {

//if (!notCompleted){
        $http.post('server/endperiod',data={username:$rootScope.current_user.username,tasks:tasks}).success(function(d){
                   console.log(d)
            $window.location.reload();
                       })
                  $mdDialog.cancel();
                $mdSidenav('left').close()
//}
  // else{
  //  notificationToast({message:"Not all tasks are completed."})
//}
            };
         $http.get('/server/querywithdata?keyword=periodstatus&username='+$rootScope.current_user.username).success(function(d){
                   $scope.tasks = d.data
             $scope.tasks.forEach(function(d){
                 if (d.status =='completed'){
                     d.finished = true
                 }
                 else {
                     if (d.taskName != 'End Period'){notCompleted= true}
                     d.finished = false}
             })

               }
         )
        }
    }
    function projectfn() {
        // Show the dialog
        $mdDialog.show({
            clickOutsideToClose: false,
            bindToController: true,
            controller: projectCtrl,
            controllerAs: 'dialog',
            templateUrl: '/server/project'
        });

       function projectCtrl ($scope,$mdDialog,$http) {
          $scope.close = function () {
            $mdDialog.cancel();
        };

      $scope.selectedProjects = [];
      $scope.toggle = function (item, list) {
        var idx = list.indexOf(item);
        if (idx > -1) list.splice(idx, 1);
        else list.push(item);
      };
      $scope.exists = function (item, list) {
        return list.indexOf(item) > -1;
      };
         $scope.submit = function () {
               $mdDialog.show(
                  $mdDialog.confirm()
                    .title('Confirm')
                    .content('Are you confirm selecting: ' + $scope.selectedProjects.length +" projects")
                    .ariaLabel('Confirm')
                    .ok('OK')
                      .cancel('Cancel')

               ).then(function(d){
                       $http.post('server/project',data={username:$rootScope.current_user.username,projects:$scope.selectedProjects}).success(function(d){
                   console.log(d)
                            $window.location.reload();
                       })


                                $mdDialog.cancel();
                $mdSidenav('left').close()
                   },function(){
                      projectfn($event)
                   })

            };
         $http.get('/server/querywithdata?keyword=allprojects').success(function(d){
                   $scope.projects = d.data
                   $scope.projects.forEach(function(d){
                       d.totalCost = d.costHitPDbudget.period2+d.costHitPDbudget.period3+d.costHitPDbudget.period4+d.costHitPDbudget.period5+d.costHitPDbudget.period6+d.costHitPDbudget.period7
                       d.elapsedDevTimePeriods= d.finalAtPeriod- d.startAtPeriodconsole
                       if (d.status == "Compulsory"){
                         $scope.selectedProjects.push(d)
                       }
              })
               })
        }
    }
    function winVisionaryfn() {
        // Show the dialog
        $mdDialog.show({
            clickOutsideToClose: false,
            bindToController: true,
            controller: visionarycompetitionCtrl,
            controllerAs: 'dialog',
            templateUrl: '/server/visionarycompetition'
        });

       function visionarycompetitionCtrl ($scope,$mdDialog,$http) {
          $scope.close = function () {
            $mdDialog.cancel();
        };


            $scope.selectedNiches = [];
          $scope.toggle = function (item, list) {

        var idx = list.indexOf(item);
        if (idx > -1) list.splice(idx, 1);
        else list.push(item);
      };

         $scope.exists = function (item, list) {
         return list.indexOf(item) > -1;
         };

         $http.get('/server/querynewconegotiationwithconditions?teamname='+$rootScope.userAtCompany.teamName).success(function(data){
               console.log(data)

              var visionaries =[{name:'VRKidEd',infuenceUnits:data.negotiation.sumInfluenceSales.VRKidEd,pitchCost:40000},
                  {name:'GovVR',infuenceUnits:data.negotiation.sumInfluenceSales.GovVR,pitchCost:30000},
                  {name:'VRGames',infuenceUnits:data.negotiation.sumInfluenceSales.VRGames,pitchCost:50000},
                  {name:'MilitaryVR',infuenceUnits:data.negotiation.sumInfluenceSales.MilitaryVR,pitchCost:40000},
                  {name:'AdEdVR',infuenceUnits:data.negotiation.sumInfluenceSales.AdEdVR,pitchCost:35000},
                  {name:'VRCinema',infuenceUnits:data.negotiation.sumInfluenceSales.VRCinema,pitchCost:25000}
              ].sort(function(){return Math.random()*3-1})
              $scope.uncommittedTime = data.negotiation.funding.additinalProductDeveloperNumber*120
                  $scope.uncommittedSales = data.negotiation.funding.additinalSalesNumber *40000

             $scope.visionary= visionaries[0]
             $scope.progress= 0
             setInterval(function (){
                 //console.log($scope.progress)
                 $scope.progress += 1
                 if ($scope.progress >= 100){
                     $scope.progress= 0
                      $scope.visionary = visionaries[Math.floor((Math.random() * 6))]
                 notificationToast('Visionary changed to '+ $scope.visionary.name+'. Please wait two minutes.' )
                 }
             },100)

               })


         $scope.submit = function (selectedNiches,event) {

             //console.log(selectedNiches)
                  $http.post('server/visionarycompetition',data={companyName:$rootScope.userAtCompany.companyName,teamName:$rootScope.userAtCompany.teamName,selectedNiches:selectedNiches}).success(function(d){
                   console.log(d)
                       $window.location.reload();
                       })


                  $mdDialog.cancel();
                $mdSidenav('left').close()

            };

        }
    }
    function negotiate2fn() {
        $mdDialog.show({
            clickOutsideToClose: false,
            bindToController: true,
            controller: negotiate2Ctrl,
            controllerAs: 'dialog',
            templateUrl: '/server/negotiation2'
        });

       function negotiate2Ctrl ($scope,$mdDialog,$http) {
          $scope.close = function () {
            $mdDialog.cancel();
        };
       $scope.currentPeriod = $rootScope.userAtCompany.currentPeriod
        $scope.companyName = $rootScope.userAtCompany.companyName

            $http.get('/server/querynewconegotiation2withconditions?teamname='+$rootScope.userAtCompany.teamName).success(function(data){
               console.log(data)
               if (data.negotiation != null) {
                   $scope.status = data.status
 $scope.estimatedIncome= data.negotiation.estimatedIncome
   $scope.Costs = data.negotiation.costs
                   $scope.expenditure =data.negotiation.expenditure
               }

           else{
                $scope.estimatedIncome=[{"period":4,"VREducation":{"customers":0,"share":0},"VRGovernment":{"customers":0,"share":0},"VREntertainment":{"customers":0,"share":0}},
          {"period":5,"VREducation":{"customers":0,"share":0},"VRGovernment":{"customers":0,"share":0},"VREntertainment":{"customers":0,"share":0}}]
        $scope.Costs=[{"period":4,"marketing":0,"sales":0,"support":0,"logisticsit":0,"development":0},
          {"period":5,"marketing":0,"sales":0,"support":0,"logisticsit":0,"development":0}]

               }
 })
         //$scope.selectedIndex=1
       $http.get('/server/queryworkforceatstart?username='+$rootScope.current_user.username).success(function(d){
             // console.log(d)
           $scope.workforce={"marketing": {"valueatstart": d.marketing.adjustment+d.marketing.valueatstart, "valuebyhr": d.marketing.adjustment+d.marketing.valueatstart+100, "adjustment": 0},
     "sales": {"valueatstart": d.sales.adjustment+d.sales.valueatstart, "valuebyhr": d.sales.adjustment+d.sales.valueatstart+100, "adjustment": 0},
     "support": {"valueatstart": d.support.adjustment+d.support.valueatstart, "valuebyhr": d.support.adjustment+d.support.valueatstart+100, "adjustment": 0},
     "logisticsit": {"valueatstart": d.logisticsit.adjustment+d.logisticsit.valueatstart, "valuebyhr": d.logisticsit.adjustment+d.logisticsit.valueatstart+100, "adjustment": 0},
     "productdevelopment": {"valueatstart": d.productdevelopment.adjustment+d.productdevelopment.valueatstart, "valuebyhr": d.productdevelopment.adjustment+d.productdevelopment.valueatstart+100, "adjustment": 0}}
               })
           
         $scope.submit = function (estimatedIncome,Costs,expenditure,action) {

          $http.post('server/negotiation2',data={username:$rootScope.current_user.username,estimatedIncome:estimatedIncome,costs:Costs,expenditure:expenditure,action:action}).success(function(d){
               $window.location.reload();
              console.log(d)})
                  $mdDialog.cancel();
                $mdSidenav('left').close()
            };

        }
    }
    function nichesfn() {
        // Show the dialog
        $mdDialog.show({
            clickOutsideToClose: false,
            bindToController: true,
            controller: nichesCtrl,
            controllerAs: 'dialog',
            templateUrl: '/server/niches'
        });

       function nichesCtrl ($scope,$mdDialog,$http) {
          $scope.close = function () {
            $mdDialog.cancel();
        };
         $scope.submit = function (niches,event) {
              console.log($rootScope.userAtCompany)

                $http.post('server/niches',data={"username":$rootScope.current_user.username,'userAtCompany':$rootScope.userAtCompany,'niches':niches}).success(function(d){
                     $window.location.reload();
                    console.log(d)})


                                $mdDialog.cancel();
                $mdSidenav('left').close()


            };
         $http.get('/server/querynichesbyusername?username='+$rootScope.current_user.username).success(function(d){
             console.log(d)
             $scope.niches =[{'niche':'',p4:'',p5:'',p6:'',p7:'',p8:''},{'niche':'',p4:'',p5:'',p6:'',p7:'',p8:''},{'niche':'',p4:'',p5:'',p6:'',p7:'',p8:''}]
             d.data.forEach(function(n){
                 if (n.niche == "Education"){
                     if(n.period == 4){ $scope.niches[0].niche= "Education",$scope.niches[0].p4 = n;}
                     if(n.period == 5){ $scope.niches[0].niche= "Education",$scope.niches[0].p5 = n;}
                     if(n.period == 6){ $scope.niches[0].niche= "Education",$scope.niches[0].p6 = n;}
                     if(n.period == 7){ $scope.niches[0].niche= "Education",$scope.niches[0].p7 = n;}
                     if(n.period == 8){ $scope.niches[0].niche= "Education",$scope.niches[0].p8 = n;}
                 }
                 if  (n.niche == "Government"){
                     if(n.period == 4){ $scope.niches[1].niche= "Government",$scope.niches[1].p4 = n;}
                     if(n.period == 5){ $scope.niches[1].niche= "Government",$scope.niches[1].p5 = n;}
                     if(n.period == 6){ $scope.niches[1].niche= "Government",$scope.niches[1].p6 = n;}
                     if(n.period == 7){ $scope.niches[1].niche= "Government",$scope.niches[1].p7 = n;}
                     if(n.period == 8){ $scope.niches[1].niche= "Government",$scope.niches[1].p8 = n;}
                 }
                 if  (n.niche == "Entertainment"){
                     if(n.period == 4){ $scope.niches[2].niche= "Entertainment",$scope.niches[2].p4 = n;}
                     if(n.period == 5){ $scope.niches[2].niche= "Entertainment",$scope.niches[2].p5 = n;}
                     if(n.period == 6){ $scope.niches[2].niche= "Entertainment",$scope.niches[2].p6 = n;}
                     if(n.period == 7){ $scope.niches[2].niche= "Entertainment",$scope.niches[2].p7 = n;}
                     if(n.period == 8){ $scope.niches[2].niche= "Entertainment",$scope.niches[2].p8 = n;}
                 }
             })
           //  console.log($scope.niches)
               })
        }
    }
    function corporateacquisitionsfn() {
        // Show the dialog
        $mdDialog.show({
            clickOutsideToClose: false,
            bindToController: true,
            controller: corporateacquisitionsCtrl,
            controllerAs: 'dialog',
            templateUrl: '/server/corporateacquisitions'
        });

        function corporateacquisitionsCtrl ($scope,$mdDialog,$http,$interval) {
            $scope.close = function () {

                $mdDialog.cancel();

            };


            $scope.selectedCorporate = [];
            $scope.toggle = function (item, list) {
                var idx = list.indexOf(item);
                if (idx > -1) list.splice(idx, 1);
                else {
                    if (list.length>=1){
                       notificationToast({"message":'Only one corporate could be selected at ont time.'})
                    }
                else
                    {list.push(item)}
            };
            };

            $scope.exists = function (item, list) {
                return list.indexOf(item) > -1;
            };

            $http.get('/server/querycorporateswithconditions?company='+$rootScope.userAtCompany.companyName+
                "&period="+$rootScope.userAtCompany.currentPeriod).success(function(data){
                 $scope.corporates = data
                
             $scope.progress= 1
             var total_time = 660
             var interval =    $interval(function (){
                    //console.log($scope.progress)
                   total_time -= 1
                 $scope.progress= parseInt((1-total_time/660)*100)
                 $scope.stop_watch = parseInt(total_time/60)  + ' M  ' + total_time%60 +' S '
                 if(total_time==30){
                     notificationToast({"message":"Corporate Bid will closed after 30 seconds."})
                 }
                 if (total_time == 0){
                        $interval.cancel(interval)
                        $mdDialog.cancel();
                    }
                },1000)

            })

            $scope.offer={current_share_price:98,treasury_shares:4900}

            $scope.submit = function (selectedNiches,event) {

                //console.log(selectedNiches)
                $http.post('server/visionarycompetition',data={companyName:$rootScope.userAtCompany.companyName,teamName:$rootScope.userAtCompany.teamName,selectedNiches:selectedNiches}).success(function(d){
                    console.log(d)
                    $window.location.reload();
                })


                $mdDialog.cancel();
                $mdSidenav('left').close()

            };

        }
    }
    function forecastingfn() {

        $mdDialog.show({
            clickOutsideToClose: false,
            bindToController: true,
            controller: forecastingCtrl,
            controllerAs: 'dialog',
            templateUrl: '/server/forecasting'
        });

        function forecastingCtrl ($scope,$mdDialog,$http) {
            $scope.close = function () {
                $mdDialog.cancel();
            };
            $scope.forecasting={}
            // console.log(($scope.workforce.projectedsales.b2b)+($scope.workforce.projectedsales.b2c)+($scope.workforce.projectedsales.newoffering))
            $http.get('/server/queryforecastingatstart?username='+$rootScope.current_user.username).success(function(d){
                console.log(d)
                if (d){
                    $scope.forecasting = d
            }

                            })

            //$scope.selectedIndex=1

            $scope.submit = function (forecasting) {

                $http.post('server/forecasting',data={username:$rootScope.current_user.username,forecasting:forecasting}).success(function(d){
                    $window.location.reload();})
                $mdDialog.cancel();
                $mdSidenav('left').close()

            };

        }
    }
    notificationToast = function (message) {
       //console.log(message)
        if (Array.isArray(message)) {
           var  i=0
//showToast(message[i])
        intervalid= setInterval( function(){
             //console.log(message[i]
            if (message.length <= 1){
      $mdToast.hide()
     clearInterval(intervalid);}
            else{
                 showToast(message[i])
             message.splice(i,1)
             //console.log(message.length)
            }

             i++;
             if (i>= message.length){i=0}


         },6000)

        }
        else {
            if (message ==''){
                $mdToast.hide()
     clearInterval(intervalid);
            }
            else{showToast(message)
            message=''}
        }

        function showToast(m) {
            
            var toast = $mdToast.simple()
                .content(m.message)
                .action('OK')
                .highlightAction(false)
                .hideDelay(6000)
                .position('bottom right');

        $mdToast.show(toast).then(function (response) {
            if (response == 'ok') {
                $mdToast.hide()
            }
           $http.post('/server/setmessagestatus',data=m._id).success(function (res) {

           })
            
            
        });
    }

        };

  }])

.controller('BudgetCtrl',function ($scope,$window,$mdSidenav,$http,$mdDialog,current_user,$rootScope,$mdToast,$location) {
    accountBudgetfn = function () {
        console.log('budget')
        // Show the dialog
        $mdSidenav('budget').toggle();

        $http.get("/server/accountbudget",{params:{username:$rootScope.current_user.username}}).success(function (res) {
            console.log(res)
            $scope.current_budget = res
        })
        $scope.current_index = -1
        $scope.budget_input =  function (index,budget) {
            console.log(index,budget)
            
            $scope.current_index = index
        }
        $scope.$watchCollection('current_index',function (newVal,oldVal) {
            if (oldVal != undefined && newVal!= oldVal){
               // console.log( oldVal)
                if (oldVal!=-1){
                    $http.post('/server/accountbudget', $scope.current_budget[oldVal]).success(function (res) {
                    //    console.log(res)
                    })
                }

            }
        })

    }
    })

.controller('RightCtrl', function ($scope, $mdSidenav, $http,$rootScope) {
    $scope.close = function () {$mdSidenav('right').close()};

  })

