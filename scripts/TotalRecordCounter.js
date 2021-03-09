var Xrm;
var app = angular.module('totalRecordCounterApp', ['ngMaterial', 'ui.bootstrap']);


app.controller('totalRecordCounterCtrl',
    function ($scope, $http, $mdDialog, $filter, $window) {

        $scope.status = '  ';
        $scope.matches = [];
        $scope.originalMatches = [];
        $scope.checkedResults = [];
        $scope.attributes = [];
        $scope.steps = {};
        $scope.hidematches = false;
        $scope.hideattributes = false;
        $scope.jsonval = '';
        $scope.currentmatch = '';
        $scope.currentId = '';
        $scope.orgName = '';

        $scope.currentPage = 1;
        $scope.numPerPage = 10;
        $scope.showTabs = true;
        var filter = $filter('filter');
        var intervalVar;
        $scope.orderByField = 'LogicalName';
        $scope.reverseSort = false;
        var entityList = "";
        var errorList = "";
        var counter = 0;

        $scope.init = function () {

            chrome.runtime.sendMessage({
                type: 'GetXrm'
            }, function (_xrm) {

                if (_xrm == null)
                    window.close();

                Xrm = _xrm;

                var oDataUrl = _xrm + '/api/data/v9.1/';


                $http(
                    {
                        method: 'GET',
                        url: oDataUrl +
                            'RetrieveCurrentOrganization(AccessType=\'Default\')'

                    })
                    .then(function successCallback(response) {
                        $scope.orgName = response.data.Detail.FriendlyName;
                    }, function errorCallback(response) {
                        window.close();
                    });

                $scope.inputChanged();
                console.log("opened! ");


            });
        },

            $scope.inputChanged = function () {
                $scope.isLoading = true;
                $scope.showTabs = false
                $scope.hideattributes = true;
                $scope.hidematches = false;
                var oDataUrl = Xrm + '/api/data/v9.1/';
                $http(
                    {
                        method: 'GET',
                        url: oDataUrl +
                            'EntityDefinitions?$select=LogicalName,EntitySetName,MetadataId,IsCustomEntity,DisplayName&$filter=IsCustomizable/Value eq true'

                    })
                    .then(function successCallback(response) {

                        $scope.matches = response.data.value;
                        $scope.originalMatches = response.data.value;

                    });

                $scope.isLoading = false;
                $scope.showTabs = true;
            }

        $scope.closeDialog = function () {
            $mdDialog.hide();
        },
       
        $scope.getCountsAsyn = function(filtered, oDataUrl)
        {
            
            return new Promise((resolve, reject) => {
                counter = 0;
            entityList = "";
                angular.forEach(filtered, function (item) {
                    if (item.Selected) {
                        counter++;

                        if (entityList != "")
                            entityList += "'" + item.LogicalName + "',";
                        else
                            entityList = "'" + item.LogicalName + "',";

                        if (counter === 5) {
                            entityList = entityList.replace(/,\s*$/, "");

                            $http(
                                {
                                    method: 'GET',
                                    url: oDataUrl +
                                        'RetrieveTotalRecordCount(EntityNames=[' + entityList + '])'

                                })
                                .then(function successCallback(response) {

                                    response.data.EntityRecordCountCollection.Keys.forEach(function (item, index) {
                                        $scope.matches.find(e => e.LogicalName === item).Count = response.data.EntityRecordCountCollection.Values[index]

                                    });

                                }, function errorCallback(response) {

                                    errorList += response.data.error.message + '\n';

                                    //alert(response.data.error.message);

                                });

                            entityList = "";
                            counter = 0;
                        }
                    }

                })
                resolve();
            })
        },

            $scope.getCounts = function () {
                $scope.isLoading = true;
                $scope.showTabs = false
                $scope.hideattributes = true;
                $scope.hidematches = false;
                errorList = "";
                //var counter = 0;
                var oDataUrl = Xrm + '/api/data/v9.1/';
                // var entityList = "";
                // var errorList = "";

                var filtered = filter($scope.matches, $scope.search);
                $scope.getCountsAsyn(filtered,oDataUrl).then(function ()
                {
                    if(errorList !== "")
                    {
                        alert(errorList);
                    }
     
                });

                if (entityList != "") {
                    entityList = entityList.replace(/,\s*$/, "");

                    $http(
                        {
                            method: 'GET',
                            url: oDataUrl +
                                'RetrieveTotalRecordCount(EntityNames=[' + entityList + '])'

                        })
                        .then(function successCallback(response) {

                            response.data.EntityRecordCountCollection.Keys.forEach(function (item, index) {
                                $scope.matches.find(e => e.LogicalName === item).Count = response.data.EntityRecordCountCollection.Values[index]

                            });


                        }, function errorCallback(response) {

                            errorList += response.data.error.message + '\n';
                           // alert(response.data.error.message);

                        });
                }

               if(errorList !== "")
               {
                   alert(errorList);
               }


                $scope.isLoading = false;
                $scope.showTabs = true;
            },
            $scope.toggleAll = function () {

                if (($scope.search === "" || $scope.search == undefined || $scope.search === "undefined") && $scope.selectedAll) {
                    alert("Enter Search Criteria to select.");
                    $scope.selectedAll = false;
                    return;
                }
                if ($scope.selectedAll)
                    document.getElementById("lblFilter").innerHTML = " Unselect All ";
                else
                {
                    $scope.selectedList = false;
                    document.getElementById("lblFilter").innerHTML = " Select Filtered ";
                }
                    

                var filtered = filter($scope.originalMatches, $scope.search);
                angular.forEach(filtered, function (item) {
                    item.Selected = $scope.selectedAll;
                });
                $scope.matches = $scope.originalMatches;
            },

            $scope.showSelected = function () {
                $scope.checkedResults = [];
                if ($scope.selectedList) {
                    var filtered = filter($scope.originalMatches, $scope.search);
                    angular.forEach(filtered, function (item) {
                        if (item.Selected) {
                            $scope.checkedResults.push(item);
                        }
                    });

                    $scope.matches = $scope.checkedResults;
                }
                else {
                    $scope.matches = $scope.originalMatches;
                }
            },

            $scope.optionToggled = function () {
                $scope.isAllSelected = $scope.matches.every(function (itm) { debugger; return itm.selected; })
            },

            $scope.exportData = function () {
                var blob = new Blob([document.getElementById('exportable').innerHTML], {
                    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8"
                });
                saveAs(blob, "Report.xls");
            },
            $scope.setRefreshInterval = function () {
                if ($scope.interval == undefined || $scope.interval === "undefined") {
                    alert("Enter interval in milliseconds");
                    return;
                }
                
                intervalVar = setInterval(function () {
                    $scope.getCounts();
                }, $scope.interval)

                alert("Refresh Interval set for " +$scope.interval+ " milliseconds. ");
            },

            $scope.clearInterval = function () {
                clearInterval(intervalVar);
                alert("Refresh Interval set for " +$scope.interval+ " milliseconds has been cleared. ");
            }


    });
