

var Xrm;
var app = angular.module('metadatBrowserApp', ['ngMaterial', 'ui.bootstrap']);

//unique filter
app.filter("unique", function () {

    return function (collection, keyname) {
        var output = [],
            keys = [];

        angular.forEach(collection, function (item) {

            var key = item[keyname];

            if (keys.indexOf(key) === -1) {
                keys.push(key);
                output.push(item);
            }
        });

        return output;
    };
});

app.controller('metadataCtrl',
    function ($scope, $http, $mdDialog, $window, $location, $anchorScroll) {

        $scope.shouldBeFocused = false;
        $scope.status = '  ';
        $scope.inputText = {};
        $scope.orgName = '';
        $scope.inputFormEntity = {};
        $scope.checkBoxItem = {};
        $scope.matches = [];
        $scope.entities = [];
        $scope.attributes = [];
        $scope.formdetails = [];
        $scope.formeventdetails = [];
        $scope.MetadataID = '';
        $scope.hidematches = false;
        $scope.hideattributes = false;
        $scope.showDiv = true;


        $scope.currentPage = 1;
        $scope.numPerPage = 10;

        $scope.init = function () {

            chrome.runtime.sendMessage({
                type: 'GetXrm'
            }, function (_xrm) {
                $scope.isLoading = true;
                $scope.showTabs = false;
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
                                                'EntityDefinitions?$select=LogicalName,EntitySetName'

                                        })
                                        .then(function successCallback(response) {
                                            $scope.entities = response.data.value;
                                        });

                                    $http(
                                        {
                                            method: 'GET',
                                            url: oDataUrl +
                                                'RetrieveCurrentOrganization(AccessType=\'Default\')'

                                        })
                                        .then(function successCallback(response) {
                                            $scope.orgName = response.data.Detail.FriendlyName;
                                        });

                                    $scope.isLoading = false;
                                    $scope.showTabs = true;

                                }
                                else {
                                    chrome.runtime.sendMessage({
                                        type: 'RoleAlert'
                                    }, function () {
                                        window.close();
                                    });
                                }
                            }, function errorCallback(response) {
                                chrome.runtime.sendMessage({
                                    type: 'RoleAlert'
                                }, function () {
                                    window.close();
                                });
                            });

                    });

            });

        },
            $scope.scrollDown = function () {
                $location.hash('containerid');
                $anchorScroll();
            },
            $scope.updateRecord = function (recordId) {

                $scope.hidematches = false;
                $scope.hideattributes = true;
                for (var i = 0; i < $scope.matches.length; i++) {
                    if (($scope.matches[i].configuration !== $scope.originalList[i].configuration)) {
                        var entity = {};
                        entity.configuration =
                            $scope.matches[i].configuration; //$scope.matches[index].configuration;

                        var oDataUrl = Xrm + '/api/data/v9.1/';
                        $http({
                            method: 'PATCH',
                            url: oDataUrl + $scope.inputText + '(' + recordId + ')',
                            data: JSON.stringify(entity)
                        })
                            .then(function (response) {

                                alert("updated! ");
                                if (response.status === 204)
                                    $scope.inputChanged();

                            });
                    }
                }


            },
            $scope.closeDialog = function () {
                $mdDialog.hide();
            },

            $scope.updateRecordFromDialog = function (recordId) {
                $scope.hidematches = false;
                $scope.hideattributes = true;

                var entity = {};
                entity.configuration =
                    $scope.currentconfig;

                var oDataUrl = Xrm + '/api/data/v9.1/';
                $http({
                    method: 'PATCH',
                    url: oDataUrl + $scope.inputText.item.EntitySetName + '(' + recordId + ')',
                    data: JSON.stringify(entity)
                })
                    .then(function successCallback(response) {

                        alert("updated! ");
                        if (response.status === 204) {
                            $scope.inputChanged();
                            $mdDialog.hide();
                        }
                    });
            },

            $scope.showDivEvent = function (value) {
                $scope.showDiv = value;
            },

            $scope.showAttributes = function () {
               
                if($scope.inputText.item == null)
                   {
                       alert("Select Entity. ");
                       return;
                   }

                   $scope.isLoading = true;
                   $scope.showTabs = false;
                   $scope.hidematches = true;
                   $scope.hideattributes = false;
                   var expandQuery;
   
                var oDataUrl = Xrm + '/api/data/v9.1/';

                if ($scope.checkBoxItem.item)
                    expandQuery = '\'&$expand=Attributes($filter=IsCustomAttribute eq true)';
                else
                    expandQuery = '\'&$expand=Attributes';

                $http({
                    method: 'GET',
                    url: oDataUrl +
                        'EntityDefinitions?$select=MetadataId&$filter=LogicalName eq \'' +
                        $scope.inputText.item.LogicalName +
                        expandQuery,
                    async: false
                })
                    .then(function (response) {
                        $scope.MetadataID = response.data.value[0].MetadataId;
                        $scope.attributes = response.data.value[0].Attributes;
                        $scope.isLoading = false;
                        $scope.showTabs = true;
                    });

            },

            $scope.showFormDetails = function () {

                if($scope.inputFormEntity.item == null)
                {
                    alert("Select Entity. ");
                    return;
                }

                if (window.editor != null) {
                    window.editor.setValue('');
                    $scope.scriptName = '';
                }

                $scope.isLoading = true;
                $scope.showTabs = false;
                $scope.formdetails = [];
                $scope.formeventdetails = [];
                var oDataUrl = Xrm + '/api/data/v9.1/';
                $http({
                    method: 'GET',
                    url: oDataUrl +
                        'systemforms?$filter=objecttypecode eq \'' +
                        $scope.inputFormEntity.item.LogicalName +
                        '\'and type eq 2&$select=formxml,name',
                    async: false
                })
                    .then(function (results) {

                        for (var k = 0; k < results.data.value.length; k++) {
                            var parser = new DOMParser();
                            var xmlDoc = parser.parseFromString(results.data.value[k].formxml, "text/xml");
                            var forName = results.data.value[k].name;
                            var formId = results.data.value[k].formid;
                            $scope.formdetails.push({
                                "FormId": formId,
                                "Name": forName,
                                "Events": []
                            });

                            var eventTag = xmlDoc.getElementsByTagName("form")[0].getElementsByTagName("events")
                            for (var i = 0; i < eventTag.length; i++) {
                                for (var j = 0; j < eventTag[i].childNodes.length; j++) {
                                    var el = eventTag[i].childNodes[j];
                                    var eventName = el.attributes[0].value
                                    for (var l = 0; l < el.childNodes.length; l++) {

                                        var handlerType = el.childNodes[l].nodeName.toLowerCase() === "handlers" ? false : true;

                                        for (var m = 0; m < el.childNodes[l].childNodes.length; m++) {
                                            var functName = el.childNodes[l].childNodes[m].attributes[0].value;
                                            var webresourceName = el.childNodes[l].childNodes[m].attributes[1].value;

                                            $scope.formeventdetails.push({
                                                "Event": eventName,
                                                "FunctName": functName,
                                                "Internal": handlerType,
                                                "WebResourceName": webresourceName,
                                                "FormName": forName,
                                            });

                                            console.log(results.data.value[k].name + "||" + el.attributes[0].value
                                                + "||" + el.childNodes[l].childNodes[m].attributes[0].value + "||" +
                                                el.childNodes[l].childNodes[m].attributes[1].value);
                                        }

                                    }

                                }
                            }

                        }
                        $scope.isLoading = false;
                        $scope.showTabs = true;
                        
                    });
            },

            $scope.editAttribute = function (ev, attribute) {
                $window.open(Xrm + '/tools/systemcustomization/attributes/manageAttribute.aspx?attributeId=%7b' + attribute.MetadataId + '%7d&entityId=' + $scope.MetadataID, "popup", "width=500,height=500,left=10,top=150");
            },

            $scope.editForm = function (ev, formdetail) {
                $window.open(Xrm + '/main.aspx?pagetype=formeditor&etn=' + $scope.inputFormEntity.item.LogicalName + '&extraqs=formtype%3dmain%26formId%3d' + formdetail.FormId, "popup", "width=500,height=500,left=10,top=150");
            },

            $scope.editWebresource = function (ev, fromeventdetail) {
                var oDataUrl = Xrm + '/api/data/v9.1/';
                $http({
                    method: 'GET',
                    url: oDataUrl +
                        'webresourceset?$select=webresourceid&$filter=name eq \'' +
                        fromeventdetail.WebResourceName + '\'',
                    async: false
                })
                    .then(function (results) {

                        $window.open(Xrm + '/main.aspx?etn=' + $scope.inputFormEntity.item.LogicalName + '&pagetype=webresourceedit&id=%7b' + results.data.value[0].webresourceid + '%7d');
                    });

            }

        $scope.Publish = function () {
            $scope.isLoading = true;
            var parameters = {};
            parameters.ParameterXml = "<importexportxml><entities><entity>" + $scope.inputText.item.LogicalName + "</entity></entities></importexportxml>";

            var oDataUrl = Xrm + '/api/data/v9.1/PublishXml';
            $http({
                method: 'POST',
                url: oDataUrl,
                data: JSON.stringify(parameters)
            })
                .then(function successCallback(response) {

                    if (response.status === 204) {
                        alert($scope.inputText.item.LogicalName + " Published!");
                    }
                    $scope.isLoading = false;
                });

        },

            $scope.GetScriptContent = function (ev, fromeventdetail) {
                var oDataUrl = Xrm + '/api/data/v9.1/';
                $scope.shouldBeFocused = true;
                $scope.validatedJS = '';
                $http({
                    method: 'GET',
                    url: oDataUrl +
                        'webresourceset?$select=webresourceid,content&$filter=name eq \'' +
                        fromeventdetail.WebResourceName + '\'',
                    async: false
                })
                    .then(function successCallback(response) {
                        $scope.scriptName = fromeventdetail.WebResourceName;
                        $scope.validatedJS =
                            decodeURIComponent(atob(response.data.value[0].content).split('').map(function (c) {
                                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                            }).join(''));//window.atob(response.data.value[0].content);
                        if (window.editor != null) {
                            require.config({ paths: { 'vs': 'https://unpkg.com/monaco-editor@0.11.1/min/vs/' } });
                            require(['vs/editor/editor.main'], function () {
                                window.editor.setValue($scope.validatedJS);
                            });
                        }
                        else {
                            require.config({ paths: { 'vs': 'https://unpkg.com/monaco-editor@0.11.1/min/vs/' } });
                            require(['vs/editor/editor.main'], function () {
                                window.editor = monaco.editor.create(document.getElementById('containerid'), {
                                    language: "javascript",

                                    value: $scope.validatedJS
                                });
                            });
                        }

                    });


            };

    });

