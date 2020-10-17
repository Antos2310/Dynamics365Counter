var Xrm;
var app = angular.module('pluginStepsApp', ['ngMaterial', 'ui.bootstrap']);


app.controller('pluginStepsCtrl',
    function ($scope, $http, $mdDialog, $window) {

        $scope.status = '  ';
        $scope.matches = [];
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
                            'WhoAmI()'

                    })
                    .then(function successCallback(response) {
                        $http(
                            {
                                method: 'GET',
                                url: oDataUrl +
                                    '/systemusers(' + response.data.UserId + ')?$expand=systemuserroles_association($select=name;$filter=name eq \'System Administrator\')'

                            })
                            .then(function successCallback(response) {
                                if (response !== null && response.data !== null && response.data.systemuserroles_association !== null
                                    && response.data.systemuserroles_association.length > 0) {

                                    $http(
                                        {
                                            method: 'GET',
                                            url: oDataUrl +
                                                'RetrieveCurrentOrganization(AccessType=\'Default\')'

                                        })
                                        .then(function successCallback(response) {
                                            $scope.orgName = response.data.Detail.FriendlyName;
                                        });

                                    $scope.inputChanged();
                                    console.log("opened! ");

                                }
                                else {
                                        window.close();
                                }
                            }, function errorCallback(response) {
                                    window.close();
                            });

                    });

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
                            'sdkmessageprocessingsteps?$select=_sdkmessageid_value,_sdkmessagefilterid_value,configuration,name,sdkmessageprocessingstepid,createdon,mode,filteringattributes,ismanaged,' +
                            'modifiedon,stage,statecode,iscustomizable&$filter=ismanaged eq false and not contains(name,\'ObjectModel Implementation\')'

                    })
                    .then(function successCallback(response) {
                        response.data.value.forEach(element => {
                            if (element.iscustomizable.Value) {
                                $http(
                                    {
                                        method: 'GET',
                                        url: oDataUrl +
                                            'sdkmessages(' + element._sdkmessageid_value + ')?$select=categoryname&' +
                                            '$expand=sdkmessageid_sdkmessagefilter($filter=sdkmessagefilterid eq ' + element._sdkmessagefilterid_value + ';$select=primaryobjecttypecode)'

                                    })
                                    .then(function successCallback(response) {

                                        element.entityname = response.data.sdkmessageid_sdkmessagefilter[0].primaryobjecttypecode;
                                        element.messagename = response.data.categoryname;
                                    });



                                element.mode = modevalues[element.mode];
                                element.statecode = statusvalues[element.statecode];
                                element.stage = stagevalues[element.stage];
                                $scope.matches.push(element);
                            }
                        });

                        $scope.isLoading = false;
                        $scope.showTabs = true;
                    });

            }
        $scope.closeDialog = function () {
            $mdDialog.hide();
        },

            $scope.updateRecordFromDialog = function (entityname, recordId) {
                debugger;
                $scope.hidematches = false;
                $scope.hideattributes = true;

                var entity = {};
                entity.configuration =
                    $scope.currentconfig;

                var oDataUrl = Xrm + '/api/data/v9.1/';
                $http({
                    method: 'PATCH',
                    url: oDataUrl + entityname + '(' + recordId + ')',
                    data: JSON.stringify(entity)
                })
                    .then(function successCallback(response) {

                        alert("Plugin Step updated! ");
                        if (response.status === 204) {
                            $scope.inputChanged();
                            $mdDialog.hide();
                        }
                    });



            },


            $scope.showPrompt = function (ev, match) {
                $scope.hidejson = false;
                $scope.hidetable = true;

                $mdDialog.show({
                    templateUrl: "test.html",
                    clickOutsideToClose: true,
                    scope: $scope,
                    preserveScope: true,
                    controller: function ($scope) {
                        $scope.currentId = match.sdkmessageprocessingstepid;
                        $scope.currentmatch = match.configuration;
                        $scope.currentconfig = $scope.currentmatch;
                        $scope.steps = match;
                    }
                });
            };

        //Constants - https://docs.microsoft.com/en-us/dynamics365/customer-engagement/web-api/sdkmessageprocessingstep?view=dynamics-ce-odata-9
        const modevalues =
        {
            0: "Synchronous",
            1: "Asynchronous"
        }

        const stagevalues =
        {

            5: "Initial Pre-operation (For internal use only)",
            10: "Pre-validation",
            15: "Internal Pre-operation Before External Plugins (For internal use only)",
            20: "Pre-operation",
            25: "Internal Pre-operation After External Plugins (For internal use only)",
            30: "Main Operation (For internal use only)",
            35: "Internal Post-operation Before External Plugins (For internal use only)",
            40: "Post-operation",
            45: "Internal Post-operation After External Plugins (For internal use only)",
            50: "Post-operation (Deprecated)",
            55: "Final Post-operation (For internal use only)",
            80: "Pre-Commit stage fired before transaction commit (For internal use only)",
            90: "Post-Commit stage fired after transaction commit (For internal use only)"
        }

        const statusvalues =
        {
            0: "Enabled",
            1: "Disabled"
        }

    });
