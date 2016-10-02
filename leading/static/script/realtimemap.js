/**
 * Created by isaac on 31/08/15.
 */

app.factory('map', function ($http, $q, $rootScope) {
    var deffered = $q.defer();
    var coordinates = {}
    map.get = function () {
        $http({
            method: 'GET',
            url: '/rest/sessions/sessions',
            params: {'datatype': 'mapcentre'}
        }).then(function success(d) {
            if (d.data.datatype == 'mapcentre') {
                //console.log(d.data.zoomLevel, d.data.centre)
                coordinates = {
                    latlngs: [d.data.centre.lat, d.data.centre.lng],
                    zoom: d.data.zoomLevel
                }
            }
            else {
                coordinates = {
                    latlngs: [46.4667, -98.5167],
                    zoom: 5
                }
            }
            //console.log(coordinates)
            deffered.resolve();
        });
        return deffered.promise;
    }
    map.default = function () {
        return coordinates
    }
    map.data = function () {
        var mapdefine = L.map('map', {
            center: coordinates.latlngs,
            zoom: coordinates.zoom,
            //zoomControl: false,
            keyboard: false,
            maxZoom: 16,
            //contextmenu: true,
            //contextmenuWidth: 140,
            editable: true
        });

        return mapdefine
    }

    return map;
})

    .controller('lefttopMenuCtrl', ['$rootScope', '$scope', "$mdSidenav", "$http", '$window', function ($rootScope, $scope, $mdSidenav, $http, $window) {


        $scope.portScan = function () {
            $rootScope.closeSidenav('left');
            if ($rootScope.socketPortScan == undefined) {
                $rootScope.socketPortScan = io.connect();
                $rootScope.portScanFunc();
            } else if ($rootScope.socketPortScan.connected) {
                console.log("Now Connected ..........");
                //$rootScope.socketPortScan.disconnect()
            } else {
                console.log("No Connected, Begin new scan");
                $rootScope.socketPortScan.connect();
                $rootScope.portScanFunc();
            }

        }

        $scope.exportExcel = function () {
            $mdDialog.show({
                controller: exExcel,
                templateUrl: '/exportExcel',
                parent: angular.element(document.body),
                //targetEvent: ev,
                clickOutsideToClose: false,
            })
        }
        function exExcel($scope, $mdDialog) {
            $scope.title_dialog = "Export to Excel"

            $scope.exportDevices = function () {
                $window.location.href = '/exportDevices'
            }
            $scope.exportConnections = function () {
                $window.location.href = '/exportConnections'
            }
            $scope.cancel = function () {
                $mdDialog.cancel();
            }
        }

        $scope.backtomap = function () {
            window.location.href = '/'
        }
    }])

    .controller('SideNavCtrl', ['$rootScope', '$scope', "$mdSidenav", "current_user", "$http", '$window', function ($rootScope, $scope, $mdSidenav, current_user, $http, $window) {
        current_user.getData().then(function () {
            $scope.current_user = {}
            $scope.current_user.username = current_user.username()
            $scope.current_user.permission = current_user.permission()
            $scope.current_user.status = current_user.status()
            $scope.current_user.settings = current_user.settings()
            //console.log($scope.current_user.status)

            switch ($scope.current_user.permission) {
                case '0':
                    $scope.current_user.permissionText = 'Superuser (Read/Write)';
                    break;
                case '1':
                    $scope.current_user.permissionText = 'User (Read/Write)';
                    break;
                case '2':
                    $scope.current_user.permissionText = 'User (Read Only)';
                    break;
                default:
                    break;
            }

        })

        $scope.logout = function () {
            //$rootScope.closeSidenav('left')
            $http.get('/rest/users/logout').success(function (d) {
                window.location.href = "/";
            })
        }
        $scope.filemanager = function () {
            window.location.href = '/files'
        }

        $rootScope.toggleSidenav = function (menuId) {
            $rootScope.map_instance.removeControl($rootScope.deviceSummary)
            $rootScope.map_instance.removeControl($rootScope.portSummary)
            $mdSidenav(menuId).toggle();
        };

        $rootScope.closeSidenav = function (menuId) {
            $rootScope.map_instance.removeControl($rootScope.deviceSummary)
            $rootScope.map_instance.removeControl($rootScope.portSummary)
            $mdSidenav(menuId).close();
        }

        $rootScope.openSidenav = function (menuId, deviceID, info) {
            $rootScope.map_instance.removeControl($rootScope.deviceSummary)
            $rootScope.map_instance.removeControl($rootScope.portSummary)

            if (menuId != 'mainmenu')
                $rootScope.closeSidenav('mainmenu')
            if (menuId == 'processdevice') {
                $http.get('/rest/workflow/queryworkflow', {
                    params: {
                        processName: 'addDevice',
                        username: $scope.current_user.username
                    }
                }).success(function (res) {
                    $rootScope.tasks = res
                    if (deviceID == 'fromOpenAddress') {
                        //$rootScope.clearData(false);
                        $rootScope.clearSearchLayer();
                        $rootScope.tasks[3].data = {}
                        $rootScope.tasks[3].data.location = {
                            address: {
                                country: '',
                                province: info.location.address.province,
                                street: info.location.address.street,
                                streetNo: info.location.address.streetNo,
                                city: info.location.address.city
                            },
                            coordinates: {
                                lat: parseFloat(info.location.coordinates.lat),
                                lng: parseFloat(info.location.coordinates.lng)
                            }
                        }
                        $rootScope.tasks[3].status = 'saved'
                        $rootScope.tasks[3].method = 'fromOpenAddress'
                        $http.post('/rest/workflow/launchworkflow', $rootScope.tasks[3]).success(function (re) {
                            $rootScope.tasks = re;
                            $rootScope.toggleSidenav('processdevice');

                        })
                    } else {

                        $rootScope.toggleSidenav('processdevice');
                    }


                })

            }
            else if (menuId == 'editDevice') {
                $http.get('/rest/workflow/queryworkflow', {
                    params: {
                        deviceID: deviceID,
                        processName: 'addDevice',
                        username: $scope.current_user.username
                    }
                }).success(function (res) {
                    $rootScope.tasks = res
                    $http.get('/rest/devices/getdevices', {
                        params: {key: deviceID}
                    }).success(function (dev) {
                        for (var i = 0; i < res.length; i++) {
                            $rootScope.tasks[i].data = dev
                            $rootScope.tasks[i].status = 'saved'
                            $rootScope.tasks[i].method = 'edit'
                            $rootScope.tasks[i].canSetAddress = false
                        }
                    })

                })
                $mdSidenav('processdevice').toggle();
            }
            else if (menuId == 'addPtn') {
                $rootScope.closeSidenav('lineClick')
                $http.get('/rest/workflow/queryworkflow', {
                    params: {
                        processName: 'addPtn',
                        username: $scope.current_user.username
                    }
                }).success(function (res) {
                    $rootScope.tasks = res
                })
                $mdSidenav('processptn').toggle();
            }
            else if (menuId == 'editPtn') {
                $rootScope.closeSidenav('lineClick')
                $http.get('/rest/workflow/queryworkflow', {
                    params: {
                        processName: 'addPtn',
                        username: $scope.current_user.username
                    }
                }).success(function (res) {
                    $rootScope.tasks = res
                    $http.get('/rest/devices/getdevices', {
                        params: {key: deviceID}
                    }).success(function (dev) {
                        for (var i = 0; i < res.length; i++) {
                            $rootScope.tasks[i].data = dev
                            $rootScope.tasks[i].status = 'saved'
                        }

                    })
                })
                $mdSidenav('processptn').toggle();
            }
            else {
                $rootScope.toggleSidenav(menuId)
            }

        };

        $scope.settings = function () {
            $window.location.href = '/settings'
        }


    }])

    .controller("mapCtrl", ["$scope", "$http", "map", "$mdToast", "current_user", "$rootScope", "windowsize", "$mdDialog", '$timeout', '$mdSidenav', '$element', '$interval', function ($scope, $http, map, $mdToast, current_user, $rootScope, windowsize, $mdDialog, $timeout, $mdSidenav, $element, $interval) {

        $scope.setTableHeight = function () {
            var style = {height: windowsize.height - 64 + 'px'}
            return style
        }

        current_user.getData().then(function () {
            $scope.current_user = {}
            $scope.current_user.username = current_user.username()
            $scope.current_user.settings = current_user.settings()
            //console.log($scope.current_user.settings)

            map.get().then(function () {
                $rootScope.map_instance = map.data()
                //  baselayer = L.tileLayer('http://' + $scope.current_user.settings.MAP_SERVER_IP + '/mapcache/tms/1.0.0/osm@g/{z}/{x}/{y}.png', {
                //    maxZoom: 18,
                //   tms: true
                // })
                // console.log($location.host())//$scope.current_user.settings.MAP_SERVER_IP
                //var baselayer = L.tileLayer('http://' + $location.host() + '/osm_tiles/{z}/{x}/{y}.png', {maxZoom: 18})
                var baselayer = L.tileLayer('http://' + $scope.current_user.settings.MAP_SERVER_IP + '/osm_tiles/{z}/{x}/{y}.png', {maxZoom: 18})
                //baselayer = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
                // maxZoom: 18,
                //  id: 'mapbox.emerald',
                //  accessToken: 'pk.eyJ1IjoiaXNhYWNqaWFuZyIsImEiOiJlMDgxNTZmYmU0YTMwYTYyNjYzMDhjMjgyMWZhMTFiNiJ9.BPBto3cpKfLph00_bNmzFQ'
                // })

                $rootScope.map_instance.zoomControl.remove();
                baselayer.addTo($rootScope.map_instance);
                $rootScope.nodes_update()
                //$rootScope.toggleSidenav('nodeClick')
            })
        })

        var group_trans_layer = new L.featureGroup()
        var group_logic_layer = new L.featureGroup()

        var pruneCluster = new PruneClusterForLeaflet(60, 20);
        //var colors = ['#009933', '#404040', '#ff8000']
        var colors = ['dodgerblue', 'dodgerblue', 'dodgerblue']

        var infoControl = L.control({
            position: 'bottomright'
        })
        $rootScope.modeTransfer = L.control({
            position: 'bottomright'
        })

        $rootScope.portSummary = infoControl

        $rootScope.deviceSummary = infoControl

        $rootScope.scanPorts = infoControl

        $rootScope.portSummary.onAdd = function () {
            this._div = L.DomUtil.create('div', '$rootScope.portSummary'); // create a div with a class "info"
            this.update();
            return this._div;
        };

        $rootScope.deviceSummary.onAdd = function () {
            this._div = L.DomUtil.create('div', '$rootScope.deviceSummary'); // create a div with a class "info"
            this.update();
            return this._div;
        };

        $rootScope.scanPorts.onAdd = function () {
            this._div = L.DomUtil.create('div', '$rootScope.scanPorts'); // create a div with a class "info"
            this.update();
            return this._div;
        };

        //watch the status of lineClick side bar
        $scope.$watch(function () {
                return $mdSidenav('lineClick').isOpen();
            },
            function (newValue, oldValue) {
                if (!newValue) {
                    $scope.socketLineClick = io.connect();
                    $scope.socketLineClick.disconnect()
                    console.log('socket_LineClick disconnected')
                } else {
                    $scope.socketLineClick.connect();
                    console.log('socket_LineClick connected')
                }
            }
        );

        //Scan all the ports
        $rootScope.portScanFunc = function () {
            //console.log('Ports Scanning setting')
            $scope.preDevice = undefined;
            $mdDialog.show({
                controller: scanPortsCtrl,
                templateUrl: '/app/system/scanports',
                parent: angular.element(document.body),
                clickOutsideToClose: false,
                locals: {username: $scope.current_user.username}
            })


            //$scope.get_ready(socketParametersAllNode, 0, 'portsScan')
        }

        function scanPortsCtrl($scope, username) {
            $scope.cancel = function () {
                $rootScope.socketPortScan.disconnect()
                $mdDialog.cancel();
            };
            $element.find('input').on('keydown', function (ev) {
                ev.stopPropagation();
            });
            $scope.allDevices = $rootScope.devices
            $scope.selectedMethod = 'all'
            $scope.selectedDevices = [];
            $scope.scanPorts = function (method) {
                if (method == 'all') {
                    //console.log('All Ports Scanning')
                    $rootScope.get_ready(socketParametersAllNode, 0, 'portsScan')
                    $mdDialog.cancel()
                } else {
                    $scope.clearSearchTerm = function () {
                        $scope.searchTerm = '';
                    };
                    // socketParametersAllNode.forEach(function (d) {
                    //     console.log(d)
                    // })
                    console.log($scope.selectedDevices)
                }
            }
        }

        //get port bandwidth
        var device_scan_layer = new L.featureGroup()
        $rootScope.get_bandwidth = function (parameters, ind, method) {
            if (method == 'lineClick') {
                $scope.socketLineClick.emit('getPortsBandWidth', parameters[ind], function (res) {
                    //console.log()
                    if (res.length == 0) {
                        $rootScope.get_bandwidth(parameters, ind, method)
                    }
                    else {
                        if (res[res.length - 1].data != null || res[res.length - 1].data != undefined || res[res.length - 1].data != '') {
                            //console.log(parameters[ind], res)
                            //console.log(parameters[ind].deviceData.deviceID)
                            if (res[res.length - 1].data.ipxPortBandwidthStatusTxRate != undefined) {
                                if ((res[res.length - 1].data.ipxPortBandwidthStatusTxRate / 1024) > 1000) {
                                    parameters[ind].deviceData.upload = (res[res.length - 1].data.ipxPortBandwidthStatusTxRate / 1024 / 1024).toFixed(2).toString() + ' Gb/s';
                                }
                                else
                                    parameters[ind].deviceData.upload = (res[res.length - 1].data.ipxPortBandwidthStatusTxRate / 1024).toFixed(2).toString() + ' Mb/s';
                            }
                            else
                                parameters[ind].deviceData.upload = '0.00 Mb/s';
                            if (res[res.length - 1].data.ipxPortBandwidthStatusRxRate != undefined) {
                                if ((res[res.length - 1].data.ipxPortBandwidthStatusRxRate / 1024) > 1000) {
                                    parameters[ind].deviceData.download = (res[res.length - 1].data.ipxPortBandwidthStatusRxRate / 1024 / 1024).toFixed(2).toString() + ' Gb/s';
                                }
                                else
                                    parameters[ind].deviceData.download = (res[res.length - 1].data.ipxPortBandwidthStatusRxRate / 1024).toFixed(2).toString() + ' Mb/s';
                            }
                            else
                                parameters[ind].deviceData.download = '0.00 Mb/s';
                            //console.log($scope.lineinfo.options.data.configList)
                        }
                        $rootScope.get_ready(parameters, ind + 1, method)
                    }
                });
            }
            else if (method == 'portsScan') {
                $rootScope.socketPortScan.emit('getPortsBandWidth', parameters[ind], function (res) {

                    //console.log()
                    if (res.length == 0) {
                        $rootScope.get_bandwidth(parameters, ind, method)
                    }
                    else {
                        ch = new Date().getHours()
                        cm = new Date().getMinutes()
                        cs = new Date().getSeconds()
                        if (ch < 10) {
                            ch = '0' + ch;
                        }
                        if (cm < 10) {
                            cm = '0' + cm;
                        }
                        if (cs < 10) {
                            cs = '0' + cs;
                        }
                        ct = ch + ':' + cm + ':' + cs

                        //console.log(parameters[ind].selectedID, parameters[ind].selectedPort, ct)
                        //console.log($scope.preDevice, parameters[ind].selectedID)
                        //$rootScope.clearSearchLayer()
                        //$rootScope.markerFocus(parameters[ind].coordinates)
                        $rootScope.scanPorts.update = function (props) {
                            this._div.innerHTML =
                                '<div class="info" style="height: 10px;opacity: 0.5;margin-bottom: -5px; margin-left: -5px">' +
                                '<p style="margin-top: -4px">Scanning: (' + (ind + 1) + '/' + parameters.length + ') ' + parameters[ind].deviceName + ', Port: ' + parameters[ind].selectedPort + '</p>' +
                                '</div>'
                        };

                        if (parameters[ind].portStatus == 'Init' && (res[res.length - 1].data.ipxPortBandwidthStatusTxRate > 0 || res[res.length - 1].data.ipxPortBandwidthStatusRxRate > 0)) {
                            if ($scope.preDevice != parameters[ind].selectedID) {
                                $rootScope.map_instance.removeLayer(device_scan_layer)
                                //device_scan_layer.clearLayers()
                                var marker_scan = L.marker(parameters[ind].coordinates)
                                marker_scan.setIcon(
                                    L.divIcon({
                                        className: 'svg-marker-scan',
                                        html: '<div></div>',
                                        iconSize: [48, 48],
                                        iconAnchor: [28, 28],
                                    })
                                )
                                device_scan_layer.addLayer(marker_scan)
                                device_scan_layer.addTo($rootScope.map_instance)
                                device_scan_layer.bringToBack()
                                $rootScope.map_instance.removeControl($rootScope.deviceSummary)
                                $rootScope.map_instance.removeControl($rootScope.portSummary)
                            }
                            $scope.preDevice = parameters[ind].selectedID;
                        }
                        $rootScope.scanPorts.addTo($rootScope.map_instance);
                        $rootScope.get_ready(parameters, ind + 1, method)
                    }
                });
            }

        }

        $rootScope.get_ready = function (parameters, ind, method) {
            if (method == 'lineClick') {
                if (ind >= parameters.length) {
                    ind = 0
                }
                $scope.socketLineClick.emit('getReady', parameters[ind], function (response) {
                    //console.log('get ready', response)
                    $scope.message = response.result

                    if (response.status == "success") {
                        // console.log(para)
                        $rootScope.get_bandwidth(parameters, ind, method)
                    }
                    else {
                        $scope.socketLineClick.emit('getReady', parameters[ind], method)
                    }

                });
            }
            else if (method == 'portsScan') {
                if (ind >= parameters.length) {
                    $rootScope.socketPortScan.disconnect()
                }
                $rootScope.socketPortScan.emit('getReady', parameters[ind], function (response) {
                    //console.log('get ready', response)
                    $scope.message = response.result

                    if (response.status == "success") {
                        // console.log(para)
                        $rootScope.get_bandwidth(parameters, ind, method)
                    }
                    else {
                        $rootScope.socketPortScan.emit('getReady', parameters[ind], method)
                    }

                });
            }

        }

        $scope.nodeSideNav = function (dev, coordinates) {
            $http({
                method: 'POST',
                url: '/rest/devices/getdeviceselite',
                data: {"key": dev._id}
            }).success(function (node) {
                if (node.properties.deviceType != 'PTN')
                    $rootScope.toggleSidenav('deviceClick')
                $scope.selectedDeviceInfo = node
                $scope.nodeInfo = node;
                var dateFormat = new Date($scope.nodeInfo.installedDate);
                $scope.nodeInfo.installedDate = dateFormat.getFullYear() + '-' + (dateFormat.getMonth() + 1) + '-' + dateFormat.getDate();
                $scope.showNoItem = true;
                $scope.nodeInfo.ports.forEach(function (p) {
                    if (p.status != 'Init') {
                        if (p.route != {})  $scope.showNoItem = false
                    }
                });

                //group function
                $scope.shownGroup = 'port'; //default selected group
                $scope.toggleGroup = function (group) {
                    if ($scope.isGroupShown(group)) {
                        $scope.shownGroup = null;
                    } else {
                        $scope.shownGroup = group;
                    }
                };
                $scope.isGroupShown = function (group) {
                    return $scope.shownGroup === group;
                };
                //end

                $scope.fileManager = function (node) {
                    $http.post('/rest/sessions/sessions', data = {
                        "datatype": "mapcentre",
                        "ipaddress": node.ipAddress,
                        "zoomLevel": $rootScope.map_instance.getZoom(),
                        "centre": coordinates
                    }).success(function () {
                        //console.log("success")
                    });
                    window.location.href = '/files?deviceID=' + node._id;
                };

                $scope.ipxPanel = function (node, port) {
                    $http.post('/rest/sessions/sessions', data = {
                        "datatype": "mapcentre",
                        "ipaddress": node.ipAddress,
                        "currentPort": port,
                        "zoomLevel": $rootScope.map_instance.getZoom(),
                        "centre": coordinates
                    }).success(function () {
                        //console.log("success")
                    });
                    if (node.properties.deviceType != 'FP') {

                        if (port == undefined) {
                            port = {portID: 1}
                        }
                        window.location.href = '/ipx?id=' + node._id + '&port=' + port.portID;
                    } else if (node.properties.deviceType == 'FP') {
                        window.location.href = '/ipx?id=' + node.ports[0].route.deviceID + '&port=' + node.ports[0].route.portID;
                    }
                };

                $scope.schematic = function (node) {
                    $rootScope.closeSidenav('deviceClick');
                    $mdDialog.show({
                        controller: deviceDetailsMDCtrl,
                        templateUrl: '/app/graphview/nodedetails',
                        parent: angular.element(document.body),
                        //targetEvent: task.ev,
                        clickOutsideToClose: false,
                        locals: {node: node}
                    })
                };

                $scope.editDevice = function (node) {
                    if (node.properties.deviceType == 'PTN') {
                        $rootScope.closeSidenav('ptnClick');
                        $rootScope.openSidenav('editPtn', node._id);
                    }
                    else {
                        $rootScope.closeSidenav('deviceClick');
                        $rootScope.openSidenav('editDevice', node._id);
                    }
                };

                $scope.deleteNode = function (node) {
                    $rootScope.closeSidenav('deviceClick');
                    $rootScope.closeSidenav('ptnClick');
                    if (node.properties.deviceType == 'PTN') {
                        confirm = $mdDialog.confirm().title(node.deviceName)
                            .content('Type: ' + node.properties.deviceType + '  @ ' + node.IPAddress + ' <br/> ' + '<strong> Are you sure to delete it and its connections? </strong>')
                            .cancel('No').ok('Yes');
                    } else {
                        confirm = $mdDialog.confirm().title(node.deviceName)
                            .content('Type: ' + node.properties.deviceType + '  @ ' + node.IPAddress + ' <br/> Address: ' + node.location.address.streetNo + ' ' + node.location.address.street + '. ' + node.location.address.city + '. ' + node.location.address.province + '<br/> ' + '<strong> Are you sure to delete it and its connections? </strong>')
                            .cancel('No').ok('Yes');
                    }
                    $mdDialog.show(confirm).then(function () {
                        $http.post('/rest/devices/deletedevice', data = node).success(function (response) {
                            $rootScope.notificationToast(response.message);
                            $rootScope.closeSpiderfy();
                            $rootScope.nodes_update();
                        })
                    }, function () {
                        $mdDialog.cancel();
                    })
                        .finally(function () {
                            confirm = undefined;
                            //$rootScope.nodes_update();
                        });
                };

                //Flight Pack Ping Func
                $scope.showPingProgress = true;
                $scope.determinateValue = 0;
                $scope.pingResult = false;
                $scope.pingIcon = "/static/icon/ic_favorite_white_48px.svg"
                $scope.pingIconOk = "/static/icon/ic_done_white_48px.svg"
                $scope.pingIconFailHalf = "/static/icon/ic_error_white_48px.svg"
                $scope.pingIconFail = "/static/icon/ic_clear_white_48px.svg"
                $scope.ngStyleForButton = {
                    "background-color": "#9E9E9E",
                }
                $scope.pingFP = function () {
                    $scope.determinateValue = 0
                    $scope.showVerify = true
                    $interval.cancel($scope.pingProgress)
                    $scope.ngStyleForProgress = {}
                    $scope.pingIcon = "/static/icon/ic_favorite_white_48px.svg"
                    $scope.ngStyleForButton = {
                        "background-color": "#9E9E9E",
                    }
                    $scope.determinateValue = 0;
                    $http.post('/rest/devices/pingIPAddress', data = {
                        'device': node
                    }).success(function (response) {
                        // console.log(response)
                        $scope.showVerify = false;
                        $scope.pingResult = response
                    });
                    $scope.pingProgress = $interval(function () {
                        $scope.determinateValue += 5;

                        if ($scope.determinateValue > 100 && $scope.pingResult == 1) {
                            $scope.ngStyleForButton = {
                                "background-color": "#00E600"
                            }
                            $scope.ngStyleForProgress = {'visibility': 'hidden'}
                            $scope.pingIcon = $scope.pingIconOk
                        }
                        else if ($scope.determinateValue > 100 && $scope.pingResult == 2) {
                            $scope.ngStyleForButton = {
                                "background-color": "#FF0000"
                            }
                            $scope.ngStyleForProgress = {'visibility': 'hidden'}
                            $scope.pingIcon = $scope.pingIconFail
                        }
                        else if ($scope.determinateValue > 100 && $scope.pingResult == 3) {
                            $scope.ngStyleForButton = {
                                "background-color": "#FF6600"
                            }
                            $scope.ngStyleForProgress = {'visibility': 'hidden'}
                            $scope.pingIcon = $scope.pingIconFailHalf
                        }
                    }, 100);
                }
            })
        }

        //watch the status of nodeClick side bar
        $scope.canNotCloseSideBar = false
        $scope.$watch(function () {
                return $mdSidenav('deviceClick').isOpen();
            },
            function (newValue, oldValue) {
                if (!newValue) {
                    $scope.ngStyleForProgress = {}
                    $interval.cancel($scope.pingProgress)
                }
                else {
                    $interval.cancel($scope.pingProgress)
                    $http.post('/rest/devices/pingIPAddress', data = {
                        'device': $scope.selectedDeviceInfo
                    }).success(function (response) {
                        // console.log(response)
                        $scope.canNotCloseSideBar = true
                        $scope.showVerify = false;
                        $scope.pingResult = response
                    });
                    $scope.pingProgress = $interval(function () {
                        $scope.determinateValue += 5;
                        if ($scope.determinateValue > 100 && $scope.pingResult == 1) {
                            $scope.ngStyleForButton = {
                                "background-color": "#00E600"
                            }
                            $scope.ngStyleForProgress = {'visibility': 'hidden'}
                            $scope.pingIcon = $scope.pingIconOk
                            //$scope.canNotCloseSideBar=false
                            $interval.cancel($scope.pingProgress)
                        }
                        else if ($scope.determinateValue > 100 && $scope.pingResult == 2) {
                            $scope.ngStyleForButton = {
                                "background-color": "#FF0000"
                            }
                            $scope.ngStyleForProgress = {'visibility': 'hidden'}
                            $scope.pingIcon = $scope.pingIconFail
                            //$scope.canNotCloseSideBar=false
                            $interval.cancel($scope.pingProgress)
                        }
                        else if ($scope.determinateValue > 100 && $scope.pingResult == 3) {
                            $scope.ngStyleForButton = {
                                "background-color": "#FF6600"
                            }
                            $scope.ngStyleForProgress = {'visibility': 'hidden'}
                            $scope.pingIcon = $scope.pingIconFailHalf
                            $interval.cancel($scope.pingProgress)
                        }
                    }, 100);
                }
            }
        );

        $scope.openSelectedNode = function (node) {
            $rootScope.toggleSidenav('nodeClick')
            $scope.shownGroup = 'ipx';
            $scope.nodeDetail = node
            $http({
                    method: 'POST',
                    url: '/rest/devices/getdeviceselite',
                    data: {key: 'list', id_list: node.deviceList, tags: $rootScope.selectedTags}
                }
            ).success(function (devices) {
                //console.log(devices)
                $rootScope.closeSidenav('nodeGroupClick')
                //console.log(node)

                $scope.deviceDetailList = devices.filter(function (d) {
                    return d.properties.deviceType != 'PTN'
                })

                $scope.ipxDevices = [];
                $scope.muxDevices = [];
                $scope.otherDevices = [];
                devices.forEach(function (d) {
                    if (d.properties.deviceType == 'IPX') {
                        $scope.ipxDevices.push(d)
                    } else if (d.properties.deviceType == 'MUX' || d.properties.deviceType == 'DEMUX') {
                        $scope.muxDevices.push(d)
                    } else if (d.properties.deviceType == 'PTN') {

                    } else {
                        $scope.otherDevices.push(d)
                    }
                })

                //default selected group
                if ($scope.ipxDevices.length > 0) {
                    $scope.shownGroup = 'ipx';
                } else if ($scope.muxDevices.length > 0) {
                    $scope.shownGroup = 'mux';
                } else if ($scope.otherDevices.length > 0) {
                    $scope.shownGroup = 'other';
                }

                $scope.toggleGroup = function (group) {
                    if ($scope.isGroupShown(group)) {
                        $scope.shownGroup = null;
                    } else {
                        $scope.shownGroup = group;
                    }
                };
                $scope.isGroupShown = function (group) {
                    return $scope.shownGroup === group;
                };

                $scope.schematicGroup = function () {
                    $rootScope.closeSidenav('nodeClick');
                    $mdDialog.show({
                        controller: nodeDetailsMDCtrl,
                        templateUrl: '/app/graphview/groupdetails',
                        parent: angular.element(document.body),
                        //targetEvent: task.ev,
                        clickOutsideToClose: false,
                        locals: {group: devices}
                    })
                }

                $scope.lock = function () {
                    var lockStatus;
                    if (node.lockStatus == 'locked')
                        lockStatus = 'unlocked';
                    else
                        lockStatus = 'locked';

                    $http.post('/rest/nodes/setnodestatus', data = {
                        'nodeId': node._id,
                        "status": lockStatus
                    }).success(function (response) {
                        // console.log(response)
                        $rootScope.notificationToast(response.message);
                        $rootScope.nodes_update();
                        $rootScope.closeSidenav('nodeClick')
                    });
                };

                $scope.deleteNode = function () {
                    $rootScope.closeSidenav('nodeClick');
                    confirm = $mdDialog.confirm().title(node.nodeName)
                        .content('Address: ' + node.location.address.streetNo + ' ' + node.location.address.street + '. ' + node.location.address.city + '. ' + node.location.address.province + '<br/> ' +
                            '<strong> Warning: You are about to delete the selected Node.<br /> (All associated devices and connections will also be deleted) </strong>')
                        .cancel('No').ok('Yes');

                    $mdDialog.show(confirm).then(function () {
                        $http.post('/rest/nodes/deletenode', data = node).success(function (response) {
                            $rootScope.notificationToast(response.message);
                            $rootScope.closeSpiderfy();
                            $rootScope.nodes_update();
                        })
                    }, function () {
                        $mdDialog.cancel();
                    })
                        .finally(function () {
                            confirm = undefined;
                            //$rootScope.nodes_update();
                        });
                };

                $scope.openSelectedDevice = function (dev) {
                    $scope.selectedDeviceInfo = dev
                    var temp = [dev.location.coordinates.lat, dev.location.coordinates.lng];
                    var nodelist = []
                    nodelist.push(temp)
                    $rootScope.map_instance.fitBounds(nodelist)
                    $rootScope.closeSidenav('nodeClick')
                    $scope.nodeSideNav(dev, node.location.coordinates)
                }

                $scope.addDeviceFromNode = function () {
                    $rootScope.closeSidenav('nodeClick');
                    $rootScope.openSidenav('processdevice', 'fromOpenAddress', node)
                }

            })
        }

        $scope.copyNode = function (node) {
            if (Object.keys(node).indexOf('_id') > -1) {
                delete node['_id']
            }
            $http.post("/rest/nodes/setnode", node).success(function (res) {
                $rootScope.toggleSidenav('nodeGroupClick')
                $rootScope.nodes_update()
            })
        }

        $scope.closeSide = function (name) {
            $rootScope.closeSidenav(name)
        }

        $rootScope.closeSpiderfy = function () {
            pruneCluster.spiderfier.Unspiderfy()
            $rootScope.map_instance.removeControl($rootScope.deviceSummary)
            $rootScope.map_instance.removeControl($rootScope.portSummary)
            // $timeout(function () {
            //     pruneCluster.RemoveMarkers()
            //     $rootScope.devices.forEach(function (d) {
            //         if (Array.isArray(d.location.coordinates)) {
            //             var cluster_marker = new PruneCluster.Marker(d.location.coordinates[0], d.location.coordinates[1], d, d.status == 'Active' ? 0 : (d.status == 'Concept' ? 1 : 2))
            //         }
            //         else {
            //             var cluster_marker = new PruneCluster.Marker(d.location.coordinates.lat, d.location.coordinates.lng, d, d.status == 'Active' ? 0 : (d.status == 'Concept' ? 1 : 2))
            //         }
            //         if (true) {
            //             pruneCluster.RegisterMarker(cluster_marker)
            //         }
            //     })
            //     pruneCluster.addTo($rootScope.map_instance)
            //     pruneCluster.ProcessView()
            // }, 0)
        }

        $scope.changeSide = function (closeName, openName) {
            //console.log(closeName, openName)
            $rootScope.closeSidenav(closeName)
            $rootScope.openSidenav(openName)
        }

        //functions for route click
        $scope.editRoute = function () {
            //console.log($scope.lineinfo)
            $rootScope.closeSidenav('lineClick');
            $rootScope.map_instance.removeControl($rootScope.modeTransfer)
            //$scope.lineinfo.toggleEdit();
            if ($scope.lineinfo.options.data.editStatus != 'Editing') {
                //$scope.lineinfo.setStyle({color: "red"})
                var editStatus = {routeID: $scope.lineinfo.options.data._id, editStatus: 'Editing'}
            }
            else {
                var editStatus = {routeID: $scope.lineinfo.options.data._id, editStatus: 'TransView'}
            }
            $http.post('/rest/routes/setroutestatus', editStatus).success(function () {
                var condition = $rootScope.selectedTags.length > 0 ? {
                    key: 'tags',
                    type: ['IPX', 'FP', 'MUX', 'DEMUX'],
                    tags: $rootScope.selectedTags,
                } : null
                $rootScope.nodes_update(condition)
                nodelist = [];
                $scope.lineinfo.options.data.geo.forEach(function (d) {
                    nodelist.push(d)
                })
                $rootScope.map_instance.fitBounds(nodelist)

            })

        }

        $scope.openSelectedDeviceOnRoute = function (dev) {
            //console.log(dev)
            $rootScope.closeSidenav('lineClick')
            //$rootScope.toggleSidenav('deviceClick')
            $rootScope.markerFocus(dev.location.coordinates)
            var temp = [dev.location.coordinates.lat, dev.location.coordinates.lng];
            var nodelist = []
            nodelist.push(temp)
            $rootScope.map_instance.fitBounds(nodelist)
            $scope.nodeSideNav(dev, dev.location.coordinates)

            $timeout(function () {
                $rootScope.clearSearchLayer()
            }, 5000)
        }

        $scope.openSelectedPTNOnRoute = function (dev) {
            $http.post('/rest/routes/setroutestatus', {
                routeID: $scope.lineinfo.options.data._id,
                editStatus: 'TransView'
            }).success(function (res) {
                //console.log(res)
                var condition = $rootScope.selectedTags.length > 0 ? {
                    key: 'tags',
                    type: ['IPX', 'FP', 'MUX', 'DEMUX'],
                    tags: $rootScope.selectedTags,
                } : null
                $rootScope.nodes_update(condition)
                $rootScope.closeSidenav('lineClick')
                $rootScope.toggleSidenav('ptnClick')
                $rootScope.markerFocus(dev.location.coordinates)
                $rootScope.map_instance.setView(dev.location.coordinates);
                var temp = [dev.location.coordinates.lat, dev.location.coordinates.lng];
                var nodelist = []
                nodelist.push(temp)
                $rootScope.map_instance.fitBounds(nodelist)

                $scope.nodeSideNav(dev, dev.location.coordinates)
                $timeout(function () {
                    $rootScope.clearSearchLayer()
                }, 5000)
            })

        }

        $scope.showTransportRoute = function () {
            //console.log($scope.lineinfo.options.data)
            $rootScope.closeSidenav('lineClick');
            $rootScope.map_instance.removeControl($rootScope.modeTransfer)

            if ($scope.lineinfo.options.data.editStatus != 'TransView') {
                //$scope.lineinfo.setStyle({color: "red"})
                var editStatus = {routeID: $scope.lineinfo.options.data._id, editStatus: 'TransView'}
            }
            else {
                var editStatus = {routeID: $scope.lineinfo.options.data._id, editStatus: 'Editable'}
            }
            $http.post('/rest/routes/setroutestatus', editStatus).success(function (res) {
                //console.log(res)
                var condition = $rootScope.selectedTags.length > 0 ? {
                    key: 'tags',
                    type: ['IPX', 'FP', 'MUX', 'DEMUX'],
                    tags: $rootScope.selectedTags,
                } : null
                $rootScope.nodes_update(condition)

                nodelist = [];
                $scope.lineinfo.options.data.geo.forEach(function (d) {
                    nodelist.push(d)
                })
                $rootScope.map_instance.fitBounds(nodelist)
            })
        }

        $scope.schematicRoute = function () {
            $rootScope.closeSidenav('lineClick');
            $mdDialog.show({
                controller: routeDetailsMDCtrl,
                templateUrl: '/app/graphview/routedetails',
                parent: angular.element(document.body),
                //targetEvent: task.ev,
                clickOutsideToClose: false,
                locals: {
                    route: $scope.lineinfo.options.data,
                }
            })
        }

        $scope.deleteRoute = function () {
            var route = $scope.lineinfo.options.data
            $rootScope.closeSidenav('lineClick');
            var confirm = $mdDialog.confirm().title(route.routeInfo[0].nodeName + '-' + route.routeInfo[1].nodeName)
                .content(route.routeInfo[0].nodeName + '-' + route.routeInfo[1].nodeName + '<br/> ' + '<strong> Are you sure delete it and its connections? </strong>')
                .cancel('No').ok('Yes');

            $mdDialog.show(confirm).then(function () {
                $http.post('/rest/routes/deleteroute', data = route).success(function (response) {
                    $rootScope.notificationToast(response.message);
                    $rootScope.nodes_update();
                })
            }, function () {
                $mdDialog.cancel();
            })
                .finally(function () {
                    route = undefined;
                    confirm = undefined;
                    $rootScope.nodes_update();
                });
        };
        //
        pruneCluster.BuildLeafletMarker = function (marker, position) {
            //console.log(marker, position)
            var m = new L.Marker(position, {
                title: marker.data.deviceName + ' ' + marker.data.IPAddress,
                draggable: marker.data.lockStatus == 'locked' ? false : true
            });

            // var m = new L.Icon.MarkerCluster();
            this.PrepareLeafletMarker(m, marker.data, marker.category);
            return m;
        }

        pruneCluster.PrepareLeafletMarker = function (marker, node) {
            switch (node.status) {
                case 'Active':
                    icon_status = 'svg-marker';
                    break;
                case 'normal':
                    icon_status = 'svg-marker';
                    break;
                case 'Pending':
                    icon_status = 'svg-marker-pending';
                    break;
                case 'Concept':
                    icon_status = 'svg-marker-concept';
            }
            marker.setIcon(
                L.divIcon({
                    className: icon_status,
                    html: '<div></div>',//<div class="circle"> <a href=' + link + ' class="icons_graph"></a> </div>
                    iconSize: [48, 48],
                    iconAnchor: [0, 0]
                }));


            marker.off('click')
                .on('click', function (e) {
                    delete $rootScope.searchDevice
                    $rootScope.clearSearchLayer()
                    //console.log(e, node)
                    e.target.closePopup()
                    $scope.openSelectedNode(node)
                    //$rootScope.toggleSidenav('nodeClick');
                    //$scope.nodeSideNav(node, e.latlng)
                })
                .on('mouseover', function (e) {
                    //console.log(node)
                    $rootScope.map_instance.removeControl($rootScope.portSummary)

                    $http({
                            method: 'POST',
                            url: '/rest/devices/getdeviceselite',
                            data: {key: 'list', id_list: node.deviceList}
                        }
                    ).success(function (devices) {

                        var deviceDetailList = devices.filter(function (d) {
                            return d.properties.deviceType != 'PTN'
                        })

                        //hover route show details
                        // method that we will use to update the control based on feature properties passed
                        $rootScope.deviceSummary.update = function (props) {
                            this._div.innerHTML = '<div style="margin-top: 60px;" class="info">' +
                                '<h4>Device Summary:</h4><br />' +
                                '<table style="margin-top: -15px;font-size: 15px">' +
                                '<tr>' +
                                '<td>Number of Devices:</td>' +
                                '<td align="center" style="width: 150px;">' + deviceDetailList.length + '</td>' +
                                '</tr>' +
                                '<tr>' +
                                '<td>Location:</td>' +
                                '<td align="center" style="width: 150px">' +
                                node.location.address.street + ', ' + node.location.address.city + ', ' + node.location.address.province + '</td>' +
                                '</tr>' +
                                '</table>'

                        };

                        $rootScope.deviceSummary.addTo($rootScope.map_instance);
                    })
                })
                .on('mouseout', function (e) {
                    $rootScope.map_instance.removeControl($rootScope.deviceSummary)
                    $rootScope.map_instance.removeControl($rootScope.portSummary)
                })
                .on('dragend', function (e) {
                    $rootScope.map_instance.removeControl($rootScope.deviceSummary)
                    $rootScope.map_instance.removeControl($rootScope.portSummary)
                    $http.post('/rest/nodes/movenode', data = {
                        "coordinates": e.target._latlng,
                        "nodeID": node._id
                    }).success(function () {
                        $rootScope.notificationToast("Move node to new coordinates.")
                        $rootScope.closeSpiderfy();
                        $rootScope.nodes_update();
                    })
                });
            3
        };

        pruneCluster.BuildLeafletClusterIcon = function (cluster) {

            var e = new L.Icon.MarkerCluster();
            e.stats = cluster.stats;
            e.population = cluster.population;
            return e;
        };

        pruneCluster.spiderfier.Spiderfy = function (data) {
            //console.log(data)
            var _this = this;
            if (data.cluster !== this._cluster) {
                return;
            }
            this.Unspiderfy();
            var markers = data.markers.filter(function (marker) {
                return !marker.filtered;
            });

            //console.log(markers)

            this._currentCenter = data.center;
            var centerPoint = this._map.latLngToLayerPoint(data.center);
            var points;
            if (markers.length >= this._spiralCountTrigger) {
                points = this._generatePointsSpiral(markers.length, centerPoint);
            }
            else {
                if (this._multiLines) {
                    centerPoint.y += 10;
                }
                points = this._generatePointsCircle(markers.length, centerPoint);
            }
            var polylines = [];
            var leafletMarkers = [];
            var projectedPoints = [];
            for (var i = 0, l = points.length; i < l; ++i) {
                var pos = this._map.layerPointToLatLng(points[i]);
                var m = this._cluster.BuildLeafletMarker(markers[i], data.center);
                m.setZIndexOffset(5000);
                m.setOpacity(0);
                this._currentMarkers.push(m);
                this._map.addLayer(m);
                leafletMarkers.push(m);
                projectedPoints.push(pos);

                if ($rootScope.searchDevice != undefined && markers[i].data._id == $rootScope.searchDevice._id) {
                    $rootScope.markerFocus(pos)
                }

            }
            window.setTimeout(function () {
                for (i = 0, l = points.length; i < l; ++i) {
                    leafletMarkers[i].setLatLng(projectedPoints[i])
                        .setOpacity(1);
                }
                var startTime = +new Date();
                var interval = 42, duration = 290;
                var anim = window.setInterval(function () {
                    polylines = [];
                    var now = +new Date();
                    var d = now - startTime;
                    if (d >= duration) {
                        window.clearInterval(anim);
                        stepRatio = 1.0;
                    }
                    else {
                        var stepRatio = d / duration;
                    }
                    var center = data.center;
                    for (i = 0, l = points.length; i < l; ++i) {
                        // console.log(projectedPoints)
                        var p = projectedPoints[i], diffLat = p.lat - center.lat, diffLng = p.lng - center.lng;
                        polylines.push([center, new L.LatLng(center.lat + diffLat * stepRatio, center.lng + diffLng * stepRatio)]);
                    }
                    _this._lines.setLatLngs(polylines);
                }, interval);
            }, 1);
            //this._lines.setLatLngs(polylines);
            //this._map.addLayer(this._lines);
            if (data.marker) {
                this._clusterMarker = data.marker.setOpacity(0.8);
            }

            //open group detail right sidenav

            $rootScope.toggleSidenav('nodeGroupClick')
            // console.log(markers)
            $scope.nodesGroup = markers

            //
            // if ($rootScope.searchDevice != undefined) {
            //     $scope.searchedDevice = $scope.group.filter(function (d) {
            //         return d.data._id == $rootScope.searchDevice._id
            //     })[0]
            // }
            // var deviceList = []
            // $scope.group.forEach(function (d) {
            //     deviceList.push(d.data._id)
            // })
            //


        }

        L.Icon.MarkerCluster = L.Icon.extend({
            options: {
                iconSize: new L.Point(44, 44),
                className: 'prunecluster leaflet-markercluster-icon'
            },
            createIcon: function () {
                // based on L.Icon.Canvas from shramov/leaflet-plugins (BSD licence)
                var e = document.createElement('canvas');
                this._setIconStyles(e, 'icon');
                var s = this.options.iconSize;
                e.width = s.x;
                e.height = s.y;
                this.draw(e.getContext('2d'), s.x, s.y);
                return e;
            },
            createShadow: function () {
                return null;
            },
            draw: function (canvas, width, height) {
                var lol = 0;
                var start = 0;
                for (var i = 0, l = colors.length; i < l; ++i) {
                    var size = this.stats[i] / this.population;
                    if (size > 0) {
                        canvas.beginPath();
                        canvas.moveTo(22, 22);
                        canvas.fillStyle = colors[i];
                        var from = start + 0.14,
                            to = start + size * Math.PI * 2;
                        if (to < from) {
                            from = start;
                        }
                        canvas.arc(22, 22, 22, from, to);
                        start = start + size * Math.PI * 2;
                        canvas.lineTo(22, 22);
                        canvas.fill();
                        canvas.closePath();
                    }
                }
                canvas.beginPath();
                canvas.fillStyle = 'white';
                canvas.arc(22, 22, 18, 0, Math.PI * 2);
                canvas.fill();
                canvas.closePath();
                canvas.fillStyle = '#555';
                canvas.textAlign = 'center';
                canvas.textBaseline = 'middle';
                canvas.font = 'bold 12px sans-serif';
                canvas.fillText(this.population, 22, 22, 40);
            }
        });

        $rootScope.nodes_update = function (conditions) {
            $rootScope.map_instance.removeControl($rootScope.modeTransfer)
            var params = conditions ? conditions : {'key': 'all', "type": ["IPX", "FP", "MUX", "DEMUX"]}

            $http({
                method: 'POST',
                url: '/rest/nodes/getnodeselite',
                data: params
            }).success(
                function (nodes) {
                    //console.log(nodes)
                    pruneCluster.RemoveMarkers()

                    if (nodes != undefined && nodes.length > 0) {
                        nodes.forEach(function (d) {
                            if (Array.isArray(d.location.coordinates)) {
                                var cluster_marker = new PruneCluster.Marker(d.location.coordinates[0], d.location.coordinates[1], d, d.status == 'Active' ? 0 : (d.status == 'Concept' ? 1 : 2))
                            }
                            else {
                                var cluster_marker = new PruneCluster.Marker(d.location.coordinates.lat, d.location.coordinates.lng, d, d.status == 'Active' ? 0 : (d.status == 'Concept' ? 1 : 2))
                            }
                            pruneCluster.RegisterMarker(cluster_marker)
                        })
                        //console.log("Ports: "+socketParametersAllNode.length)
                        pruneCluster.addTo($rootScope.map_instance)
                    }
                    pruneCluster.ProcessView()
                }
            )

            $http({
                method: 'POST',
                url: '/rest/routes/getrouteselite',
                data: params
            })
                .success(function (routes) {
                    $rootScope.map_instance.almostOver.removeLayer(group_logic_layer)
                    $rootScope.map_instance.almostOver.removeLayer(group_trans_layer)
                    $rootScope.map_instance.removeLayer(group_logic_layer)
                    $rootScope.map_instance.removeLayer(group_trans_layer)
                    group_logic_layer.clearLayers()
                    group_trans_layer.clearLayers()

                    if (routes != 'undefined' && routes.length > 0) {
                        routes.forEach(function (d) {
                                var lineOptions = {
                                    data: d,
                                    color: '#0000b3',
                                    weight: 2,
                                    dashArray: "solid",
                                    opacity: 0.6,
                                    smoothFactor: 1
                                }

                                if (d.portStatus.active == 0) {
                                    // lineOptions.dashArray = "10,6";
                                    lineOptions.dashArray = "solid";
                                    lineOptions.color = "#0000b3";
                                    lineOptions.dashArray = "5,5"
                                } else if (d.portStatus.active != 0 && d.portStatus.pending != 0) {
                                    lineOptions.dashArray = "50,10,5,5,5,5,5,5,5,5,5,10";
                                }

                                // if (d.status == 'Pending') {
                                //     // lineOptions.dashArray = "10,6";
                                //     lineOptions.dashArray = "solid";
                                //     lineOptions.color = "#ff8000"
                                // }

                                var line_logic = {}
                                var line_trans = {}

                                if (d.editStatus == 'TransView' || d.editStatus == 'Editing') {
                                    $rootScope.modeTransfer.onAdd = function () {
                                        var container = L.DomUtil.create('input', 'leaflet-bar leaflet-control leaflet-control-custom');
                                        //container.innerHTML = '<p style="margin-top: 0px;">Button</p>'
                                        container.type = 'button'
                                        container.value = 'Click here back to logical layer'
                                        container.style.color = 'black'
                                        container.style.backgroundColor = 'white';
                                        container.style.backgroundSize = "300px 30px";
                                        container.style.width = '200px';
                                        container.style.height = '30px';

                                        container.onmouseover = function () {
                                            container.style.backgroundColor = '#d9d9d9';
                                        }
                                        container.onmouseout = function () {
                                            container.style.backgroundColor = 'white';
                                        }

                                        container.onclick = function () {
                                            var editStatus = {editStatus: 'Init'}
                                            $http.post('/rest/routes/setroutestatus', editStatus).success(function (res) {
                                                //console.log(res)

                                                var condition = $rootScope.selectedTags.length > 0 ? {
                                                    key: 'tags',
                                                    type: ['IPX', 'FP', 'MUX', 'DEMUX'],
                                                    tags: $rootScope.selectedTags,
                                                } : null
                                                $timeout(function () {
                                                    $rootScope.nodes_update(condition)
                                                }, 1000)

                                            })
                                        }
                                        return container;
                                    };

                                    $rootScope.modeTransfer.addTo($rootScope.map_instance);

                                    lineOptions.color = d.editStatus == 'Editing' ? 'red' : lineOptions.color
                                    line_trans = new L.polyline(d.geo, lineOptions)

                                    $http({
                                        method: 'POST',
                                        url: '/rest/routes/getrouteselite',
                                        data: {'key': d._id}
                                    })
                                        .success(function (res) {
                                            d = res
                                            line_trans.options.data = res
                                            if (Object.keys(line_trans).length > 0) {
                                                group_trans_layer.addLayer(line_trans)
                                            }

                                            $rootScope.map_instance.almostOver.removeLayer(group_trans_layer)
                                            d.geo.forEach(function (latlng) {
                                                d.nodeInfo.forEach(function (node, i) {
                                                    if (L.latLng(latlng).equals(L.latLng(node.location.coordinates))) {

                                                        var point_geo = new L.circleMarker(latlng, {
                                                            color: 'blue',
                                                            weight: 1,
                                                            radius: 6
                                                        })
                                                        group_trans_layer.addLayer(point_geo)
                                                    }
                                                })
                                            })

                                            group_trans_layer.addTo($rootScope.map_instance)
                                            group_trans_layer.eachLayer(function (line) {
                                                if (line.options.data != undefined && line.options.data.editStatus == 'Editing') {
                                                    line.enableEdit()
                                                }
                                            })
                                            //console.log($rootScope.map_instance.almostOver)
                                            $rootScope.map_instance.almostOver.addLayer(group_trans_layer);

                                        })
                                }
                                else {
                                    line_logic = new L.polyline([d.geo[0], d.geo[d.geo.length - 1]], lineOptions)
                                    if (Object.keys(line_logic).length > 0) {
                                        group_logic_layer.addLayer(line_logic)
                                    }
                                }
                            }
                        )
                    }

                    group_logic_layer.addTo($rootScope.map_instance)

                    $rootScope.map_instance.almostOver.addLayer(group_logic_layer);

                    var pointLatlng = {}
                    var click_count = 0
                    $rootScope.map_instance
                        .on('almost:over', function (e) {
                            $rootScope.map_instance.removeControl($rootScope.deviceSummary)

                            var dist = L.GeometryUtil.accumulatedLengths(L.polyline(e.layer.options.data.geo))
                            e.layer.options.data.distance = (dist[dist.length - 1] / 1000).toFixed(0) + ' km'
                            // if (e.layer.options.data.editStatus != 'Editing') {
                            //     e.layer.setText('')
                            e.layer.setStyle({weight: 4});
                            //     e.layer.setText('       ' + e.layer.options.data.distance, {offset: -10, center: true})
                            // }
                            //hover route show details
                            // method that we will use to update the control based on feature properties passed
                            $rootScope.portSummary.update = function (props) {
                                this._div.innerHTML = '<div style="margin-top: 60px;" class="info">' +
                                    '<h4>Route Summary:</h4><br />' +
                                    '<table style="margin-top: -15px;font-size: 15px">' +
                                    '<tr style="color: #009933">' +
                                    '<td>Active routes:</td>' +
                                    '<td align="center" style="width: 150px;">' + e.layer.options.data.portStatus.active + '</td>' +
                                    '</tr>' +
                                    '<tr style="color: #ff8000;">' +
                                    '<td>Pending routes:</td>' +
                                    '<td align="center" style="width: 150px">' + e.layer.options.data.portStatus.pending + '</td>' +
                                    '</tr>' +
                                    '<tr>' +
                                    '<td>Distance:</td>' +
                                    '<td align="center" style="width: 150px">' + e.layer.options.data.distance + '</td>' +
                                    '</tr>' +
                                    '</table>'

                            };

                            $rootScope.portSummary.addTo($rootScope.map_instance);

                        })
                        .on('almost:out', function (e) {
                            e.layer.setStyle({weight: 2});
                            e.layer.setText('')
                            $rootScope.map_instance.removeControl($rootScope.deviceSummary)
                            $rootScope.map_instance.removeControl($rootScope.portSummary)

                        })
                        .off('almost:notclose')
                        .on('almost:notclose', function (e) {
                            var condition = $rootScope.selectedTags.length > 0 ? {
                                key: 'tags',
                                type: ['IPX', 'FP', 'MUX', 'DEMUX'],
                                tags: $rootScope.selectedTags,
                            } : null
                            // $scope.socket.disconnect()
                            $rootScope.nodes_update(condition)
                            $rootScope.clearSearchLayer()
                            $rootScope.map_instance.removeControl($rootScope.modeTransfer)
                            $rootScope.map_instance.removeControl($rootScope.deviceSummary)
                            $rootScope.map_instance.removeControl($rootScope.portSummary)
                            //$rootScope.clearGroupLayer()
                            //delete $rootScope.searchDevice

                        })
                        .off('almost:click')
                        .on("almost:click", function (e) {
                                delete $rootScope.searchDevice

                                $rootScope.clearSearchLayer()
                                $rootScope.map_instance.removeControl($rootScope.deviceSummary)
                                $rootScope.map_instance.removeControl($rootScope.portSummary)
                                if (e.layer.options.data) {
                                    $http({
                                        method: 'POST',
                                        url: '/rest/routes/getrouteselite',
                                        data: {'key': e.layer.options.data._id}
                                    })
                                        .success(function (route) {
                                                //console.log(route)

                                                if (route.geo[0].lng > route.geo[route.geo.length - 1].lng) {
                                                    route.geo = route.geo.reverse()
                                                }

                                                var dist = L.GeometryUtil.accumulatedLengths(L.polyline(route.geo))
                                                route.distance = (dist[dist.length - 1] / 1000).toFixed(0) + ' km'

                                                var dist_tmp = 0
                                                route.geo.forEach(function (latlng, index) {
                                                    route.nodeInfo.forEach(function (node) {
                                                        if (L.latLng(latlng).equals(L.latLng(node.location.coordinates))) {
                                                            node.distance = ((dist[index] - dist_tmp) / 1000).toFixed(0) + ' km'
                                                            dist_tmp = dist[index]
                                                        }
                                                    })
                                                })

                                                Object.keys(route.configList).forEach(function (configName) {
                                                    route.configList[configName].forEach(function (r) {
                                                        r.forEach(function (dev) {
                                                            var nodeInfo_index = route.nodeList.indexOf(dev.device.location.nodeID)
                                                            if (nodeInfo_index > -1) {
                                                                dev.distance = route.nodeInfo[nodeInfo_index].distance
                                                            }

                                                        })
                                                    })
                                                })

                                                e.layer.options.data = route
                                                $scope.lineinfo = e.layer

                                                //console.log($scope.lineinfo.options.data.configList)
                                                $scope.routeStatusActive = e.layer.options.data.portStatus.active
                                                $scope.routeStatusPending = e.layer.options.data.portStatus.pending

                                                $rootScope.toggleSidenav('lineClick');
                                                $scope.routeInfo = route.routeInfo
                                                //console.log($scope.lineinfo.options.data.configList)
                                                $scope.routeNum = 0
                                                for (r in route.configList) {
                                                    $scope.routeNum += route.configList[r].length
                                                }
                                                //console.log(e.layer.options.data.configList);
                                                //len = Object.keys(e.layer.options.data.config).length;

                                                var parameters = [];
                                                for (key in e.layer.options.data.configList) {
                                                    e.layer.options.data.configList[key].forEach(function (d) {
                                                        // d[0].upload = 'Loading'
                                                        // d[0].download = 'Loading'
                                                        // d[d.length - 1].upload = 'Loading'
                                                        // d[d.length - 1].download = 'Loading'
                                                        var temp1 = {
                                                            'selectedID': d[0].deviceID,
                                                            'selectedPort': d[0].portID,
                                                            'selectedDeviceIP': d[0].device.IPAddress,
                                                            'username': $scope.current_user.username,
                                                            'deviceData': d[0]
                                                        }
                                                        if (d[0].device.IPAddress != 'TBD')
                                                            parameters.push(temp1)

                                                        var temp2 = {
                                                            'selectedID': d[d.length - 1].deviceID,
                                                            'selectedPort': d[d.length - 1].portID,
                                                            'selectedDeviceIP': d[d.length - 1].device.IPAddress,
                                                            'username': $scope.current_user.username,
                                                            'deviceData': d[d.length - 1]
                                                        }
                                                        if (d[d.length - 1].device.IPAddress != 'TBD')
                                                            parameters.push(temp2)
                                                    })


                                                    // e.layer.options.data.configList[key][0][0].upload = 'loading'
                                                    // e.layer.options.data.configList[key][0][0].download = 'loading'
                                                    // e.layer.options.data.configList[key][0][e.layer.options.data.configList[key][0].length - 1].upload = 'loading'
                                                    // e.layer.options.data.configList[key][0][e.layer.options.data.configList[key][0].length - 1].download = 'loading'
                                                    // temp1 = {
                                                    //     'selectedID': e.layer.options.data.configList[key][0][0].deviceID,
                                                    //     'selectedPort': e.layer.options.data.configList[key][0][0].portID,
                                                    //     'selectedDeviceIP': e.layer.options.data.configList[key][0][0].device.IPAddress,
                                                    //     'username': $scope.current_user.username,
                                                    //     'deviceData': e.layer.options.data.configList[key][0][0]
                                                    // }
                                                    // if (e.layer.options.data.configList[key][0][0].device.IPAddress != 'TBD')
                                                    //     parameters.push(temp1)
                                                    //
                                                    // temp2 = {
                                                    //     'selectedID': e.layer.options.data.configList[key][0][e.layer.options.data.configList[key][0].length - 1].deviceID,
                                                    //     'selectedPort': e.layer.options.data.configList[key][0][e.layer.options.data.configList[key][0].length - 1].portID,
                                                    //     'selectedDeviceIP': e.layer.options.data.configList[key][0][e.layer.options.data.configList[key][0].length - 1].device.IPAddress,
                                                    //     'username': $scope.current_user.username,
                                                    //     'deviceData': e.layer.options.data.configList[key][0][e.layer.options.data.configList[key][0].length - 1]
                                                    // }
                                                    // if (e.layer.options.data.configList[key][0][e.layer.options.data.configList[key][0].length - 1].device.IPAddress != 'TBD')
                                                    //     parameters.push(temp2)
                                                }
                                                //console.log(parameters)

                                                $rootScope.get_ready(parameters, 0, 'lineClick')

                                                //group function
                                                $scope.shownGroupRoute = null;
                                                $scope.toggleGroupRoute = function (group) {
                                                    if ($scope.isGroupShownRoute(group)) {
                                                        $scope.shownGroupRoute = null;
                                                        //$scope.showInfo = false;
                                                    } else {
                                                        $scope.shownGroupRoute = group;
                                                        //$scope.showInfo = true;
                                                    }
                                                };
                                                $scope.isGroupShownRoute = function (group) {
                                                    return $scope.shownGroupRoute === group;
                                                };
                                                //end

                                                $rootScope.ptnNode = {
                                                    'routeID': e.layer.options.data._id,
                                                    'latlng': {lat: e.latlng.lat, lng: e.latlng.lng}
                                                };

                                                if (e.layer.options.data.editStatus == 'TransView') {
                                                    var originalNode = e.layer.options.data.nodeInfo.filter(function (p) {
                                                        if ($rootScope.map_instance._zoom <= 8)
                                                            var dis = 0.01
                                                        else if ($rootScope.map_instance._zoom > 8 && $rootScope.map_instance._zoom <= 11)
                                                            var dis = 0.001
                                                        else if ($rootScope.map_instance._zoom > 11) {
                                                            var dis = 0.0001
                                                        }
                                                        return (p.location.coordinates.lat >= e.latlng.lat - dis && p.location.coordinates.lat <= e.latlng.lat + dis) && (p.location.coordinates.lng >= e.latlng.lng - dis && p.location.coordinates.lng <= e.latlng.lng + dis)

                                                        // return L.latLng(p.location.coordinates).equals(L.latLng({
                                                        //     lat: e.latlng.lat,
                                                        //     lng: e.latlng.lng
                                                        // }))
                                                    })
                                                    if (originalNode.length != 0) {
                                                        dev = []
                                                        dev._id = originalNode[0].deviceList[0]
                                                        $scope.nodeSideNav(dev)
                                                        $rootScope.closeSidenav('lineClick')
                                                        $rootScope.openSidenav('ptnClick')
                                                        //$rootScope.openSidenav('editPtn',originalNode[0].deviceList[0])
                                                    }
                                                }


                                            }
                                        )
                                }
                            }
                        ).off('editable:vertex:rawclick')
                        .on('editable:vertex:rawclick', function (e) {
                            click_count += 1
                            $rootScope.map_instance.doubleClickZoom.disable()
                            $timeout(function () {
                                if (click_count == 1) {
                                    // console.log('clicked 1',click_count)
                                    $rootScope.ptnNode = {
                                        'routeID': e.layer.options.data._id,
                                        'latlng': {lat: e.vertex.latlng.lat, lng: e.vertex.latlng.lng}
                                    };

                                    var originalNode = e.layer.options.data.nodeInfo.filter(function (p) {
                                        return L.latLng(p.location.coordinates).equals(L.latLng({
                                            lat: e.vertex.latlng.lat,
                                            lng: e.vertex.latlng.lng
                                        }))
                                    })
                                    if (originalNode.length == 0) {
                                        $rootScope.openSidenav('addPtn')
                                    }
                                    else {
                                        dev = []
                                        dev._id = originalNode[0].deviceList[0]
                                        $scope.nodeSideNav(dev)
                                        $rootScope.openSidenav('ptnClick')
                                        //$rootScope.openSidenav('editPtn',originalNode[0].deviceList[0])
                                    }

                                }
                                else if (click_count == 2) {
                                    var originalNode = e.layer.options.data.nodeInfo.filter(function (p) {
                                        return L.latLng(p.location.coordinates).equals(L.latLng({
                                            lat: e.vertex.latlng.lat,
                                            lng: e.vertex.latlng.lng
                                        }))
                                    })

                                    if (originalNode.length == 0) {
                                        e.vertex.delete()
                                    }
                                    else {
                                        $rootScope.notificationToast("PTN node can not be moved.")
                                    }
                                }
                                click_count = 0
                                $rootScope.map_instance.doubleClickZoom.enable()
                            }, 300)

                        })

                        .off('editable:vertex:dragstart')
                        .on('editable:vertex:dragstart', function (e) {
                            $rootScope.map_instance.removeControl($rootScope.deviceSummary)
                            $rootScope.map_instance.removeControl($rootScope.portSummary)
                            pointLatlng = {lat: e.vertex.latlng.lat, lng: e.vertex.latlng.lng}

                        }).off('editable:vertex:dragend editable:vertex:deleted')
                        .on('editable:vertex:dragend editable:vertex:deleted', function (e) {
                            $rootScope.map_instance.removeControl($rootScope.deviceSummary)
                            $rootScope.map_instance.removeControl($rootScope.portSummary)
                            var originalNode = e.layer.options.data.nodeInfo.filter(function (p) {
                                return L.latLng(p.location.coordinates).equals(L.latLng(pointLatlng))
                            })
                            var geo = []
                            e.layer._latlngs.forEach(function (l) {
                                geo.push({lat: l.lat, lng: l.lng})
                            })

                            if (originalNode.length > 0) {
                                $http.post('/rest/nodes/movenode', data = {
                                    "coordinates": {lat: e.vertex.latlng.lat, lng: e.vertex.latlng.lng},
                                    "nodeID": originalNode[0]._id
                                }).success(function () {
                                    $rootScope.nodes_update()
                                })
                            }

                            $http.post('/rest/routes/setroutes', {
                                routeID: e.layer.options.data._id,
                                geo: geo
                            }).success(function (res) {
                                $rootScope.notificationToast("Move node to new coordinates.")
                                $rootScope.nodes_update()
                            })
                            //console.log(e.layer.options.data)
                        })
                });
        };

        function deviceDetailsMDCtrl($scope, $timeout, node) {

            $timeout(function () {
                //  console.log(node)
                $scope.title_graphview = node.deviceName + '@' + node.IPAddress
                var devices = {}
                var edges = {}
                devices[node._id] = {
                    status: node.status,
                    name: node.deviceName + '@' + node.IPAddress,
                    consumers: node.properties.properties.portsCount,
                    count: node.location.address.streetNo + ' ' + node.location.address.street + ', ' + node.location.address.city + ', ' + node.location.address.province
                }
                node.ports.forEach(function (d) {
                    if (d.status != 'Init') {
                        devices[d.route.deviceID] = {
                            status: d.route.device.status,
                            name: d.route.device.deviceName + '@' + d.route.device.IPAddress,
                            consumers: 'P' + d.route.portID + ',' + d.route.portSpeed,
                            count: d.route.device.location.address.streetNo + ' ' + d.route.device.location.address.street + ', ' + d.route.device.location.address.city + ', ' + d.route.device.location.address.province
                        }
                        //console.log(d)
                        edges[node._id + d.portID] = {
                            inputDev: node._id,
                            outputDev: d.route.deviceID,
                            inputQueue: node._id + d.portID,
                            outputQueue: d.route.deviceID + d.route.portID,
                            inputThroughput: d.portSpeed,
                            outputThroughput: d.route.portSpeed,
                            inputPort: d.portID,
                            outputPort: d.route.portID,
                            status: d.status
                        }
                    }

                })

                var svg = d3.select('.nodedetail'),
                    inner = svg.select("g"),
                    zoom = d3.behavior.zoom().on("zoom", function () {
                        inner.attr("transform", "translate(" + d3.event.translate + ")" +
                            "scale(" + d3.event.scale + ")");
                    });

                svg.call(zoom);

                var render = new dagreD3.render();

                // Left-to-right layout
                var g = new dagreD3.graphlib.Graph();
                g.setGraph({
                    nodesep: 70,
                    ranksep: 150,
                    rankdir: "LR",
                    marginx: 60,
                    marginy: 60
                });
                function draw(isUpdate) {
                    for (var id in devices) {

                        var worker = devices[id];
                        //console.log(worker ,id)
                        var className = (worker.status == 'Active' || worker.status == 'Normal' ) ? "running" : "stopped";
                        // if (worker.count > 10000) {
                        // className += " warn";
                        // }
                        var html = "<div>";
                        html += "<span class=status></span>";
                        html += "<span class=consumers>" + worker.consumers + "</span>";
                        html += "<span class=name>" + worker.name + "</span>";
                        html += "<span class=queue><span class=counter>" + worker.count + "</span></span>";
                        html += "</div>";
                        g.setNode(id, {
                            labelType: "html",
                            label: html,
                            rx: 5,
                            ry: 5,
                            padding: 0,
                            class: className
                        });
                    }
                    for (var id in edges) {
                        edge = edges[id]
                        g.setEdge(edge.inputDev, edge.inputQueue, {
                            label: edge.inputThroughput,
                            arrowhead: 'undirected',
                            width: 10
                        });

                        g.setNode(edge.inputQueue, {
                            shape: "circle",
                            style: "stroke: #333;fill: #fff;stroke-width: 0px;",
                            label: 'P' + edge.inputPort.toString()
                        })

                        g.setEdge(edge.inputQueue, edge.outputQueue, {
                            label: '',
                            arrowhead: 'undirected',
                            width: 40
                        });

                        g.setNode(edge.outputQueue, {
                            shape: "circle",
                            style: "stroke: #333;fill: #fff;stroke-width: 0px;",
                            label: 'P' + edge.outputPort.toString()
                        })

                        g.setEdge(edge.outputQueue, edge.outputDev, {
                            label: edge.outputThroughput,
                            arrowhead: 'undirected',
                            width: 10
                        });

                    }


                    inner.call(render, g);

                    // Zoom and scale to fit
                    var graphWidth = g.graph().width + 80;
                    var graphHeight = g.graph().height + 40;
                    var width = parseInt(svg.style("width").replace(/px/, ""));
                    var height = parseInt(svg.style("height").replace(/px/, ""));
                    var zoomScale = Math.min(width / graphWidth, height / graphHeight);
                    var translate = [(width / 2) - ((graphWidth * zoomScale) / 2), (height / 2) - ((graphHeight * zoomScale) / 2)];
                    zoom.translate(translate);
                    zoom.scale(zoomScale);
                    zoom.event(isUpdate ? svg.transition().duration(500) : d3.select("svg"));

                }

                draw();
            }, 300)


            $scope.cancel = function () {
                $mdDialog.cancel();
                //$rootScope.nodes_update()
            };


        };

        function nodeDetailsMDCtrl($scope, $timeout, group) {
            //console.log(group)
            $timeout(function () {
                //  console.log(node)
                //$scope.title_graphview = node.deviceName + '@' + node.IPAddress
                var devices = {}
                var edges = {}
                var devicesID = []
                var devicesIdAll = []
                group.forEach(function (node) {
                    devicesIdAll.push(node._id)
                })
                group.forEach(function (node, i) {
                    devicesID.push(node._id)
                    devices[node._id] = {
                        status: node.status,
                        name: node.deviceName + '@' + node.IPAddress,
                        consumers: node.properties.properties.portsCount,
                        count: node.location.address.streetNo + ' ' + node.location.address.street + ', ' + node.location.address.city + ', ' + node.location.address.province
                    }
                    node.ports.forEach(function (d) {
                        if (d.status != 'Init') {

                            if (i <= 0 && devicesIdAll.indexOf(d.route.deviceID) > 0) {
                                devices[d.route.deviceID] = {
                                    status: d.route.device.status,
                                    name: d.route.device.deviceName + '@' + d.route.device.IPAddress,
                                    consumers: 'P' + d.route.portID + ',' + d.route.portSpeed,
                                    count: d.route.device.location.address.streetNo + ' ' + d.route.device.location.address.street + ', ' + d.route.device.location.address.city + ', ' + d.route.device.location.address.province
                                }

                                edges[node._id + d.portID] = {
                                    inputDev: node._id,
                                    outputDev: d.route.deviceID,
                                    inputQueue: node._id + d.portID,
                                    outputQueue: d.route.deviceID + d.route.portID,
                                    inputThroughput: d.portSpeed,
                                    outputThroughput: d.route.portSpeed,
                                    inputPort: d.portID,
                                    outputPort: d.route.portID,
                                    status: d.status
                                }
                            }
                            else if (i > 0) {
                                if (devicesID.indexOf(d.route.deviceID) < 0) {
                                    if (devicesIdAll.indexOf(d.route.deviceID) > 0) {
                                        devices[d.route.deviceID] = {
                                            status: d.route.device.status,
                                            name: d.route.device.deviceName + '@' + d.route.device.IPAddress,
                                            consumers: 'P' + d.route.portID + ',' + d.route.portSpeed,
                                            count: d.route.device.location.address.streetNo + ' ' + d.route.device.location.address.street + ', ' + d.route.device.location.address.city + ', ' + d.route.device.location.address.province
                                        }

                                        edges[node._id + d.portID] = {
                                            inputDev: node._id,
                                            outputDev: d.route.deviceID,
                                            inputQueue: node._id + d.portID,
                                            outputQueue: d.route.deviceID + d.route.portID,
                                            inputThroughput: d.portSpeed,
                                            outputThroughput: d.route.portSpeed,
                                            inputPort: d.portID,
                                            outputPort: d.route.portID,
                                            status: d.status
                                        }
                                    }
                                }
                            }
                        }

                    })
                })
                var svg = d3.select('.groupdetail'),
                    inner = svg.select("g"),
                    zoom = d3.behavior.zoom().on("zoom", function () {
                        inner.attr("transform", "translate(" + d3.event.translate + ")" +
                            "scale(" + d3.event.scale + ")");
                    });

                svg.call(zoom);

                var render = new dagreD3.render();

                // Left-to-right layout
                var g = new dagreD3.graphlib.Graph();
                g.setGraph({
                    nodesep: 70,
                    ranksep: 150,
                    rankdir: "LR",
                    marginx: 60,
                    marginy: 60
                });

                function draw(isUpdate) {
                    for (var id in devices) {

                        var worker = devices[id];
                        //console.log(worker ,id)
                        var className = (worker.status == 'Active' || worker.status == 'Normal' ) ? "running" : "stopped";
                        // if (worker.count > 10000) {
                        // className += " warn";
                        // }
                        var html = "<div>";
                        html += "<span class=status></span>";
                        html += "<span class=consumers>" + worker.consumers + "</span>";
                        html += "<span class=name>" + worker.name + "</span>";
                        html += "<span class=queue><span class=counter>" + worker.count + "</span></span>";
                        html += "</div>";
                        g.setNode(id, {
                            labelType: "html",
                            label: html,
                            rx: 5,
                            ry: 5,
                            padding: 0,
                            class: className
                        });
                    }
                    for (var id in edges) {
                        edge = edges[id]
                        g.setEdge(edge.inputDev, edge.inputQueue, {
                            label: edge.inputThroughput,
                            arrowhead: 'undirected',
                            width: 10
                        });

                        // g.setNode(edge.inputQueue, {
                        //     shape: "circle",
                        //     style: "stroke: #333;fill: #fff;stroke-width: 1.5px;}",
                        //     label: ''
                        // })
                        //
                        // g.setEdge(edge.inputQueue, edge.outputQueue, {
                        //     label: '',
                        //     arrowhead: 'undirected',
                        //     width: 40
                        // });

                        g.setNode(edge.inputQueue, {
                            shape: "rect",
                            style: "stroke: #333;fill: #fff;stroke-width: 0px;",
                            label: 'P' + edge.inputPort.toString(),
                        })

                        g.setEdge(edge.inputQueue, edge.outputQueue, {
                            label: '',
                            arrowhead: 'undirected',
                            minlen: 1,
                        });

                        g.setNode(edge.outputQueue, {
                            shape: "rect",
                            style: "stroke: #333;fill: #fff;stroke-width: 0px;",
                            label: 'P' + edge.outputPort.toString(),
                        })


                        g.setEdge(edge.outputQueue, edge.outputDev, {
                            label: edge.outputThroughput,
                            arrowhead: 'undirected',
                            width: 10
                        });

                    }


                    inner.call(render, g);

                    // Zoom and scale to fit
                    var graphWidth = g.graph().width + 80;
                    var graphHeight = g.graph().height + 40;
                    var width = parseInt(svg.style("width").replace(/px/, ""));
                    var height = parseInt(svg.style("height").replace(/px/, ""));
                    var zoomScale = Math.min(width / graphWidth, height / graphHeight);
                    var translate = [(width / 2) - ((graphWidth * zoomScale) / 2), (height / 2) - ((graphHeight * zoomScale) / 2)];
                    zoom.translate(translate);
                    zoom.scale(zoomScale);
                    zoom.event(isUpdate ? svg.transition().duration(500) : d3.select("svg"));

                }

                draw();
            }, 300)

            $scope.cancel = function () {
                $mdDialog.cancel();
                //$rootScope.nodes_update()
            };


        };

        function routeDetailsMDCtrl($scope, $timeout, route) {

            $timeout(function () {
                    //  console.log(route)
                    $scope.title_graphview = route.routeInfo[0].nodeName + '-' + route.routeInfo[1].nodeName
                    var devices = {}
                    var edges = {}
                    Object.keys(route.config).forEach(function (rt) {
                        //console.log(rt)
                        provious_dev = rt[0]
                        route.config[rt].forEach(function (dev, i) {
                            //console.log(dev)
                            //console.log(i)
                            if (Object.keys(devices).indexOf(dev.device._id) < 0) {
                                if (i % 2 == 0) {
                                    dev.devid = dev.device._id + 'i'
                                }
                                else {
                                    dev.devid = dev.device._id + 'o'
                                }
                                devices[dev.devid] = {
                                    status: dev.device.status,
                                    name: dev.device.deviceName + '@' + dev.device.IPAddress,
                                    consumers: dev.device.properties.properties.portsCount,
                                    count: dev.device.location.address.streetNo + ' ' + dev.device.location.address.street + ', ' + dev.device.location.address.city + ', ' + dev.device.location.address.province
                                }
                            }

                            if (i >= 1) {
                                edges[dev.device._id + dev.portID] = {}

                                if (i % 2 == 0) {
                                    edges[dev.device._id + dev.portID].inputQueue = provious_dev.deviceID + 'o'
                                    edges[dev.device._id + dev.portID].outputQueue = dev.deviceID + 'i'
                                }
                                else {
                                    edges[dev.device._id + dev.portID].inputQueue = provious_dev.deviceID + 'i'
                                    edges[dev.device._id + dev.portID].outputQueue = dev.deviceID + 'o'
                                }
                                edges[dev.device._id + dev.portID].inputport = provious_dev.deviceID + provious_dev.portID
                                edges[dev.device._id + dev.portID].outputport = dev.deviceID + dev.portID
                                edges[dev.device._id + dev.portID].inputPortID = provious_dev.portID
                                edges[dev.device._id + dev.portID].outputPortID = dev.portID
                                edges[dev.device._id + dev.portID].inputThroughput = provious_dev.portSpeed
                                edges[dev.device._id + dev.portID].outputThroughput = dev.portSpeed
                                edges[dev.device._id + dev.portID].status = dev.status

                            }
                            provious_dev = dev
                        })
                    })


                    // Set up zoom support
                    var svg2 = d3.select('.routedetail'),
                        inner = svg2.select("g"),
                        zoom = d3.behavior.zoom().on("zoom", function () {
                            inner.attr("transform", "translate(" + d3.event.translate + ")" +
                                "scale(" + d3.event.scale + ")");
                        });

                    svg2.call(zoom);

                    var render = new dagreD3.render();

                    // Left-to-right layout
                    var g = new dagreD3.graphlib.Graph();
                    g.setGraph({
                        nodesep: 70,
                        ranksep: 150,
                        rankdir: "LR",
                        marginx: 60,
                        marginy: 60
                    });
                    function draw(isUpdate) {
                        for (var id in devices) {
                            //console.log(id)
                            var worker = devices[id];
                            //console.log(worker ,id)
                            var className = (worker.status == 'Active' || worker.status == 'Normal' ) ? "running" : "stopped";
                            // if (worker.count > 10000) {
                            // className += " warn";
                            // }
                            var html = "<div>";
                            html += "<span class=status></span>";
                            html += "<span class=consumers>" + worker.consumers + "</span>";
                            html += "<span class=name>" + worker.name + "</span>";
                            html += "<span class=queue><span class=counter>" + worker.count + "</span></span>";
                            html += "</div>";
                            g.setNode(id, {
                                labelType: "html",
                                label: html,
                                rx: 5,
                                ry: 5,
                                padding: 0,
                                class: className
                            });
                        }

                        function getRandomColor() {
                            var letters = '0123456789ABCDEF'.split('');
                            var color = '#';
                            for (var i = 0; i < 6; i++) {
                                color += letters[Math.floor(Math.random() * 16)];
                            }
                            return color;
                        }

                        for (var portid in edges) {
                            edge = edges[portid]
                            lineColor = getRandomColor();
                            //console.log(route)
                            g.setEdge(edge.inputQueue, edge.inputport, {
                                label: edge.inputThroughput,
                                minlen: 1,
                                arrowhead: 'undirected',
                                style: "fill:transparent; stroke:" + lineColor
                            });

                            g.setNode(edge.inputport, {
                                shape: "rect",
                                style: "stroke: #333;fill: #fff;stroke-width: 0px;",
                                label: 'P' + edge.inputPortID.toString()
                            })

                            for (k in route.configList) {
                                if (route.configList[k][0].length > 2) {
                                    g.setEdge(edge.inputport, route.configList[k][0][1].deviceID, {
                                        label: edge.status,
                                        arrowhead: 'undirected',
                                        minlen: 1,
                                        style: "fill:transparent; stroke:" + lineColor
                                    });

                                    for (var i = 1; i < route.configList[k][0].length - 1; i++) {
                                        g.setNode(route.configList[k][0][i].deviceID, {
                                            shape: "circle",
                                            width: 150,
                                            style: "stroke: #333;fill: #fff;stroke-width: 1.5px;}",
                                            labelType: "html",
                                            label: "<div style='color: blue;' align='center'>" + route.configList[k][0][i].device.deviceName + "</div>"
                                        })
                                        if (i == route.configList[k][0].length - 2) {
                                            g.setEdge(route.configList[k][0][i].deviceID, edge.outputport, {
                                                arrowhead: 'undirected',
                                                label: edge.status,
                                                minlen: 1,
                                                style: "fill:transparent; stroke:" + lineColor
                                            });
                                        } else {
                                            g.setEdge(route.configList[k][0][i].deviceID, route.configList[k][0][i + 1].deviceID, {
                                                label: edge.status,
                                                arrowhead: 'undirected',
                                                minlen: 1
                                            });
                                        }
                                    }
                                } else {
                                    g.setEdge(edge.inputport, edge.outputport, {
                                        arrowhead: 'undirected',
                                        label: edge.status,
                                        minlen: 2,
                                        style: "fill:transparent; stroke:" + lineColor
                                    });
                                }
                                //break
                            }
                            g.setNode(edge.outputport, {
                                shape: "circle",
                                style: "stroke: #333;fill: #fff;stroke-width: 0px;}",
                                label: 'P' + edge.outputPortID.toString()
                            })
                            g.setEdge(edge.outputport, edge.outputQueue, {
                                label: edge.outputThroughput,
                                arrowhead: 'undirected',
                                minlen: 1,
                                style: "fill:transparent; stroke:" + lineColor
                            });

                        }

                        inner.call(render, g);

                        // Zoom and scale to fit
                        var graphWidth = g.graph().width + 80;
                        var graphHeight = g.graph().height + 40;
                        var width = parseInt(svg2.style("width").replace(/px/, ""));
                        var height = parseInt(svg2.style("height").replace(/px/, ""));
                        var zoomScale = Math.min(width / graphWidth, height / graphHeight);
                        var translate = [(width / 2) - ((graphWidth * zoomScale) / 2), (height / 2) - ((graphHeight * zoomScale) / 2)];
                        zoom.translate(translate);
                        zoom.scale(zoomScale);
                        zoom.event(isUpdate ? svg.transition().duration(500) : d3.select("svg"));

                    }

                    draw();
                }, 300
            )

            $scope.cancel = function () {
                $mdDialog.cancel();
                //$rootScope.nodes_update()
            };

        };


    }])

    .controller('searchCtrl', ['$scope', '$timeout', '$rootScope', 'current_user', 'windowsize', '$http', '$q', '$mdToast', function ($scope, $timeout, $rootScope, current_user, windowsize, $http, $q, $mdToast) {

        current_user.getData().then(function () {
            $scope.current_user = {}
            $scope.current_user.permission = current_user.permission()
            $scope.current_user.settings = current_user.settings()
            // console.log('windowsize.width ', windowsize.width)
            angular.element(document.getElementById('seachbar')).css({
                width: (windowsize.width / 2).toFixed(0) + "px",
                height: '48px'
            })
            // angular.element(document.getElementById('seachbarchips')).css({width:(windowsize.width/2).toFixed(0)+"px",height: '48px'})
        })

        // $http({
        //         method: 'POST',
        //         url: '/rest/system/getsearchtext',
        //         data: {key: 'all'}
        //     }
        // )
        //     .success(function (res) {

        $scope.searchText = '';

        $scope.selectedGroups = []

        var search_device_layer = new L.featureGroup()
        $rootScope.clearSearchLayer = function () {
            $rootScope.map_instance.removeLayer(search_device_layer)
            search_device_layer.clearLayers()
        }

        $rootScope.markerFocus = function (coor) {
            // $rootScope.map_instance.removeLayer(search_device_layer)
            // search_device_layer.clearLayers()

            var marker_search_device = L.marker(coor)
            marker_search_device.setIcon(
                L.divIcon({
                    className: 'svg-marker-search',
                    html: '<div></div>',
                    iconSize: [48, 48],
                    iconAnchor: [24, 24]
                })
            )
            search_device_layer.addLayer(marker_search_device)
            search_device_layer.addTo($rootScope.map_instance)
            search_device_layer.bringToBack()
            $rootScope.map_instance.removeControl($rootScope.deviceSummary)
            $rootScope.map_instance.removeControl($rootScope.portSummary)

        }

        function getResultFromLocal(searchText) {
            var deffered = $q.defer();
            $http({
                    method: 'GET',
                url: '/rest/searching/search',
                    params: {query: searchText}
                }
            )
                .success(function (res) {
                    //console.log(res)
                    // if (res && res.length > 0) {
                    deffered.resolve(res);//fuse.search(searchText)
                    // }
                })

            return deffered.promise;
        }

        function getResultFromNominatim(searchText) {
            var deffered = $q.defer();
            var searchKey = text_list(searchText).join(" ");
            // console.log(search_cache ,searchKey)
            if (Object.keys(search_cache).indexOf(searchKey) > -1) {
                // console.log(search_cache)
                fuse.set(res.concat(search_cache[searchKey]));
                deffered.resolve(fuse.search(searchText));
            } else {
                $http.get('https://nominatim.openstreetmap.org/search.php?' +
                    "q=" + text_list(searchText).join("+") +
                    "&polygon=1" +
                    "&format=json" +
                    "&addressdetails=1" +
                    "&limit=100" +
                    "&accept-language=en" +
                    "&bounded=1" +
                    "&countrycodes=ca,us"
                ).success(function (res_address) {
                    var search_result = []//fuse.search(query)
                    //console.log(res_address)
                    res_address.forEach(function (addr) {
                        //console.log(addr)
                        if (addr.class == "place" && addr.importance <= 0.5) {
                            var address = addr.address.house_number + ' ' + addr.address.road + ' ' + addr.address.city + ' ' + addr.address.state + ' ' + addr.address.country;
                            search_result.push({
                                _id: addr.place_id,
                                category: "OpenAddresses",
                                dispAttr: addr.lat + ' ' + addr.lon,
                                dispKey: address,
                                dispName: addr.address.city,
                                full_text: address,
                                tags: ['open address']
                            })
                        }
                    })
                    search_cache[searchKey] = search_result;
                    fuse.set(res.concat(search_result));
                    deffered.resolve(fuse.search(searchText));
                })
            }
            return deffered.promise;
        }


        var query_text = ''

        $scope.querySearch = function querySearch(query) {
            var deffered = $q.defer();
            query_text = query
            var result = []
            $timeout(function () {
                if (query_text == query) {
                    result = getResultFromLocal(query)
                    deffered.resolve(result);
                }

            }, 300)
            return deffered.promise;
        }

        $scope.$watchCollection('selectedGroups', function (newVal, oldVal) {
            //  console.log(angular.element(document.getElementById('seachbarchips')).children()[0].children)

            $timeout(function () {
                var chip_list = angular.element(document.getElementById('seachbarchips')).children()[0].children
                var chips_width = 24

                for (i = 0; i < chip_list.length; i++) {
                    if (chip_list[i].nodeName == "MD-CHIP") {
                        chips_width += chip_list[i].clientWidth
                    }
                }

                if ((windowsize.width * 0.48 - chips_width) > 160) {
                    $scope.autocomplete_disable = false
                    var selecteditem_width = (windowsize.width * 0.48 - chips_width).toFixed(0)
                    angular.element(document.getElementById('seachbarautocomplete')).css({width: selecteditem_width + "px"})
                }
                else {
                    $scope.autocomplete_disable = true
                    angular.element(document.getElementById('seachbarautocomplete')).css({width: 20 + "px"})
                }
            }, 300)

            $rootScope.selectedTags = []
            if (newVal.length > 0) {
                //console.log(newVal)
                var selectedDevices = []
                var selectedAddresses = []
                newVal.forEach(function (item) {
                    if (item.category == 'Tags') {
                        $rootScope.selectedTags.push(item.dispName)
                    }
                    else if (item.category == 'IPX' || item.category == 'PTN' || item.category == 'FP' || item.category == 'MUX' || item.category == 'DEMUX') {
                        selectedDevices.push(item._id)
                    }
                    else if (item.category == 'Addresses' || item.category == 'OpenAddresses') {
                        selectedAddresses.push(item)
                    }
                })

                if ($rootScope.selectedTags.length > 0) {
                    //console.log(selectedTags)
                    $http({
                            method: 'POST',
                        url: '/rest/searching/getsearchtext',
                            data: {key: 'tags', tags: $rootScope.selectedTags}
                        }
                    ).success(function (res) {
                        //console.log(res)
                        //fuse.set(res)
                    })
                    $rootScope.clearSearchLayer()
                    $rootScope.nodes_update({
                        key: 'tags',
                        type: ['IPX', 'FP', 'MUX', 'DEMUX'],
                        tags: $rootScope.selectedTags
                    })
                }


                if (selectedDevices.length > 0) {
                    $http({
                            method: 'POST',
                            url: '/rest/devices/getdeviceselite',
                            data: {key: 'list', id_list: selectedDevices}
                        }
                    ).success(function (devices) {
                        //console.log(devices)
                        $rootScope.clearSearchLayer()
                        var coordsList = []
                        var nodePTN = []
                        var nodeFP = []
                        devices.forEach(function (dev) {
                            //console.log(dev)
                            if (dev.properties.deviceType == 'PTN') {
                                nodePTN.push(dev.location.nodeID)
                            }
                            $rootScope.clearSearchLayer();
                            $rootScope.markerFocus(dev.location.coordinates)
                            coordsList.push(dev.location.coordinates)
                        })
                        $http.post('/rest/routes/setroutestatus', {
                            nodeID: nodePTN,
                            editStatus: 'TransView'
                        }).success(function (res) {
                            var condition = $rootScope.selectedTags.length > 0 ? {
                                key: 'tags',
                                type: ['IPX', 'FP', 'MUX', 'DEMUX'],
                                tags: $rootScope.selectedTags,
                            } : null
                            $rootScope.nodes_update(condition)
                            $rootScope.map_instance.fitBounds(coordsList)
                        })
                    })
                }

                if (selectedAddresses.length > 0) {
                    console.log(selectedAddresses)
                    var addressList = []
                    $rootScope.clearSearchLayer();
                    selectedAddresses.forEach(function (d) {
                        if(d.category=="Addresses"){
                            addressList.push([d.data.location.coordinates.lat, d.data.location.coordinates.lng])
                            $rootScope.markerFocus({lat: d.data.location.coordinates.lat, lng: d.data.location.coordinates.lng})
                        }else {
                            addressList.push([d.data.housenumbers.lat, d.data.housenumbers.lng])
                            $rootScope.markerFocus({lat: d.data.housenumbers.lat, lng: d.data.housenumbers.lng})
                        }
                    })

                    if (selectedAddresses.length == 1 && selectedAddresses[0].category == 'OpenAddresses') {
                        var toast = $mdToast.simple()
                            .content("Add a Node to this address?")
                            .action('YES')
                            .highlightAction(false)
                            .hideDelay(0)
                            .position('bottom right');
                        $mdToast.show(toast).then(function (response) {
                            if (response == 'ok') {
                                $mdToast.cancel()
                                $rootScope.createNewNode(selectedAddresses[0])
                            }
                        });

                    } else {
                        $mdToast.cancel()
                    }
                    $rootScope.map_instance.fitBounds(addressList)
                }

                // function addDeviceFromOpenAddress(openAddress) {
                //     $http({
                //             method: 'GET',
                //             url: '/rest/system/search',
                //             params: {openAddressID: openAddress[0]._id}
                //         }
                //     )
                //         .success(function (res_address) {
                //             res_address.housenumber == undefined ? res_address.housenumber = openAddress[0].dispName.split(' ')[0] : res_address.housenumber
                //
                //             res_address.types.forEach(function (type) {
                //                 if (['secondary', 'street', 'tertiary', 'residential', 'unclassified', 'primary', 'motorway', 'trunk', 'service'].indexOf(type) > -1) {
                //                     res_address.street = res_address[type]
                //                 }
                //                 else if (['town', 'city', 'village', 'hamlet'].indexOf(type) > -1) {
                //                     res_address.city = res_address[type]
                //                 }
                //                 if (res_address.city == null) {
                //                     if (['region'].indexOf(type) > -1) {
                //                         res_address.city = res_address[type]
                //                     }
                //                 }
                //                 if (res_address.city == null) {
                //                     res_address.city = ''
                //                 }
                //             })
                //             //console.log(res_address)
                //             $rootScope.openSidenav('processdevice', 'fromOpenAddress', res_address)
                //
                //
                //         })
                //
                //
                // }

            }
            else if (newVal.length < oldVal.length) {
                $rootScope.clearSearchLayer();
                $mdToast.cancel();
                $rootScope.nodes_update()
                $rootScope.map_instance.setZoom()
                $rootScope.map_instance.setView(map.default().latlngs, map.default().zoom)
            }
            else if (oldVal.length > 0) {
                // console.log(newVal, oldVal)
                $mdToast.cancel()
                $http({
                        method: 'POST',
                    url: '/rest/searching/getsearchtext',
                        data: {key: 'all'}
                    }
                ).success(function (res) {
                    // console.log(res)
                    fuse.set(res)
                })
                $rootScope.nodes_update()
                map.get().then(function () {
                        $rootScope.map_instance.setZoom()
                        $rootScope.map_instance.setView(map.default().latlngs, map.default().zoom)
                    }
                )
            }
        })

        $rootScope.createNewNode = function (node) {
            // console.log(node)
            var newNode = {}
            newNode.location = {
                coordinates: {
                    lat: parseFloat(node.data.housenumbers.lat),
                    lng: parseFloat(node.data.housenumbers.lng)
                },
                address: {
                    streetNo: node.data.housenumbers.housenumber,
                    street: node.data.street,
                    city: node.data.city,
                    province: node.data.state,
                    country: 'Canada'
                }
            }
            $http.post("/rest/nodes/setnode", newNode).success(function (res) {
                //  console.log(res)
                $rootScope.nodes_update()
            })
        }
        // })
    }])

    .controller('processDeviceCtrl', ['$scope', '$mdDialog', "$rootScope", "$log", '$http', '$timeout', '$location', 'current_user', '$q', function ($scope, $mdDialog, $rootScope, $log, $http, $timeout, $location, current_user, $q) {

        var click_count = 0;

        $rootScope.processDevice = function (task) {
            $timeout(function () {
                if (click_count == 0) {
                    click_count++;
                    if (task.processName == 'addDevice') {
                        processDeviceMD(task)
                    }
                }
            }, 500)
            click_count = 0;
        };

        $rootScope.clearData = function (showDialog) {

            confirm = $mdDialog.confirm().title('Reset Workflow Settings!')
                .content('<strong> Are you sure to reset all settings? </strong>')
                .cancel('No').ok('Yes')

            if (showDialog == true) {
                $mdDialog.show(confirm).then(function () {
                    $http({
                        method: 'POST',
                        url: '/rest/workflow/clearworkflow',
                        params: {'username': $scope.current_user.username, 'processname': 'addDevice'}
                    }).then(
                        function (nodes) {
                            $rootScope.closeSidenav('processdevice')
                        }
                    );

                }, function () {
                    $mdDialog.cancel()
                }).finally(function () {
                    confirm = undefined;
                });
            }
            else {
                $http({
                    method: 'POST',
                    url: '/rest/workflow/clearworkflow',
                    params: {'username': $scope.current_user.username, 'processname': 'addDevice'}
                })

            }

        }

        var processDeviceMD = function (task) {
            $rootScope.workflowProgress = true
            var myDialog = $mdDialog.show({
                id: 'addDevice',
                controller: processDeviceMDCtrl,
                templateUrl: '/app/workflow/launchworkflow?process=' + task.taskKey,
                parent: angular.element(document.body),
                //targetEvent: task.ev,
                clickOutsideToClose: false,
                locals: {
                    task: task,
                    user_settings: $scope.current_user.settings,
                    user_name: $scope.current_user.username
                }
            })
                .then(function (result) {
                    return result;
                }, function () {
                    return false;
                });


        }

        function processDeviceMDCtrl($scope, $rootScope, $http, Upload, task, user_settings, user_name) {
            $scope.processDeviceNext = function (data, method) {
                //$rootScope.workflowProgress = true
                if (taskCheck(task, data)) {
                    //console.log(data)
                    task.data = data
                    $http.post('/rest/workflow/launchworkflow', task).success(function (res) {
                        if (task.taskID < 6 && res[task.taskID].data != undefined) {
                            if (res[task.taskID].method != undefined && res[task.taskID].method == 'fromOpenAddress') {
                                delete res[task.taskID].method
                            } else {
                                task.data = res[task.taskID].data
                            }
                            //task.data = res[task.taskID].data
                        }

                        $rootScope.tasks = res

                        if (task.endFlag || method == 'edit') {
                            //console.log('end', $scope.newDevice)

                            var newDevice = $scope.newDevice;
                            //console.log(newDevice)
                            newDevice.lockStatus = 'locked';

                            if ((newDevice.status == 'Pending' || newDevice.status == 'Concept') && (newDevice.IPAddress == undefined || newDevice.IPAddress == null || newDevice.IPAddress == ''))
                                newDevice.IPAddress = 'TBD';
                            if (newDevice.properties.rpatsNo == undefined || newDevice.properties.rpatsNo == '' || newDevice.properties.rpatsNo == null)
                                newDevice.properties.rpatsNo = 'No Record'


                            $scope.newDevice.filenames = $scope.newDevice.filenames.filter(function (d) {
                                //console.log(d,$scope.total_files)
                                return $scope.total_files.filter(function (obj) {
                                    return obj.name == d.filename
                                })[0]
                            })

                            if ($scope.newDevice.colocatedPtn == true) {
                                $http.post('/rest/devices/getdeviceconfig', data = {
                                    'key': 'Device',
                                    'type': ['IPX', 'FP', 'MUX', 'DEMUX']
                                }).then(function (res) {
                                    var newPtn = {}

                                    newPtn.deviceName = 'PTN-' + newDevice.deviceName
                                    //$rootScope.ptnNode.latlng
                                    newPtn.properties = res.data[0];
                                    newPtn.ports = res.data[0].ports
                                    delete newPtn.properties.ports


                                    newPtn.location = newDevice.location;
                                    //newPtn.location.coordinates = newDevice.location.coordinates;
                                    //$scope.newPtn.routeID = $rootScope.ptnNode.routeID;

                                    newPtn.status = 'Init';
                                    newPtn.lockStatus = 'locked';
                                    //var newPtn = $scope.newPtn;

                                    $http.post("/rest/devices/setdevice", newPtn).success(function (d) {
                                        $rootScope.nodes_update()
                                    })
                                })
                                delete $scope.newDevice.colocatedPtn
                            }
                            delete $scope.newDevice.method
                            delete $scope.newDevice.properties.ports
                            delete $scope.newDevice.properties.status

                            $scope.newDevice.ports.forEach(function (p) {
                                delete p.selected_device_to_connect
                                delete p.destination_device_type
                                delete p.autotags
                            })

                            // if ($scope.newDevice.properties.deviceType == 'FP') {
                            //     var tagList = []
                            //     $scope.newDevice.ports[0].properties.tags.forEach(function (t) {
                            //         if (t.tagName != 'Flight Pack') {
                            //             tagList.push(t)
                            //         }
                            //     })
                            //     $scope.newDevice.ports[0].properties.tags = tagList
                            // }

                            var addressCoordinates = [$scope.newDevice.location.coordinates.lat, $scope.newDevice.location.coordinates.lng]
                            var addressList = []
                            addressList.push(addressCoordinates)
                            $rootScope.map_instance.fitBounds(addressList)

                            if (input_files && input_files.length) {
                                Upload.upload({
                                    url: '/files',
                                    data: {files: input_files}
                                }).then(function (response) {
                                    response.data.forEach(function (d) {
                                        $scope.newDevice.filenames.push(d)
                                        //console.log($scope.newDevice.filenames)
                                        $http.post("/rest/devices/setdevice", newDevice).success(function (d) {
                                            //socket.emit('getDevices', {'param': 'immediately'});
                                            $rootScope.nodes_update();
                                            $rootScope.clearData(false);
                                            $mdDialog.cancel();
                                            $rootScope.notificationToast(d.message)
                                        })
                                    })
                                    $timeout(function () {
                                        $scope.result = response.data;
                                    });
                                }, function (response) {
                                    if (response.status > 0) {
                                        $scope.errorMsg = response.status + ': ' + response.data;
                                    }
                                }, function (evt) {
                                    $scope.progress =
                                        Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
                                });
                            }
                            else {
                                $http.post("/rest/devices/setdevice", newDevice).success(function (d) {
                                    // socket.emit('getDevices', {'param': 'immediately'});
                                    $rootScope.nodes_update();
                                    $rootScope.clearData(false);
                                    $mdDialog.cancel();
                                    $rootScope.notificationToast(d.message)
                                })
                            }


                            //$rootScope.clearData(false)
                            $rootScope.closeSidenav('processdevice')
                        }
                        else {
                            var nextTask = res.filter(function (d) {
                                return d.taskID == task.taskID + 1
                            })[0]
                            if (nextTask != undefined) {
                                nextTask.data = task.data
                                processDeviceMD(nextTask)
                            }
                        }
                    })
                }
            };
            $scope.processDeviceBack = function (data) {
                task.data = data
                //console.log(task)

                delete task.method
                $http.post('/rest/workflow/launchworkflow', task).success(function (res) {
                    $rootScope.tasks = res
                    var backTask = res.filter(function (d) {
                        return d.taskID == task.taskID - 1
                    })[0]
                    if (backTask != undefined) {
                        processDeviceMD(backTask)
                    }
                })
            };
            $scope.cancel = function () {
                $mdDialog.cancel();
                $rootScope.nodes_update()
            };

            var get_device = function (deviceID) {
                var dev = $rootScope.connectedDevices.filter(function (d) {
                    return d._id == deviceID
                })
                return dev.length > 0 ? dev[0] : undefined
            }
            $scope.title_dialog = task.taskName
            $scope.total_files = []
            if (task.data == undefined) {
                $scope.newDevice = {}
                $scope.newDevice.filenames = []
                $scope.newDevice.installedDate = new Date()
            }
            else {
                $scope.newDevice = task.data
                $scope.newDevice.installedDate = new Date($scope.newDevice.installedDate)
                var deviceOrigiName = task.data.deviceName
                if (task.method == 'edit')
                    $scope.newDevice.method = 'edit'
                if ($scope.newDevice.filenames == undefined) {
                    $scope.newDevice.filenames = []
                }
                else {
                    $scope.newDevice.filenames.forEach(function (d) {
                        $scope.total_files.unshift({name: d.filename, type: d.content_type})
                    })
                }
            }

            $scope.$watch(function () {
                    return angular.element(document).find('md-dialog').length > 0;
                },
                function (newValue, oldValue) {
                    //console.log(newValue)
                    if (newValue) {
                        $timeout(function () {
                            $rootScope.workflowProgress = false
                        }, 1000)

                    }
                    //console.log($rootScope.workflowProgress )
                });

            if (task.taskID == 1) {
                $scope.selectedIndex = 0;

                $http.post('/rest/devices/getdeviceconfig', data = {
                    'key': 'Device',
                    'type': ['IPX', 'FP', 'MUX', 'DEMUX']
                }).then(function (res) {
                    $scope.deviceTypes = res.data
                    if ($scope.newDevice.properties != undefined)
                        $scope.searchText = $scope.newDevice.properties.deviceGeneralName;
                    else
                        $scope.searchText = ''
                })


                var search_options_for_deviceType = {
                    keys: ['deviceGeneralName', 'deviceType', 'portsCount'],   // keys to search in
                    //id: 'deviceName'                     // return a list of identifiers only
                    threshold: 0.1
                }

                $scope.querySearch = function (query) {
                    //console.log(typeof(query))
                    var re = (query == undefined || query.length == 0) ? $scope.deviceTypes : new Fuse($scope.deviceTypes, search_options_for_deviceType).search(query)
                    var result = [];
                    if ($scope.newDevice.method == 'edit') {
                        re.forEach(function (d) {
                            if (d.deviceType != 'MUX' && d.deviceType != 'DEMUX') {
                                result.push(d)
                            }
                        })
                        return result
                    }
                    else {
                        return re
                    }
                }

                $scope.selectedItemChange = function (item) {
                    if ($scope.selectedItem != null) {
                        //console.log($scope.newDevice)
                        //console.log(item)
                        var temp = []
                        for (var i = 0; i < item.ports.length; i++) {
                            temp.push(item.ports[i].config.portSpeed)
                        }
                        if ($scope.newDevice.ports != undefined) {
                            len = temp.length > $scope.newDevice.ports.length ? $scope.newDevice.ports.length : temp.length

                            for (var i = 0; i < len; i++) {
                                item.ports[i] = $scope.newDevice.ports[i]
                                item.ports[i].config.portSpeed = temp[i]
                            }

                        }
                        $scope.newDevice.ports = item.ports
                        $scope.newDevice.properties = item

                        $scope.newDevice.ports.forEach(function (d) {
                            d.properties == undefined ? d.properties = {} : false
                            d.route == undefined ? d.route = {} : false
                            d.properties.tags == undefined ? d.properties.tags = [] : false
                            d.properties.portDescription == undefined ? d.properties.portDescription = '' : false
                            d.properties.installedDate == undefined ? d.properties.installedDate = new Date() : d.properties.installedDate = new Date(d.properties.installedDate)

                        })
                        //console.log($scope.newDevice.ports)
                        // delete $scope.newDevice.properties.ports
                        // delete $scope.newDevice.properties.status

                    }
                }
            }
            else if (task.taskID == 2) {
                //$rootScope.deviceOrigiName = deviceOrigiName
                $scope.newDevice.colocatedPtn = false;
                //console.log($scope.newDevice)
                $scope.cropper = {};
                $scope.cropper.sourceImage = null;
                $scope.cropper.croppedImage = null;
                $scope.bounds = {};

                $scope.showLogo = true;

                $scope.$watch(function () {
                    return $scope.cropper.croppedImage == null || $scope.cropper.croppedImage == undefined || $scope.cropper.croppedImage == ''
                }, function (newVal, oldVal) {
                    if (newVal == false) {
                        $scope.newDevice.properties.additionalInfo.logo = $scope.cropper.croppedImage;
                        $scope.showLogo = false;
                    }
                    else if (newVal == true) {
                        $scope.showLogo = true;
                    }
                })

                $scope.$watch(function () {
                    return $scope.cropper.croppedImage
                }, function (newVal, oldVal) {
                    if (newVal != oldVal) {
                        $scope.newDevice.properties.additionalInfo.logo = $scope.cropper.croppedImage;
                    }
                })


                if ($scope.newDevice.properties != undefined) {
                    $scope.cropper.croppedImage = $scope.newDevice.properties.additionalInfo.logo;
                }


                $scope.addLogo = function (method) {
                    if (method == 'create') {
                        $scope.cropper.sourceImage = null;
                        $scope.cropper.croppedImage = null;
                        $scope.showLogo = false;
                    }
                    else if (method == 'edit') {
                        // $scope.newDevice.properties.additionalInfo.logo = null;
                        //
                        // $scope.showLogo = false;
                    }
                    else {

                    }
                }
                //
                // $scope.deleteLogo = function () {
                //     $scope.newDevice.properties.additionalInfo.logo = null;
                //     $scope.cropper.sourceImage = null;
                //     $scope.cropper.croppedImage = null;
                // }


            }
            else if (task.taskID == 3) {
                //console.log($scope.newDevice)
                $scope.showVerify = false;
                $scope.verifyIP = function (device) {
                    console.log(device)
                    var ipformat = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
                    if (device.IPAddress == undefined) {
                        $scope.message = "Please enter IP address."
                    }
                    else if (!device.IPAddress.match(ipformat)) {
                        $scope.message = "Invalid IP Address."
                    }
                    else {

                        if (device.properties) {
                            $scope.ipVerified = false;
                            $scope.showVerify = true;
                            if (device.properties.deviceType == 'IPX') {
                                $http({
                                    method: "get",
                                    url: "/rest/general/veryfyip",
                                    params: {'ipAddress': device.IPAddress}
                                }).then(function (res) {
                                    $scope.showVerify = false;
                                    //console.log(res)
                                    //$scope.process = false;
                                    if (res.status == 200 && res.data.verifiedIPAddress != undefined && res.data.verifiedIPAddress != '' && res.data.verifiedIPAddress != null) {
                                        $scope.newDevice.config = res.data
                                        var featuresList = res.data.productName.split('+');
                                        $scope.newDevice.config.productName = featuresList[0]
                                        featuresList.shift();
                                        $scope.newDevice.config.features = []
                                        featuresList.forEach(function (d) {
                                            //console.log(d)
                                            switch (d) {
                                                case 'SRCP':
                                                    location
                                                    $scope.newDevice.config.features.push('Port-based Source Routing [+PF]')
                                                    break;
                                                case 'SRCD':
                                                    $scope.newDevice.config.features.push('Source Discovery [+SRC]')
                                                    break;
                                                case 'SRCBW':
                                                    $scope.newDevice.config.features.push('Source/Port Bandwidth Control [+BW]')
                                                    break;
                                                case 'L2SW':
                                                    $scope.newDevice.config.features.push('L2 Switch [+L2]')
                                                    break;
                                                case 'TRAP':
                                                    $scope.newDevice.config.features.push('SNMP Trap Monitoring [+MON]')
                                                    break;
                                                case 'PLB':
                                                    $scope.newDevice.config.features.push('Port Loopback [+PL]')
                                                    break;
                                                case 'SRCVLAN':
                                                    $scope.newDevice.config.features.push('VLAN-based Source Routing [+VF]')
                                                    break;
                                                case 'IGMP':
                                                    $scope.newDevice.config.features.push('IGMP [+IG1024]')
                                                    break;
                                                case 'PRCTRL':
                                                    $scope.newDevice.config.features.push('Routing Control on Out Port [+F1023]')
                                                    break;
                                            }
                                        })
                                        // console.log($scope.newDevice.config.features)
                                        //$scope.newDevice.config.features = featuresList;

                                        //$scope.ipInfo.productName = nameList[0];

                                        $scope.ipVerified = true//(res.data.verifiedIPAddress == ip);

                                        //console.log($scope.ipVerified)

                                        if ($scope.ipVerified) {
                                            $scope.message = "IP address " + device.IPAddress + " verified successfully."
                                        }
                                        else {
                                            $scope.message = "IP address " + device.IPAddress + " does not pass verification."
                                        }

                                        // $scope.newDevice.licenseSummary = nameList;
                                    }
                                    else {
                                        $scope.ipVerified = false
                                        $scope.message = "IP address " + device.IPAddress + " does not pass verification."
                                        //$scope.message = res.data.message
                                    }
                                })
                            }
                            else {
                                $http.post('/rest/devices/pingIPAddress', data = {
                                    'device': device
                                }).success(function (res) {
                                    // console.log(response)
                                    $scope.showVerify = false;
                                    // $scope.pingResult = response
                                    if (res == 1) {
                                        console.log('T')
                                        $scope.message = null
                                        $scope.ipVerified = true
                                        $scope.pingResult = true
                                    }
                                    else {
                                        $scope.ipVerified = false
                                        $scope.message = "IP address " + device.IPAddress + " does not pass verification."
                                    }
                                });
                            }
                        } else {
                            $scope.message = "Please select device type in device type page."
                        }

                    }
                }
            }
            else if (task.taskID == 4) {
                //console.log($scope.newDevice)
                //console.log(task)
                $scope.canSetAddress = true;
                if (task.canSetAddress != undefined) {
                    $scope.canSetAddress = task.canSetAddress
                }

                $scope.countries = ('Canada,USA,Germany,England,Italy')
                    .split(',').map(function (country) {
                        return {abbrev: country};
                    })

                $scope.provinceLable = {
                    'Canada': 'Province',
                    'USA': 'State',
                    'Germany': 'State',
                    'England': 'Region',
                    'Italy': 'Province'
                }

                $scope.provinces = {
                    Canada: ['Alberta', 'British Columbia', 'Manitoba', 'Ontario', 'Prince Edward Island', 'Quebec', 'New Brunswick', 'Newfoundland and Labrador', 'Northwest Territories', 'Nova Scotia', 'Nunavut', 'Saskatchewan', 'Yukon'],
                    USA: ['Alabama AL', 'Alaska AK', 'Arizona AZ', 'Arkansas AR', 'California CA', 'Colorado CO', 'Connecticut CT', 'Delaware DE', 'Florida FL', 'Georgia GA', 'Hawaii HI', 'Idaho ID', 'Illinois IL', 'Indiana IN', 'Iowa IA', 'Kansas KS', 'Kentucky KY', 'Louisiana LA', 'Maine ME', 'Maryland MD', 'Massachusetts MA', 'Michigan MI', 'Minnesota MN', 'Mississippi MS', 'Missouri MO', 'Montana MT', 'Nebraska NE', 'Nevada NV', 'New Hampshire NH', 'New Jersey NJ', 'New Mexico NM', 'New York NY', 'North Carolina NC', 'North Dakota ND', 'Ohio OH', 'Oklahoma OK', 'Oregon OR', 'Pennsylvania PA', 'Rhode Island RI', 'South Carolina SC', 'South Dakota SD', 'Tennessee TN', 'Texas TX', 'Utah UT', 'Vermont VT', 'Virginia VA', 'Washington WA', 'West Virginia WV', 'Wisconsin WI', 'Wyoming WY'],
                    Germany: ['Berlin', 'Saarland', 'Hamburg', 'Brandenburg'],
                    England: ['Oxfordshire'],
                    Italy: ['Florence', 'Genoa']
                }
                $scope.loadProvinces = function (country) {
                    $scope.selectedProvinces = $scope.provinces[country]
                }
                if ($scope.newDevice.location) {
                    if ($scope.newDevice.location.address.country == '') {
                        for (var key in $scope.provinces) {
                            var value = $scope.provinces[key];
                            if (value.indexOf($scope.newDevice.location.address.province) >= 0) {
                                $scope.newDevice.location.address.country = key
                                $scope.loadProvinces($scope.newDevice.location.address.country)
                            }
                        }
                    } else {
                        if ($scope.newDevice.address) {
                            $scope.loadProvinces($scope.newDevice.location.address.country)
                        } else if ($scope.newDevice.location) {
                            $scope.loadProvinces($scope.newDevice.location.address.country)
                        }
                    }
                    $scope.showLocationName = $scope.newDevice.location.address.streetNo + ' ' + $scope.newDevice.location.address.street + ', ' + $scope.newDevice.location.address.city + ', ' + $scope.newDevice.location.address.province + ', ' + $scope.newDevice.location.address.country

                }


                var search_options = {
                    keys: [{
                        name: 'full_text',
                        weight: 0.8
                    }, 'dispName', 'dispKey', 'category'],   // keys to search in
                    threshold: 0.02,
                    sortFn: function (a, b) {

                        if (a.item.category == "OpenAddresses") {

                            a.score -= a.item.mScore / 10
                        }
                        if (b.item.category == "OpenAddresses") {

                            b.score -= b.item.mScore / 10
                        }
                        return a.score - b.score
                    },
                    //shouldSort: true,
                    //include: ['score', 'matches' ],
                    tokenize: true
                    //id: 'deviceName'                     // return a list of identifiers only
                }
                var res = []
                var fuse = new Fuse(res, search_options)

                $scope.querySearch = function querySearch(query) {
                    return getResultFromLocal(query);
                }
                function getResultFromLocal(searchText) {
                    var deffered = $q.defer();
                    $http({
                            method: 'GET',
                        url: '/rest/searching/search',
                            params: {query: searchText}
                        }
                    )
                        .success(function (res) {
                            if (res && res.length > 0) {
                                var result = []
                                var IDList = []
                                res.forEach(function (r) {
                                    if (IDList.length == 0 && (r.category == 'OpenAddresses' || r.category == 'Addresses')) {
                                        IDList.push(r._id)
                                        result.push(r)
                                    }
                                    else {
                                        if ((r.category == 'OpenAddresses' || r.category == 'Addresses') && r._id.indexOf(IDList) < 0) {
                                            IDList.push(r._id)
                                            result.push(r)
                                        }
                                    }
                                })
                                deffered.resolve(result);//fuse.search(searchText)
                            }
                        })
                    return deffered.promise;
                }

                $scope.selectedItemChange = function (item) {
                    // addDeviceFromOpenAddress(item)
                    if (item.category == "Addresses") {
                        item['data']['housenumbers'] = {
                            "housenumber": item['data']['location']['address']['streetNo'],
                            "lat": item['data']['location']['coordinates']['lat'],
                            "lng": item['data']['location']['coordinates']['lng']
                        }

                        item['data']['state'] = item['data']['location']['address']['province']
                        item['data']['city'] = item['data']['location']['address']['city']
                        item['data']['street'] = item['data']['location']['address']['street']

                    }

                    $scope.newDevice.location = {
                        address: {
                            country: '',
                            province: item.data.state,
                            street: item.data.street,
                            streetNo: item.data.housenumbers.housenumber,
                            city: item.data.city
                        },
                        coordinates: {
                            lat: parseFloat(item.data.housenumbers.lat),
                            lng: parseFloat(item.data.housenumbers.lng)
                        }
                    }

                    if ($scope.newDevice.location) {
                        if ($scope.newDevice.location.address.country == '') {
                            for (var key in $scope.provinces) {
                                var value = $scope.provinces[key];
                                if (value.indexOf($scope.newDevice.location.address.province) >= 0) {
                                    $scope.newDevice.location.address.country = key
                                    $scope.loadProvinces($scope.newDevice.location.address.country)
                                }
                            }
                        } else {
                            if ($scope.newDevice.address) {
                                $scope.loadProvinces($scope.newDevice.location.address.country)
                            } else if ($scope.newDevice.location) {
                                $scope.loadProvinces($scope.newDevice.location.address.country)
                            }
                        }
                        var addressCoordinates = [$scope.newDevice.location.coordinates.lat, $scope.newDevice.location.coordinates.lng]
                        var addressList = []
                        addressList.push(addressCoordinates)
                        $rootScope.map_instance.fitBounds(addressList)
                    }
                }

            }
            else if (task.taskID == 5) {
                //console.log($scope.newDevice)
                $scope.fpDestinationIPAddress = undefined;
                $http.get('/rest/tags/gettags', {
                    params: {
                        params: 'all' //also the params could be 'all'
                    }
                }).success(function (res) {
                    res.forEach(function (d) {
                        delete d.keys
                    })
                    $scope.loadTags = res;

                    $scope.newDevice.ports.forEach(function (d) {
                        d.autotags = []
                        if (task.method == undefined) {
                            $scope.newDevice.ports[d.portID - 1].properties.tags = []
                        }

                        $scope.loadTags.forEach(function (t) {
                            if (t.deviceTypeList != undefined) {
                                t.deviceTypeList.forEach(function (type) {
                                    if (type == $scope.newDevice.properties.deviceGeneralName || type == d.route.destDeviceTypeName) {
                                        d.autotags.push(t.tagName)
                                        if (task.method == undefined) {
                                            $scope.newDevice.ports[d.portID - 1].properties.tags.push(t)
                                        }

                                    }
                                })
                            }
                        })
                        // if ($scope.newDevice.properties.deviceType == 'FP') {
                        //     $scope.newDevice.ports[d.portID - 1].properties.tags.unshift({"tagName": 'Flight Pack'})
                        // }
                        d.properties == undefined ? d.properties = {} : false
                        d.route == undefined ? d.route = {} : false
                        d.properties.tags == undefined ? d.properties.tags = [] : false
                        d.properties.portDescription == undefined ? d.properties.portDescription = '' : false
                        d.properties.installedDate == undefined ? d.properties.installedDate = new Date() : d.properties.installedDate = new Date(d.properties.installedDate)

                        // if (d.route.deviceID != undefined) {
                        //     connectedDevice.push(d.route.deviceID)
                        // }
                        if (d.status != 'Init') {
                            //console.log(d.config.portSpeed.indexOf(d.portSpeed) >= 0 )
                            if (d.config.portSpeed.indexOf(d.portSpeed) < 0) {
                                d.portSpeed = d.config.portSpeed[0]
                            }
                        }
                    })

                    //console.log($scope.loadTags)
                    //auto-complete for tags
                    $scope.querySearchTags = function (query, port) {
                        $scope.selectedTagsOnPort = []
                        for (lt in $scope.loadTags) {
                            var s = 0;
                            $scope.newDevice.ports[port.portID - 1].properties.tags.forEach(function (pt) {
                                if (pt.tagName == $scope.loadTags[lt].tagName) {
                                    s = 1;
                                }
                            })
                            if (s == 0) {
                                $scope.selectedTagsOnPort.push($scope.loadTags[lt])
                            }
                        }
                        return (query == undefined || query.length == 0) ? $scope.selectedTagsOnPort : new Fuse($scope.selectedTagsOnPort, search_options_for_tags).search(query)
                    }

                    $scope.deleteTags = function (tagname, port) {
                        var ind = port.autotags.indexOf(tagname)
                        if (ind > -1) {
                            $scope.message = 'Unable to removed default tag.'
                            $scope.loadTags.forEach(function (t) {
                                if (t.tagName == tagname) {
                                    $scope.newDevice.ports[port.portID - 1].properties.tags.splice(ind, 0, t)
                                }
                            })
                            //$scope.newDevice.ports[p.portID-1].properties.tags.push({"tagName": 'Flight Pack'})
                        }
                        $timeout(function () {
                            $scope.message = ''
                        }, 2000)
                    }

                    $scope.selectedItemChangeTags = function (item, port) {
                        if (item != undefined) {
                            console.log(item)
                            delete item.tagFilter
                            delete item.tagCreateDate
                            delete item.tagDescription
                            delete item.tagType
                            delete item.taggedNum

                            $scope.newDevice.ports[port.portID - 1].properties.tags.push(item)
                        }
                        $scope.searchTextTags = null
                        $scope.selectedTagsOnPort = null
                    }

                    // $scope.querySearchTags = function (query) {
                    //     return (query == undefined || query.length == 0) ? $scope.loadTags : new Fuse($scope.loadTags, search_options_for_tags).search(query)
                    // }

                    var search_options_for_tags = {
                        keys: ['tagName'],   // keys to search in
                        threshold: 0.1,
                        shouldSort: true
                        //id: 'deviceName'                     // return a list of identifiers only
                    }
                    // end auto-complete for tags

                })

                //initialize each ports
                $scope.selectedItemDevice = {}
                if ($scope.newDevice.ports) {
                    //connectedDevice = []
                    $http({
                        method: "POST",
                        url: "/rest/devices/getdeviceselite",
                        data: {'key': 'all', 'type': ['IPX', 'FP', 'MUX', 'DEMUX']}
                    }).then(function (res) {
                        $rootScope.connectedDevices = res.data
                        //console.log($rootScope.connectedDevices)

                        //watch md-tabs: when switch tabs, the socket will be disconnected
                        $scope.$watch('selectedPort', function (newValue, oldValue) {
                            //console.log(newValue)
                            $scope.socketPortBW = io.connect();
                            $scope.socketPortBW.disconnect();
                            console.log('socketPortBW disconnected')

                            $timeout(function () {
                                // $scope.showBandWidth = false;
                                $scope.portUpload = null;
                                $scope.portDownload = null;
                                $scope.showBandWidth = false
                            }, 500)

                        });

                        $scope.$watch('newDevice.ports[selectedPort].status', function (newValue, oldValue) {
                            if (newValue == 'Active') {
                                $scope.newDevice.ports[$scope.selectedPort].properties.installedDate = new Date()
                            }
                            else if (newValue == 'Pending') {
                                $scope.newDevice.ports[$scope.selectedPort].properties.installedDate = new Date("January 01, 2999 00:00:00");
                            }


                        });


                        //watch md-dialog: when dialog is closed, the socket will be disconnected
                        $scope.$watch(function () {
                            return angular.element(document).find('md-dialog').length > 0;
                        }, function (newValue, oldValue) {
                            //console.log(newValue)
                            if (!newValue) {
                                $scope.socketPortBW = io.connect();
                                $scope.socketPortBW.disconnect();
                                console.log('socketPortBW disconnected')
                            }
                        });

                        var parameter = []

                        $scope.getPortBandwidth = function (deviceID, IPAddress, port) {
                            console.log($scope.fpDestinationDevice)
                            if ($scope.newDevice.properties.deviceType == 'FP') {
                                $scope.socketPortBW = io.connect();
                                $scope.socketPortBW.disconnect();
                                $scope.showBandWidth = true

                                if ($scope.fpDestinationDevice.status == 'Pending' || $scope.fpDestinationDevice.ports[port - 1].status == 'Pending') {
                                    $scope.portUpload = 'None';
                                    $scope.portDownload = 'None';
                                } else {
                                    var temp = {
                                        'selectedID': $scope.fpDestinationDevice._id,
                                        'selectedPort': port,
                                        'selectedDeviceIP': $scope.fpDestinationDevice.IPAddress,
                                        'username': user_name
                                    }
                                    parameter.push(temp)
                                    $scope.socketPortBW.disconnect();
                                    $scope.socketPortBW.connect();
                                    // $scope.message = 'Recvd: Loading, Trans: Loading'
                                    $scope.get_ready_port(parameter, 0, 'lineClick')
                                    console.log('socketPortBW connected')
                                }
                            } else {
                                $scope.socketPortBW = io.connect();
                                $scope.socketPortBW.disconnect();
                                $scope.showBandWidth = true

                                if ($scope.newDevice.status == 'Pending' || port.status == 'Pending') {
                                    $scope.portUpload = 'None';
                                    $scope.portDownload = 'None';
                                } else {
                                    var temp = {
                                        'selectedID': deviceID,
                                        'selectedPort': port.portID,
                                        'selectedDeviceIP': IPAddress,
                                        'username': user_name
                                    }
                                    parameter.push(temp)
                                    $scope.socketPortBW.disconnect();
                                    $scope.socketPortBW.connect();
                                    // $scope.message = 'Recvd: Loading, Trans: Loading'
                                    $scope.get_ready_port(parameter, 0, 'lineClick')
                                    console.log('socketPortBW connected')
                                }
                            }


                        }

                        $scope.get_bandwidth_port = function (parameters, ind, method) {
                            $scope.socketPortBW.emit('getPortsBandWidth', parameters[ind], function (res) {
                                //console.log()
                                if (res.length == 0) {
                                    $scope.get_bandwidth_port(parameters, ind, method)
                                }
                                else {
                                    if (res[res.length - 1].data != null || res[res.length - 1].data != undefined || res[res.length - 1].data != '') {
                                        //console.log(parameters[ind], res)
                                        //console.log(parameters[ind].deviceData.deviceID)
                                        if (res[res.length - 1].data.ipxPortBandwidthStatusTxRate != undefined)
                                            $scope.portUpload = (res[res.length - 1].data.ipxPortBandwidthStatusTxRate / 1024).toFixed(2).toString() + ' Mb/s';
                                        else
                                            $scope.portUpload = '0.00 Mb/s';
                                        if (res[res.length - 1].data.ipxPortBandwidthStatusRxRate != undefined)
                                            $scope.portDownload = (res[res.length - 1].data.ipxPortBandwidthStatusRxRate / 1024).toFixed(2).toString() + ' Mb/s';
                                        else
                                            $scope.portDownload = '0.00 Mb/s';
                                        //console.log($scope.lineinfo.options.data.configList)
                                    }
                                    $scope.get_ready_port(parameters, ind + 1, method)
                                }
                            });
                        }

                        $scope.get_ready_port = function (parameters, ind, method) {
                            if (ind >= parameters.length) {
                                ind = 0
                            }
                            $scope.socketPortBW.emit('getReady', parameters[ind], function (response) {
                                //console.log('get ready', response)
                                //$scope.message = response.result

                                if (response.status == "success") {
                                    // console.log(para)
                                    $scope.get_bandwidth_port(parameters, ind, method)
                                }
                                else {
                                    $scope.socketPortBW.emit('getReady', parameters[ind], method)
                                }
                            });
                        }

                        $scope.loadPortConfig = function (route, port) {
                            //console.log(route)
                            //console.log(port)
                            if (route.portID != undefined) {
                                route.deviceID = $scope.selected_device_to_connect_id
                                //console.log($scope.newDevice.ports[route.portID - 1])
                                var selectedPortNo = $scope.newDevice.ports[port.portID - 1].selected_device_to_connect.filter(function (p) {
                                    return p.portID == route.portID
                                })
                                $scope.portSpeed_to_be_selected = selectedPortNo[0].config.portSpeed
                                //if ($scope.portSpeed_to_be_selected.length ==1){selectedPort = $scope.portSpeed_to_be_selected[0] }
                            }
                        }

                        //auto-complete for connectTo device
                        $scope.querySearchDevice = function (query, port) {
                            //var search_result = query ? $rootScope.devices.filter(createFilterForMap(query)) : $rootScope.devices;
                            var re = (query == undefined || query.length == 0) ? devices_to_be_connected : new Fuse(devices_to_be_connected, search_options_for_device).search(query)
                            var result = []
                            if ($scope.newDevice.properties.deviceType == 'MUX') {
                                if (port.config.IO == 'Input') {
                                    re.forEach(function (d) {
                                        if (d.properties.deviceType != 'MUX' && d.properties.deviceType != 'DEMUX') {
                                            result.push(d)
                                        }
                                    })
                                    return result
                                }
                                else {
                                    re.forEach(function (d) {
                                        if (d.properties.deviceType == 'DEMUX') {
                                            result.push(d)
                                        }
                                    })
                                    return result
                                }
                            }
                            else if ($scope.newDevice.properties.deviceType == 'DEMUX') {
                                if (port.config.IO == 'Output') {
                                    re.forEach(function (d) {
                                        if (d.properties.deviceType != 'MUX' && d.properties.deviceType != 'DEMUX') {
                                            result.push(d)
                                        }
                                    })
                                    return result
                                }
                                else {
                                    re.forEach(function (d) {
                                        if (d.properties.deviceType == 'MUX') {
                                            result.push(d)
                                        }
                                    })
                                    return result
                                }
                            }
                            else {
                                return (query == undefined || query.length == 0) ? devices_to_be_connected : new Fuse(devices_to_be_connected, search_options_for_device).search(query)
                            }
                        }

                        $scope.selectedItemChangeDevice = function (item, port) {
                            //console.log(port)
                            //console.log(item)
                            if (item != undefined) {
                                $scope.newDevice.ports[port.portID - 1].route.destDeviceTypeName = item.properties.deviceGeneralName


                                if ($scope.newDevice.properties.deviceType == 'FP') {
                                    $scope.fpDestinationDevice = item
                                }

                                $scope.selected_device_to_connect_id = item._id
                                //.newDevice.ports[port.portID - 1].destination_device_type = item.properties.deviceGeneralName
                                $scope.newDevice.ports[port.portID - 1].selected_device_to_connect = item.ports.filter(function (d) {
                                    if ($scope.newDevice.properties.deviceType != 'MUX' && $scope.newDevice.properties.deviceType != 'DEMUX') {
                                        if (item.properties.deviceType == 'MUX') {
                                            return (d.status == 'Init' || d.route.deviceID == $scope.newDevice._id ) && d.config.IO != 'Output'
                                        }
                                        else if (item.properties.deviceType == 'DEMUX') {
                                            return (d.status == 'Init' || d.route.deviceID == $scope.newDevice._id ) && d.config.IO != 'Input'
                                        }
                                        else {
                                            return d.status == 'Init' || d.route.deviceID == $scope.newDevice._id
                                        }
                                    }
                                    else {
                                        if ($scope.newDevice.properties.deviceType == 'MUX') {
                                            console.log(d)
                                            return (d.status == 'Init' || d.route.deviceID == $scope.newDevice._id ) && d.config.IO != 'Output'
                                        }
                                        else if ($scope.newDevice.properties.deviceType == 'DEMUX') {
                                            return (d.status == 'Init' || d.route.deviceID == $scope.newDevice._id ) && d.config.IO != 'Input'
                                        }
                                        else {
                                            return d.status == 'Init' || d.route.deviceID == $scope.newDevice._id
                                        }
                                    }

                                })
                                //console.log( $scope.newDevice.ports[port.portID - 1].selected_device_to_connect)

                                //console.log($scope.newDevice.ports[port.portID - 1])
                                //if (item.status != 'Init')
                                //item.deviceName = item.deviceName.split('-')[0] + ' - ' + item.location.address.streetNo + item.location.address.street + ', ' + item.location.address.city + ', ' + item.location.address.province + ', ' + item.location.address.country

                            }
                            else {
                                delete port.route.portID
                                delete port.route.portSpeed
                                delete port.portSpeed
                                delete port.properties.projectID
                                delete port.route.destDeviceTypeName
                            }
                            // console.log($scope.selected_device_to_connect1)
                        }

                        var search_options_for_device = {
                            keys: [{
                                name: 'deviceName',
                                weight: 0.5
                            }, 'IPAddress', 'location.address.streetNo', 'location.address.street', 'location.address.city', 'location.address.province'],   // keys to search in
                            threshold: 0.26,
                            shouldSort: true
                            //id: 'deviceName'                     // return a list of identifiers only
                        }

                        //end auto-complete for connectTo device


                        //connectTO show full address
                        if ($rootScope.connectedDevices && $rootScope.connectedDevices.length > 0) {
                            var devices_to_be_connected = $rootScope.connectedDevices.filter(function (d) {
                                if (d.deviceName != $scope.newDevice.deviceName && ['IPX', 'FP', 'MUX', 'DEMUX'].indexOf(d.properties.deviceType) > -1) {
                                    d.deviceNameShow = d.deviceName + ' - ' + d.location.address.streetNo + ' ' + d.location.address.street + ', ' + d.location.address.city + ', ' + d.location.address.province + ', ' + d.location.address.country
                                    return d
                                }
                            })
                        }

                        $scope.newDevice.ports.forEach(function (d, i) {
                            if (d.route.deviceID != undefined) {
                                //console.log(get_device(d.route.deviceID))
                                $scope.selectedItemDevice[i] = get_device(d.route.deviceID)
                                $scope.selectedItemChangeDevice($scope.selectedItemDevice[i], d)
                                $scope.loadPortConfig(d.route, d)
                            }
                        })
                    })
                }
                //end init
            }
            else {
                //console.log($scope.newDevice)
                var input_files = [];
                $scope.filesChange = function (files) {
                    //input_files = files;
                    var info = 0
                    files.forEach(function (f) {
                        //if(files.length>0)
                        //input_files.push(f)
                        $scope.newDevice.filenames.forEach(function (t) {
                            if (t.name == f.name) {
                                info = 1
                            }
                        })
                        if (info == 0) {
                            $scope.total_files.push({name: f.name, type: f.type})
                            input_files.push(f)
                        }
                    })

                    input_files = input_files.filter(function (t) {
                        return $scope.total_files.filter(function (i) {
                            return t.name == i.name && t.type == i.type
                        })[0]
                    })

                    //console.log(input_files)
                    //console.log($scope.total_files)

                }
            }
            //console.log($rootScope.tasks)

            var taskCheck = function (task, data) {
                //console.log(task.taskID)
                $rootScope.workflowProgress = false
                if (task.taskID == 1) {
                    if (data.properties == undefined) {
                        $scope.message = "Device Type is required."
                        $rootScope.notificationToast($scope.message)
                        return false
                    }
                }
                else if (task.taskID == 2) {
                    if (data.deviceName == undefined || data.deviceName == '' || data.deviceName == null) {
                        $scope.message = "Device Name is required."
                        $rootScope.notificationToast($scope.message)
                        return false
                    }

                }
                else if (task.taskID == 3) {
                    //console.log(data)
                    var ipformat = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
                    if ((data.status == undefined || data.status == null || data.status == '') || (data.status == 'Active' && (data.IPAddress == undefined || data.IPAddress == null || data.IPAddress == ''))) {
                        $scope.message = "Please enter the status and IP address."
                        $rootScope.notificationToast($scope.message)
                        return false
                    }
                    if (data.status == 'Active' && !data.IPAddress.match(ipformat)) {
                        $scope.message = "Invalid IP Address."
                        $rootScope.notificationToast($scope.message)
                        return false
                    }
                }
                else if (task.taskID == 4) {
                    //console.log(data)
                    if (data.location == undefined) {
                        $scope.message = "Address Invalid."
                        //$rootScope.notificationToast($scope.message)
                        return false
                    }
                    if (data.location.address.streetNo == undefined || data.location.address.street == undefined || data.location.address.city == undefined ||
                        data.location.address.province == undefined || data.location.address.country == undefined) {
                        $scope.message = "Address Invalid."
                        //$rootScope.notificationToast($scope.message)
                        return false
                    } else {
                        //var query = data.location.address.streetNo + '+' + data.location.address.street + '%2C+' + data.location.address.city + '%2C+' + data.location.address.province + '%2C+' + data.location.address.country
                        var query = data.location.address.streetNo + '+' + data.location.address.street + '%2C+' + data.location.address.city + '%2C+' + data.location.address.province

                        query = query.split(' ').join('+')
                        //console.log(query)
                        if ($scope.newDevice.location.coordinates == undefined || $scope.newDevice.location.coordinates == null || $scope.newDevice.location.coordinates == '') {
                            /*
                             $http.get("https://api.mapbox.com/geocoding/v5/mapbox.places/" + query + ".json?access_token=pk.eyJ1IjoiaXNhYWNqaWFuZyIsImEiOiJlMDgxNTZmYmU0YTMwYTYyNjYzMDhjMjgyMWZhMTFiNiJ9.BPBto3cpKfLph00_bNmzFQ")
                             .then(function (res) {
                             //console.log(res)
                             if (res.data.features.length > 0) {
                             $scope.newDevice.location.coordinates = {
                             lat: res.data.features[0].geometry.coordinates[1],
                             lng: res.data.features[0].geometry.coordinates[0]
                             }
                             $rootScopeon the map or .map_instance.setZoom(10)
                             $rootScope.map_instance.setView($scope.newDevice.location.coordinates)
                             }
                             }, function (error) {
                             if (data.location.coordinates == undefined) {
                             var coor = $rootScope.map_instance.getBounds()._southWest
                             $scope.newDevice.location.coordinates = {
                             lat: coor.lat > 0 ? coor.lat * 1.02 : coor.lat * 0.98,
                             lng: coor.lng > 0 ? coor.lng * 1.02 : coor.lng * 0.98
                             }
                             }
                             })*/
                            $http.get("http://" + user_settings.NOMINATIM_SERVER_IP + "/search.php?q=" + query + "&polygon=1&format=json&addressdetails=1&accept-language=en")
                                .then(function (res) {
                                    //console.log(res)
                                    if (res.data.length > 0) {
                                        $scope.newDevice.location.coordinates = {
                                            lat: parseFloat(res.data[0].lat),
                                            lng: parseFloat(res.data[0].lon)
                                        }

                                        $rootScope.map_instance.setZoom(10)
                                        $rootScope.map_instance.setView($scope.newDevice.location.coordinates)
                                    }
                                    else {
                                        var coor = $rootScope.map_instance.getBounds()._southWest
                                        $scope.newDevice.location.coordinates = {
                                            lat: coor.lat > 0 ? coor.lat * 1.02 : coor.lat * 0.98,
                                            lng: coor.lng > 0 ? coor.lng * 1.02 : coor.lng * 0.98
                                        }
                                    }

                                }, function (error) {
                                    if (data.location.coordinates == undefined) {
                                        var coor = $rootScope.map_instance.getBounds()._southWest
                                        $scope.newDevice.location.coordinates = {
                                            lat: coor.lat > 0 ? coor.lat * 1.02 : coor.lat * 0.98,
                                            lng: coor.lng > 0 ? coor.lng * 1.02 : coor.lng * 0.98
                                        }
                                    }
                                })

                        }
                    }
                }
                else if (task.taskID == 5) {
                    if (data.ports != undefined) {
                        for (var i = 0; i < data.ports.length; i++) {
                            if (Object.keys(data.ports[i].route).length > 0 && (data.ports[i].portID == undefined || data.ports[i].portSpeed == undefined || data.ports[i].route.deviceID == undefined || data.ports[i].route.portID == undefined || data.ports[i].route.portSpeed == undefined)) {
                                $scope.message = "PortID or Port Speed is required. "
                                $rootScope.notificationToast($scope.message)
                                return false
                            }
                        }
                    }
                }

                if (task.endFlag) {
                    for (var i = 0; i < task.taskID - 1; i++) {
                        var checkFlags = taskCheck($rootScope.tasks[i], data)
                        if (checkFlags == false) {
                            break;
                        }

                    }

                    return checkFlags
                }
                return true
            }
        }
    }])
    .controller('processPtnCtrl', ['$scope', '$mdDialog', "$rootScope", "$log", '$http', '$timeout', function ($scope, $mdDialog, $rootScope, $log, $http, $timeout) {

        $rootScope.processPtn = function (task) {
            if (task.processName == 'addPtn') {
                processPtnMD(task)
            }
        };

        $scope.deletePtn = function () {

        }

        $rootScope.clearPtnData = function (showDialog) {

            confirm = $mdDialog.confirm().title('Reset Workflow Settings!')
                .content('<strong> Are you sure to reset all settings? </strong>')
                .cancel('No').ok('Yes')

            if (showDialog == true) {
                $mdDialog.show(confirm).then(function () {
                    $http({
                        method: 'POST',
                        url: '/rest/workflow/clearworkflow',
                        params: {'username': $scope.current_user.username, 'processname': 'addPtn'}
                    }).then(
                        function (nodes) {
                            $rootScope.closeSidenav('processptn')
                        }
                    );

                }, function () {
                    $mdDialog.cancel()
                }).finally(function () {
                    confirm = undefined;
                });
            }
            else {
                $http({
                    method: 'POST',
                    url: '/rest/workflow/clearworkflow',
                    params: {'username': $scope.current_user.username, 'processname': 'addPtn'}
                })

            }

        }

        var processPtnMD = function (task) {

            $mdDialog.show({
                controller: processPtnMDCtrl,
                templateUrl: '/app/workflow/launchworkflow?process=' + task.taskKey,
                parent: angular.element(document.body),
                //targetEvent: task.ev,
                clickOutsideToClose: false,
                locals: {task: task, user_settings: $scope.current_user.settings}
            })


        }

        function processPtnMDCtrl($scope, $rootScope, $http, Upload, task, user_settings) {

            $scope.processPtnNext = function (data) {
                if (taskCheck(task, data)) {
                    //console.log(data)
                    task.data = data
                    $http.post('/rest/workflow/launchworkflow', task).success(function (res) {
                        $rootScope.tasks = res
                        if (task.endFlag) {
                            $http({
                                method: "GET",
                                url: "/rest/devices/getdeviceconfig",
                                params: {'key': 'PTN'}
                            }).then(function (res) {
                                //$rootScope.ptnNode.latlng
                                $scope.newPtn.properties = res.data[0];
                                $scope.newPtn.ports = res.data[0].ports
                                delete $scope.newPtn.properties.ports


                                if ($rootScope.ptnNode != undefined) {
                                    $scope.newPtn.location = {};
                                    $scope.newPtn.location.coordinates = $rootScope.ptnNode.latlng;
                                    $scope.newPtn.routeID = $rootScope.ptnNode.routeID;
                                }
                                else
                                    delete $scope.newPtn.location.address


                                $scope.newPtn.status = 'Init';
                                $scope.newPtn.lockStatus = 'locked';
                                var newPtn = $scope.newPtn;

                                $http.post("/rest/devices/setdevice", newPtn).success(function (d) {

                                    //socket.emit('getDevices', {'param': 'immediately'});
                                    $rootScope.nodes_update()
                                    $mdDialog.cancel();
                                    $rootScope.notificationToast(d.message)
                                })


                            })
                            $rootScope.clearPtnData(false)
                            $mdDialog.cancel();
                            $rootScope.closeSidenav('processptn')
                        }
                        else {
                            var nextTask = res.filter(function (d) {
                                return d.taskID == task.taskID + 1
                            })[0]
                            if (nextTask != undefined) {
                                nextTask.data = task.data
                                processPtnMD(nextTask)
                            }
                        }
                    })
                }
            };

            var taskCheck = function (task, data) {
                //console.log(task.taskID, data)
                if (task.taskID == 1) {
                    return true
                }
                if (task.endFlag) {
                    for (i = 0; i < task.taskID; i++) {
                        var checkFlags = taskCheck($rootScope.tasks[i], data)
                        if (checkFlags == false) {
                            break;
                        }
                    }
                    return checkFlags
                }
                return true
            }

            $scope.title_dialog = task.taskName

            if (task.data == undefined) {
                $scope.newPtn = {}
                $scope.newPtn.installedDate = new Date()
            }
            else {
                $scope.newPtn = task.data
                //console.log($scope.newPtn)
                $scope.newPtn.installedDate = new Date($scope.newPtn.installedDate)
            }

            $scope.cancel = function () {
                $mdDialog.cancel();
                $rootScope.nodes_update()
            };
        }

    }])
