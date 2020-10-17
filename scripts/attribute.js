

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
        $scope.inputSolution = {};
        $scope.inputFormSolution = {};
        $scope.orgName = '';
        $scope.inputFormEntity = {};
        $scope.checkBoxItem = {};
        $scope.matches = [];
        $scope.entities = [];
        $scope.solution = [];
        $scope.formsolution = [];
        $scope.attributes = [];
        $scope.formdetails = [];
        $scope.formeventdetails = [];
        $scope.MetadataID = '';
        $scope.hidematches = false;
        $scope.hideattributes = false;
        $scope.showDiv = true;
        $scope.showCompareDiv = true;
        $scope.selected = undefined;
        $scope.showPublish = false;
        $scope.showScriptDiv = true;

        $scope.currentPage = 1;
        $scope.numPerPage = 10;

        $scope.init = function () {

            chrome.runtime.sendMessage({
                type: 'GetXrm'
            }, function (_xrm) {

                if (_xrm == null)
                    window.close();

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
                                                'EntityDefinitions?$select=LogicalName,EntitySetName,MetadataId'

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
                                        window.close();
                                }
                            }, function errorCallback(response) {
                                    window.close();
                            });

                    });

            });

        },
            $scope.GetSolutionDetails = function (item, arrayElement) {
                var oDataUrl = Xrm + '/api/data/v9.1/';
                $http(
                    {
                        method: 'GET',
                        url: oDataUrl +
                            'solutioncomponents?$filter=componenttype eq 1 and objectid eq ' + item.MetadataId + '&$select=_solutionid_value&$expand=solutionid($select=friendlyname)'

                    })
                    .then(function successCallback(response) {

                        if (arrayElement === "attr") {
                            $scope.attributes = [];
                            $scope.solution = response.data.value;
                        }
                        else {
                            $scope.formdetails = [];
                            $scope.formeventdetails = [];
                            if (window.editor != null) {
                                window.editor.setValue('');
                                $scope.scriptName = '';
                            }
                            $scope.formsolution = response.data.value;
                        }
                    });
            },
            $scope.scrollDown = function (containername) {
                $location.hash(containername);
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
                $scope.showScriptDiv = value;
            },

            $scope.showAttributes = function () {

                if ($scope.inputText.item == null || $scope.inputSolution.item == null) {
                    alert("Select Entity and Solution. ");
                    return;
                }

                $scope.showPublish = true;
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

                if ($scope.inputFormEntity.item == null || $scope.inputFormSolution.item == null) {
                    alert("Select Entity and Solution. ");
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
                                            var functName = el.childNodes[l].childNodes[m].attributes["functionName"]?.value ?? "";
                                            var webresourceName = el.childNodes[l].childNodes[m].attributes["libraryName"]?.value ?? "";

                                            $scope.formeventdetails.push({
                                                "Event": eventName,
                                                "FunctName": functName,
                                                "Internal": handlerType,
                                                "WebResourceName": webresourceName,
                                                "FormName": forName,
                                            });

                                            console.log(results.data.value[k].name + "||" + el.attributes[0]?.value ?? ""
                                                + "||" + el.childNodes[l].childNodes[m].attributes["functionName"]?.value ?? "" + "||" +
                                                el.childNodes[l].childNodes[m].attributes["libraryName"]?.value ?? "");
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
                $window.open(Xrm + '/tools/systemcustomization/attributes/manageAttribute.aspx?attributeId=%7b' + attribute.MetadataId + '%7d&entityId=' + $scope.MetadataID + '&appSolutionId=' + $scope.inputSolution.item._solutionid_value, "popup", "width=500,height=500,left=10,top=150");
            },

            $scope.editForm = function (ev, formdetail) {
                $window.open(Xrm + '/main.aspx?pagetype=formeditor&etn=' + $scope.inputFormEntity.item.LogicalName + '&extraqs=formtype%3dmain%26formId%3d' + formdetail.FormId + '&appSolutionId=' + $scope.inputFormSolution.item._solutionid_value, "popup", "width=500,height=500,left=10,top=150");
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

                        $window.open(Xrm + '/main.aspx?etn=' + $scope.inputFormEntity.item.LogicalName + '&pagetype=webresourceedit&id=%7b' + results.data.value[0].webresourceid + '%7d' + '&appSolutionId=' + $scope.inputFormSolution.item._solutionid_value);
                    });

            }

        $scope.Publish = function () {
            $scope.isLoading = true;
            $scope.showTabs = false;
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
                    $scope.showTabs = true;
                });

        },

            $scope.GetScriptContent = function (ev, fromeventdetail) {
               
                var oDataUrl = Xrm + '/api/data/v9.1/';
                $scope.showDiv = false;
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
                            }).join(''));

                        if (window.webeditor != null)
                            window.webeditor.setValue('');
                        
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


            },

            $scope.GetScripts = function (prefixScript) {
                $scope.isLoading = true;
                $scope.showTabs = false;

                if (window.webeditor != null) {
                    window.webeditor.setValue('');
                    $scope.webscriptName = '';
                }


                $scope.webresources = [];

                if (prefixScript === null || prefixScript === "" || prefixScript === undefined) {
                    alert("Please enter prefix or script name");
                    $scope.isLoading = false;
                    $scope.showTabs = true;
                    return;
                }
                var oDataUrl = Xrm + '/api/data/v9.1/';

                $http({
                    method: 'GET',
                    url: oDataUrl +
                        'webresourceset?$select=name,displayname,webresourceid,content,createdon, modifiedon&$filter=(contains(name,\''+ prefixScript + '\')) and (webresourcetype eq 1 or webresourcetype eq 3)',
                    async: false
                })
                    .then(function successCallback(response) {
                        $scope.webresources = response.data.value;
                        $scope.isLoading = false;
                        $scope.showTabs = true;
                    });


            },

            $scope.GetWebScriptContent = function (ev, webresourceinfo) {
                var oDataUrl = Xrm + '/api/data/v9.1/';
                $scope.showScriptDiv = false;

                $scope.webscript = '';

                $scope.webscriptName = webresourceinfo.name;
                $scope.webscript =
                    decodeURIComponent(atob(webresourceinfo.content).split('').map(function (c) {
                        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                    }).join(''));

                if (window.editor != null) 
                        window.editor.setValue('');

                if (window.webeditor != null) {
                    require.config({ paths: { 'vs': 'https://unpkg.com/monaco-editor@0.11.1/min/vs/' } });
                    require(['vs/editor/editor.main'], function () {
                        window.webeditor.setValue($scope.webscript);
                    });
                }
                else {
                    require.config({ paths: { 'vs': 'https://unpkg.com/monaco-editor@0.11.1/min/vs/' } });
                    require(['vs/editor/editor.main'], function () {
                        window.webeditor = monaco.editor.create(document.getElementById('scriptcontainerid'), {
                            language: "javascript",

                            value: $scope.webscript
                        });
                    });
                }


            },

            $scope.ShowScript = function () {
                $scope.showDiv = false;
                $scope.showCompareDiv = true;
            };

    });

