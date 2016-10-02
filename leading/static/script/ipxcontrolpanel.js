if (socket == undefined) {
    var socket = io.connect();
}

app.service('deviceInfo', function ($http, $location, $q) {
    var deffered = $q.defer();
    var deviceID = $location.search().id
    var deviceInfo = {};

    deviceInfo.getData = function () {
        $http({method: 'GET', url: '/rest/devices/getdevices?key=' + deviceID}).then(function success(res) {
            data = res.data
            currentPort = $location.search().port
            deffered.resolve();
        });
        return deffered.promise;
    }

    deviceInfo.data = function () {
        return data
    }
    deviceInfo.currentPort = function () {

        return currentPort
    }
    return deviceInfo

});


app.service('sharedData', function () {
    var lineData = [{"Uhrzeit": "00:00", "Durchschn": "0", "Anz": "0"}];
    return lineData;
});

app.config(function ($locationProvider) {
    $locationProvider.html5Mode({enabled: true, requireBase: false}).hashPrefix('!');
})


app.controller('lefttopMenuCtrl', ['$scope', 'deviceInfo', '$rootScope', function ($scope, deviceInfo, $rootScope) {
    deviceInfo.getData().then(function () {
        //console.log(deviceInfo.data())
        $scope.device = deviceInfo.data()
        $rootScope.currentPort = deviceInfo.currentPort()
    })

    $scope.backtomap = function () {
        window.location.href = '/'
    }

}])

    .controller('SideNavCtrl', function ($scope, $timeout, $mdSidenav, $mdUtil) {
        $scope.toggleLeft = buildToggler('left');
        $scope.toggleRight = buildToggler('right');
        function buildToggler(navID) {
            var debounceFn = $mdUtil.debounce(function () {
                $mdSidenav(navID).toggle()
            }, 200);
            return debounceFn;
        }
    })

    .controller('contentCtrl', ['$scope', 'sharedData', 'deviceInfo', '$mdSidenav', '$rootScope', '$mdDialog', 'current_user', function ($scope, sharedData, deviceInfo, $mdSidenav, $rootScope, $mdDialog, current_user) {
        $scope.showProgress = function () {

            $mdDialog.show({
             controller: dialogController,
             template: '<md-dialog>' +
             '  <md-dialog-content>' +
             '<div class="md-dialog-content">' +
             '<h4>Hang on, We\'re setting things up for you.</h4>' +
             //'<span flex></span>' +
             '</div>' +
             '  <div style="min-height: 20px;min-width:480px" layout-padding layout-align="center center" layout> ' +
             '<md-progress-linear md-mode="indeterminate" style="width:300px"></md-progress-linear>' +
             '</div>' +
             '<div layout="row" layout-align="end end"><md-button type="button" ng-click="closeDialog()" class="md-primary">Cancel</md-button></div>' +
             '</md-dialog-content>' +
             '</md-dialog>'
             })



            /*     $mdDialog.show({
             controller: dialogController,
             template: '<md-dialog>' +
             '  <md-dialog-content>' +
             '<div class="md-dialog-content">' +
             '<h4>Hang on, We\'re setting things up for you.</h4>' +
             //'<span flex></span>' +
             '</div>' +
             '  <div style="min-height: 50px;min-width:480px" layout-padding layout-align="center center" layout> ' +
             '<img ng-src="static/icon/widget-loader-lg_no-lang.gif" width="120px" height="100px">' +
             '</div>' +
             '<div layout="row" layout-align="end end"><md-button type="button" ng-click="closeDialog()" class="md-primary">Cancel</md-button></div>' +
             '</md-dialog-content>' +
             '</md-dialog>'
             })    */
        };
        $scope.showProgress()
        function dialogController($scope, $mdDialog) {
            $scope.closeDialog = function () {
                $mdDialog.hide();
            }
        }

        $rootScope.notificationToast = function (message) {

            var toast = $mdToast.simple()
                .content(message)
                .action('OK')
                .highlightAction(false)
                .hideDelay(5000)
                .position('bottom right');
            $mdToast.show(toast).then(function (response) {
                if (response == 'ok') {
                    $mdToast.cancel()
                }
            });
        };


        current_user.getData().then(function () {
            $scope.current_user = {}
            $scope.current_user.username = current_user.username()
            $scope.current_user.settings = current_user.settings()
            deviceInfo.getData().then(function () {
            //deviceInfo.device = deviceInfo.data()
            // if (deviceInfo.data().currentPort == undefined) {
            //  deviceInfo.data().currentPort = 1
            // }

            $rootScope.currentPort = deviceInfo.currentPort() //for page show
            var socketparas = {
                'selectedID': deviceInfo.data()._id,
                'selectedPort': deviceInfo.currentPort(),
                'selectedDeviceIP': deviceInfo.data().IPAddress,
                'username': $scope.current_user.username
            }

            socket.on('connect', function () {
                socket.emit('getReady', socketparas, function (response) {
                    $scope.message = response.result
                    if (response.status == "success") {
                        socket.emit('getPortsBandWidth', socketparas);
                        socket.emit('getAllPortsBandWidth', socketparas);
                        socket.emit('getMulticastSource', socketparas);
                        socket.emit('getMulticastDistination', socketparas);
                    }
                    else {
                        socket.emit('getReady', socketparas)
                    }

                });

            });


            socket.on('getAllPortsBandWidth', function (d) {
                //console.log(d)
                socket.emit('getAllPortsBandWidth', socketparas);
                if ((d.data != undefined) && (d.data.length > 0)) {
                    $scope.items = d.data
                    $scope.items.forEach(function (e) {
                        e.data.ipxPortBandwidthStatusRxRate = (e.data.ipxPortBandwidthStatusRxRate / 1024).toFixed(2)
                        e.data.ipxPortBandwidthStatusTxRate = (e.data.ipxPortBandwidthStatusTxRate / 1024).toFixed(2)
                    })
                }

            })


            $scope.switchPort = function (portID) {
                socketparas.selectedPort = portID;
                $rootScope.currentPort = portID
                //console.log(portID)
                socket.emit('getReady', socketparas);
                sharedData = [];
                t1.clear().rows().remove().draw(false);
                t2.clear().rows().remove().draw(false);
                $mdSidenav('left').close();
                $scope.showProgress();
                //console.log(deviceInfo)
            }

            socket.on('getPortsBandWidth', function (data, fn) {
                //console.log("getPortsBandWidth!", data)
                socket.emit('getPortsBandWidth', socketparas);
                fn(true)
                console.log(data)
                if (data.data != '' || data.data != undefined) {
                    sharedData = []
                    data.forEach(function (d) {
                        if (Object.keys(d.data).indexOf('ipxPortBandwidthStatusRxRate') > 0) {
                            d.data.rx = d.data.ipxPortBandwidthStatusRxRate
                            d.data.tx = d.data.ipxPortBandwidthStatusTxRate
                        }
                        sharedData.push({
                            "Uhrzeit": new Date(d.datetime),
                            "Durchschn": d.data.rx / 1024,
                            "Anz": d.data.tx / 1024
                        })

                    })
                    sharedData.sort(function (a, b) {
                        if (a.Uhrzeit < b.Uhrzeit)
                            return -1;
                        if (a.Uhrzeit > b.Uhrzeit)
                            return 1;
                        return 0;
                    })


                    $scope.Update()
                    $mdDialog.cancel()


                }


            })

            socket.on('getMulticastSource', function (data) {
                socket.emit('getMulticastSource', socketparas);

                if ((data != null && data.data != undefined) && (data.data.length > 0)) {
                    $scope.tableOneData = data.data
                    t1.clear().rows.add(data.data).draw(false)
                }


            });

            socket.on('getMulticastDistination', function (data) {
                socket.emit('getMulticastDistination', socketparas);

                if ((data != null && data.data != undefined) && (data.data.length > 0)) {
                    $scope.tableTwoData = data.data
                    //console.log(data.data)
                    data.data.forEach(function (d) {
                        if (d[4] > 0) {
                            d[4] = ((d[4] / 1024).toFixed(2)).toString() + 'Mb/s'
                        }
                    })
                    t2.clear().rows.add(data.data).draw(false)
                }


            });


        })
        })





        $(document).ready(function () {

            var wHeight = $(document).height() / 2
            var main_margin = {top: 20, right: 20, bottom: 20, left: 80},
                mini_margin = {top: 20, right: 20, bottom: 60, left: 20},
                main_width = $(document).width() / 2 - main_margin.left - main_margin.right,
                mini_width = $(document).width() - mini_margin.left - mini_margin.right,
                main_height = wHeight * 0.7 - main_margin.top - main_margin.bottom,
                mini_height = wHeight * 0.3 - mini_margin.top - mini_margin.bottom;

            var formatDate = d3.time.format("%H:%M:%S"),
                parseDate = formatDate.parse,
                bisectDate = d3.bisector(function (d) {
                    return d.Uhrzeit;
                }).left,
                formatOutput0 = function (d) {
                    return formatDate(d.Uhrzeit) + " - " + d.Durchschn.toFixed(2) + " Mb/s";
                },
                formatOutput1 = function (d) {
                    return formatDate(d.Uhrzeit) + " - " + d.Anz.toFixed(2) + " Mb/s";
                };

            var main_x = d3.time.scale()
                    .range([0, main_width]),

                mini_x = d3.time.scale()
                    .range([0, mini_width]);

            var main_y0 = d3.scale.sqrt()
                    .range([main_height, 0]),
                main_y1 = d3.scale.sqrt()
                    .range([main_height, 0]),
                mini_y0 = d3.scale.sqrt()
                    .range([mini_height, 0]),
                mini_y1 = d3.scale.sqrt()
                    .range([mini_height, 0]);


            var main_xAxis = d3.svg.axis()
                    .scale(main_x)
                    .tickFormat('')
                    .orient("bottom"),
                mini_xAxis = d3.svg.axis()
                    .scale(mini_x)
                    .tickFormat(d3.time.format("%H:%M"))
                    .orient("bottom");

            var main_yAxisLeft = d3.svg.axis()
                .scale(main_y0)
                .orient("left");

            var main_yAxisLeft2 = d3.svg.axis()
                .scale(main_y1)
                .orient("left");

            var brush = d3.svg.brush()
                .x(mini_x)
                .on("brush", brush);

            var main_line0 = d3.svg.line()
            //.interpolate("cardinal")
                .x(function (d) {
                    return main_x(d.Uhrzeit);
                })
                .y(function (d) {
                    return main_y0(d.Durchschn);
                });

            var main_line1 = d3.svg.line()
            //.interpolate("cardinal")
                .x(function (d) {
                    return main_x(d.Uhrzeit);
                })
                .y(function (d) {
                    return main_y1(d.Anz);
                });

            var mini_line0 = d3.svg.line()
                .x(function (d) {
                    return mini_x(d.Uhrzeit);
                })
                .y(function (d) {
                    return mini_y0(d.Durchschn);
                });

            var mini_line1 = d3.svg.line()
                .x(function (d) {
                    return mini_x(d.Uhrzeit);
                })
                .y(function (d) {
                    return mini_y1(d.Anz);
                });

            var svg = d3.select("#ReceivedRate").append("svg")
                .attr("width", main_width + main_margin.left + main_margin.right)
                .attr("height", main_height + main_margin.top + main_margin.bottom);

            var svg2 = d3.select("#TransmittedRate").append("svg")
                .attr("width", main_width + main_margin.left + main_margin.right)
                .attr("height", main_height + main_margin.top + main_margin.bottom);

            var svgMini = d3.select("#MiniGraph").append("svg")
                .attr("width", mini_width + mini_margin.left + mini_margin.right)
                .attr("height", mini_height + mini_margin.top + mini_margin.bottom);

            svg.append("defs").append("clipPath")
                .attr("id", "clip")
                .append("rect")
                .attr("width", main_width)
                .attr("height", main_height);

            svg2.append("defs").append("clipPath")
                .attr("id", "clip")
                .append("rect")
                .attr("width", main_width)
                .attr("height", main_height);

            svgMini.append("defs").append("clipPath")
                .attr("id", "clip")
                .append("rect")
                .attr("width", mini_width)
                .attr("height", mini_height);

            var main = svg.append("g")
                .attr("transform", "translate(" + main_margin.left + "," + main_margin.top + ")");
            var main2 = svg2.append("g")
                .attr("transform", "translate(" + main_margin.left + "," + main_margin.top + ")");

            var mini = svgMini.append("g")
                .attr("transform", "translate(" + mini_margin.left + "," + mini_margin.top + ")");


            sharedData.forEach(function (d) {
                d.Uhrzeit = parseDate(d.Uhrzeit);
                d.Durchschn = +d.Durchschn;
                d.Anz = +d.Anz;
            });

            sharedData.sort(function (a, b) {
                return a.Uhrzeit - b.Uhrzeit;
            });

            main_x.domain([sharedData[0].Uhrzeit, sharedData[sharedData.length - 1].Uhrzeit]);
            main_y0.domain(d3.extent(sharedData, function (d) {
                return d.Durchschn;
            }));
            main_y1.domain(d3.extent(sharedData, function (d) {
                return d.Anz;
            }));
            mini_x.domain(main_x.domain());
            mini_y0.domain(main_y0.domain());
            mini_y1.domain(main_y1.domain());

            main.append("path")
                .datum(sharedData)
                .attr("clip-path", "url(#clip)")
                .attr("class", "line line0")
                .attr("d", main_line0);

            main2.append("path")
                .datum(sharedData)
                .attr("clip-path", "url(#clip)")
                .attr("class", "line line1")
                .attr("d", main_line1);

            main.append("g")
                .attr("class", "x1 axis")//avoid use it. change the class from x to x1.
                .attr("transform", "translate(0," + main_height + ")")
                .call(main_xAxis);
            main2.append("g")
                .attr("class", "x2 axis")
                .attr("transform", "translate(0," + main_height + ")")
                .call(main_xAxis);

            main.append("g")
                .attr("class", "y axis axisLeft")
                .call(main_yAxisLeft)
                .append("text")
                .attr("id", "axisLeftText")
                //.attr("transform", "rotate(-90)")
                .attr("y", 6)
                .attr('x', 200)
                .attr("dy", ".71em")
                .style("text-anchor", "end")
                .text("");

            main2.append("g")
                .attr("class", "y2 axis axisLeft")
                .call(main_yAxisLeft2)
                .append("text")
                .attr("id", "axisLeftText2")
                //.attr("transform", "rotate(-90)")
                .attr("y", 6)
                .attr('x', 200)
                .attr("dy", ".71em")
                .style("text-anchor", "end")
                .text("");

            mini.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + mini_height + ")")
                .call(mini_xAxis);

            mini.append("path")
                .datum(sharedData)
                .attr("class", "line line0")
                .attr("d", mini_line0);

            mini.append("path")
                .datum(sharedData)
                .attr("class", "line line1")
                .attr("d", mini_line1);

            mini.append("g")
                .attr("class", "x brush")
                .call(brush)
                .selectAll("rect")
                .attr("y", -6)
                .attr("height", mini_height + 7);

            var focus = main.append("g")
                .attr("class", "focus")
                .style("display", "none");

            var focus2 = main2.append("g")
                .attr("class", "focus2")
                .style("display", "none");


            focus.append("line")
                .attr("class", "x")
                .attr("y1", main_height - 6)
                .attr("y2", 0 + 6);

            focus.append("line")
                .attr("class", "y0")
                .attr("x1", main_width - 6) // nach links
                .attr("x2", main_width + 6); // nach rechts


            focus.append("circle")
                .attr("class", "y0")
                .attr("r", 4);

            focus.append("text")
                .attr("class", "y0")
                .attr("dy", "-1em");

            focus2.append("line")
                .attr("class", "x")
                .attr("y1", main_height - 6)
                .attr("y2", 0 + 6);

            focus2.append("line")
                .attr("class", "y1")
                .attr("x1", main_width - 6) // nach links
                .attr("x2", main_width + 6); // nach rechts

            focus2.append("circle")
                .attr("class", "y1")
                .attr("r", 4);

            focus2.append("text")
                .attr("class", "y1")
                .attr("dy", "-1em");


            main.append("rect")
                .attr("class", "overlay")
                .attr("width", main_width)
                .attr("height", main_height)
                .on("mouseover", function () {
                    focus.style("display", null);
                    focus2.style("display", null);
                })
                .on("mouseout", function () {
                    focus.style("display", "none");
                    focus2.style("display", "none");
                })
                .on("mousemove", mousemove);

            main2.append("rect")
                .attr("class", "overlay")
                .attr("width", main_width)
                .attr("height", main_height)
                .on("mouseover", function () {
                    focus.style("display", null);
                    focus2.style("display", null);
                })
                .on("mouseout", function () {
                    focus.style("display", "none");
                    focus2.style("display", "none");
                })
                .on("mousemove", mousemove);


            function mousemove() {

                if (sharedData.length > 1) {
                    var x0 = main_x.invert(d3.mouse(this)[0]),
                        i = bisectDate(sharedData, x0, 1),
                        d0 = sharedData[i - 1],
                        d1 = sharedData[i],
                        d = x0 - d0.Uhrzeit > d1.Uhrzeit - x0 ? d1 : d0;

                    focus.select("circle.y0").attr("transform", "translate(" + main_x(d.Uhrzeit) + "," + main_y0(d.Durchschn) + ")");
                    focus.select("text.y0").attr("transform", "translate(" + (d3.mouse(this)[0] >= (main_width / 2) ? main_x(d.Uhrzeit) - 160 : main_x(d.Uhrzeit)) + "," + main_y0(d.Durchschn) + ")").text(formatOutput0(d));
                    focus.select(".x").attr("transform", "translate(" + main_x(d.Uhrzeit) + ",0)");
                    focus.select(".y0").attr("transform", "translate(" + main_width * -1 + ", " + main_y0(d.Durchschn) + ")").attr("x2", main_width + main_x(d.Uhrzeit));

                    focus2.select("circle.y1").attr("transform", "translate(" + main_x(d.Uhrzeit) + "," + main_y1(d.Anz) + ")");
                    focus2.select("text.y1").attr("transform", "translate(" + (d3.mouse(this)[0] >= (main_width / 2) ? main_x(d.Uhrzeit) - 160 : main_x(d.Uhrzeit)) + "," + main_y1(d.Anz) + ")").text(formatOutput1(d));
                    focus2.select(".x").attr("transform", "translate(" + main_x(d.Uhrzeit) + ",0)");
                    focus2.select(".y1").attr("transform", "translate(" + main_width * -1 + " , " + main_y1(d.Anz) + ")").attr("x1", main_width + main_x(d.Uhrzeit));
                }
            }

            function brush() {
                main_x.domain(brush.empty() ? mini_x.domain() : brush.extent());
                main.select(".line0").attr("d", main_line0);
                main.select(".line1").attr("d", main_line1);
                //main.select(".x.axis").call(main_xAxis);
                main2.select(".line0").attr("d", main_line0);
                main2.select(".line1").attr("d", main_line1);
                //main2.select(".x.axis").call(main_xAxis);
            }


            $scope.Update = function () {

                var main_data = []
                //Redefine axes

                if (brush.empty()) {
                    main_data = sharedData.slice(1, sharedData.length - 1)
                }
                else {
                    sharedData.forEach(function (d) {
                        if (d.Uhrzeit > brush.extent()[0] && d.Uhrzeit < brush.extent()[1]) {
                            main_data.push(d)
                        }
                        ;
                    })
                }
                if (main_data.length > 0) {
                    main_x.domain(brush.empty() ? [main_data[0].Uhrzeit, main_data[main_data.length - 1].Uhrzeit] : brush.extent());
                    var valRange1 = (d3.max(main_data, function (d) {
                            return d.Durchschn;
                        }) - d3.min(main_data, function (d) {
                            return d.Durchschn;
                    }))
                    var valRange2 = (d3.max(main_data, function (d) {
                            return d.Anz;
                        }) - d3.min(main_data, function (d) {
                            return d.Anz;
                    }))

                    main_y0.domain([//d3.min(main_data, function (d) {return d.Durchschn;}) - valRange1
                        0, d3.max(main_data, function (d) {
                            return d.Durchschn * 1.6;
                    }) + valRange1]);
                    main_y1.domain([//d3.min(main_data, function (d) {return d.Anz;}) - valRange2
                        0, d3.max(main_data, function (d) {
                            return d.Anz * 1.6;
                    }) + valRange2]);
                    mini_x.domain([sharedData[0].Uhrzeit, sharedData[sharedData.length - 1].Uhrzeit]);//main_x.domain()
                    mini_y0.domain(d3.extent(sharedData, function (d) {
                        return d.Durchschn;
                    }));
                    mini_y1.domain(d3.extent(sharedData, function (d) {
                        return d.Anz;
                    }));

                    //Redefine paths
                    main_line0 = d3.svg.line()
                        .interpolate("monotone")
                        .x(function (d) {
                            return main_x(d.Uhrzeit);
                        })
                        .y(function (d) {
                            return main_y0(d.Durchschn);
                        });

                    main_line1 = d3.svg.line()
                        .interpolate("monotone")
                        .x(function (d) {
                            return main_x(d.Uhrzeit);
                        })
                        .y(function (d) {
                            return main_y1(d.Anz);
                        });

                    mini_line0 = d3.svg.line()
                        .x(function (d) {
                            return mini_x(d.Uhrzeit);
                        })
                        .y(function (d) {
                            return mini_y0(d.Durchschn);
                        });

                    mini_line1 = d3.svg.line()
                        .x(function (d) {
                            return mini_x(d.Uhrzeit);
                        })
                        .y(function (d) {
                            return mini_y1(d.Anz);
                        });


                    var trans_dur = 750; //define the length of the transitions (in ms)

                    //Update and animate changes
                    main.selectAll("path.line.line0").datum(sharedData).transition().duration(trans_dur)
                        .attr("d", main_line0);

                    main2.selectAll("path.line.line1").datum(sharedData).transition().duration(trans_dur)
                        .attr("d", main_line1);

                    // main.selectAll("g.x.axis").transition().duration(trans_dur).call(main_xAxis)
                    // main2.selectAll("g.x2.axis").transition().duration(trans_dur).call(main_xAxis);


                    main.selectAll("g.y.axis.axisLeft").transition().duration(trans_dur)
                        .call(main_yAxisLeft);
                    main.selectAll("#axisLeftText")[0][0].innerHTML = "Received: " + main_data[main_data.length - 1].Durchschn.toFixed(2) + " Mb/s";

                    main2.selectAll("g.y2.axis.axisLeft").transition().duration(trans_dur)
                        .call(main_yAxisLeft2);
                    main2.selectAll("#axisLeftText2")[0][0].innerHTML = "Transmitted: " + main_data[main_data.length - 1].Anz.toFixed(2) + " Mb/s";

                    mini.selectAll("g .x.axis").transition().duration(trans_dur)
                        .call(mini_xAxis);

                    //mini.selectAll("g .x.brush").transition().duration(trans_dur).call(brush)


                    mini.selectAll("path.line:first-of-type").datum(sharedData).transition().duration(trans_dur)
                        .attr("d", mini_line0);

                    mini.selectAll("path.line:last-of-type").datum(sharedData).transition().duration(trans_dur)
                        .attr("d", mini_line1);

                }
            }

            t1 = $('#MutilcastFrom').DataTable({
                data: $scope.tableOneData,
                "bDestroy": true,
                "ordering": false,
                "order": [[1, 'asc']],
                "dom": 'tip',
                columns: [
                    {title: "", class: "dt-center"},
                    {title: "Multicast IP", class: "dt-center"},
                    {title: "Source IP", class: "dt-center"},
                    {title: "VLAN", class: "dt-center"},
                    {title: "Status [Source ID]", class: "dt-center"},
                    //{title: "Status"},
                    {title: "Last Update", class: "dt-center"}
                ]
            });

            t1.on('order.dt search.dt', function () {
                t1.column(0, {search: 'applied', order: 'applied'}).nodes().each(function (cell, i) {
                    cell.innerHTML = i + 1;
                });
            }).draw();

            t2 = $('#MutilcastTo').DataTable({
                data: $scope.tableTwoData,
                "bDestroy": true,
                "ordering": false,
                "dom": 'tip',
                "order": [[1, 'asc']],

                columns: [
                    {title: ""},
                    {title: "Multicast IP", class: "dt-center"},
                    {title: "Source Name", class: "dt-center"},
                    {title: "SSM Source", class: "dt-center"},
                    {title: "Band Width", class: "dt-center"},
                    {title: "Bytes Dropped", class: "dt-center"},
                    {title: "EnableMonitor", visible: false},
                    {title: "Last Update", class: "dt-center"}
                ]
            });

            t2.on('order.dt search.dt', function () {
                t2.column(0, {search: 'applied', order: 'applied'}).nodes().each(function (cell, i) {
                    cell.innerHTML = i + 1;
                });
            }).draw();


        })


    }]);






