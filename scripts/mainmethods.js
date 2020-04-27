var Dynamics365 = {
    Xrm: undefined,
    formWindow: undefined
};
var count = 0;
var fet = "";
var entName = "";

var Originalfet = "";
var fetEnc = "";
var pluralName = "";

(function () {

    Dynamics365.WebApi = function (formWindow, Xrm) {
        count = 0;

        createDailog();

        Send_Request("EntityDefinitions?$select=LogicalName", true, 'GET', null,
            function (results) {
                var entitySelectDiag = document.getElementById("counterKriDialog");
                var inputtext = document.getElementById("counterKriInput");
                var Ok = document.getElementById("counterKriOk");
                var Cancel = document.getElementById("counterKriCancel");
                
                autocomplete(inputtext, results.value).then(() => {
                    Ok.onclick = function () {
                        closeDialog(entitySelectDiag).then(() => {
                            setTimeout(function () {
                                entName = inputtext.value;
                                document.body.removeChild(entitySelectDiag);
                                if (entName === null || entName === "") return;
                                fet = prompt("enter filter criteria", "Ex: filter=customertypecode eq 1");
                                if (entName === null || fet === null) return;
                                getCount("", Xrm);
                            }, 200);
                        });
                    };

                   
                    entitySelectDiag.showModal();
                    entitySelectDiag.click();

                });
            });
    };
    Dynamics365.FetchXml = function (formWindow, Xrm) {
        count = 0;


        createDailog();

        Send_Request("EntityDefinitions?$select=LogicalName", true, 'GET', null,
            function (results) {
                var entitySelectDiag = document.getElementById("counterKriDialog");
                var inputtext = document.getElementById("counterKriInput");
                var Ok = document.getElementById("counterKriOk");
                var Cancel = document.getElementById("counterKriCancel");

                autocomplete(inputtext, results.value).then(() => {
                    Ok.onclick = function () {
                        closeDialog(entitySelectDiag).then(() => {
                            setTimeout(function () {
                                try {
                                    entName = inputtext.value;
                                    document.body.removeChild(entitySelectDiag);
                                    if (entName === null || entName === "") return;

                                    Originalfet = fet = prompt("enter fetch xml", "Ex: Can be downloaded from advanced find");
                                    if (entName === null || fet === null) return;

                                    try
                                    {    
                                       pluralName = Send_Request("EntityDefinitions?$select=LogicalCollectionName&$filter=LogicalName eq '" + entName + "'", false, 'GET', null).value[0].LogicalCollectionName;
                                    }
                                    catch(err)
                                    {
                                        Xrm.Navigation.openAlertDialog({ confirmButtonLabel: "OK", text: "Selected Entity Name "+entName+" not found. " });
                                        return;
                                    }
                                    
                                    var parser = new DOMParser();
                                    xmlDoc = parser.parseFromString(fet, "text/xml");
                                    console.log("removing other attributes and adding id column");
                                    var removeAttributes = xmlDoc.getElementsByTagName("attribute");
                                    var iteration = removeAttributes.length;
                                    for (i = 0; i < iteration; i++) {
                                        removeAttributes[0].remove();
                                    }

                                    var removeOrderby = xmlDoc.getElementsByTagName("order");
                                    var orderByIteration = removeOrderby.length;
                                    for (i = 0; i < orderByIteration; i++) {
                                        removeOrderby[0].remove();
                                    }

                                    var addAttributes = xmlDoc.getElementsByTagName("entity");
                                    var newEle = xmlDoc.createElement("attribute");
                                    addAttributes[0].appendChild(newEle);
                                    newEle.setAttribute("name", entName + "id");
                                    fet = xmlDoc.getElementsByTagName("fetch")[0].outerHTML;

                                    countsAppend("");
                                }
                                catch (error) {
                                    Xrm.Navigation.openAlertDialog({ confirmButtonLabel: "OK", text: error.message });
                                }
                            }, 200);
                        });
                    };

                    
                    entitySelectDiag.showModal();
                    entitySelectDiag.click();

                });
            });
    }

    window.Dynamics365 = Dynamics365;

})();

window.addEventListener('message', function (event) {
    if (event.data.type) {
        var contentWindows = Array.from(document.querySelectorAll('iframe')).filter(function (d) {
            return d.style.visibility !== 'hidden'
        });

        if (event.source.Xrm.Internal.isUci && Xrm.Internal.isUci()) {
            Dynamics365.formWindow = window;
            Dynamics365.Xrm = window.Xrm;
            Dynamics365.clientUrl = Dynamics365.Xrm.Page.context.getClientUrl();
        }
        else if (contentWindows && contentWindows.length > 0) {
            Dynamics365.formWindow = contentWindows[0].contentWindow;
            Dynamics365.Xrm = Dynamics365.formWindow.Xrm;
            Dynamics365.clientUrl = Dynamics365.Xrm.Page.context.getClientUrl();
        }
        Dynamics365[event.data.type](Dynamics365.formWindow, Dynamics365.Xrm);
    }
});

function getCount(nextLink, Xrm) {

    return new Promise((resolve, reject) => {
        if (nextLink != null && nextLink != "") {
            var splitter = '$';
            var indexOf = nextLink.indexOf(splitter);


            Xrm.WebApi.retrieveMultipleRecords(entName, "?$" + nextLink.slice(indexOf + splitter.length), 5000).then(function success(result) {

                count += result.entities.length;
                Xrm.Utility.showProgressIndicator(entName + " Count: " + count);
                nextLink = result.nextLink;
                if (nextLink != undefined && nextLink != null && nextLink != "") {
                    getCount(nextLink, Xrm);
                }
                else {
                    Xrm.Utility.closeProgressIndicator();
                    setTimeout(function () { alert(entName + " Final Count :" + count); }, 200);
                }

            },
                function (error) {
                    Xrm.Navigation.openAlertDialog({ confirmButtonLabel: "OK", text: error.message });
                });
        }
        else {
            Xrm.WebApi.retrieveMultipleRecords(entName, "?$select=" + entName + "id&$" + fet, 5000).then(function success(result) {

                count += result.entities.length;
                Xrm.Utility.showProgressIndicator(entName + " Count: " + count);
                nextLink = result.nextLink;
                if (nextLink != undefined && nextLink != null && nextLink != "") {
                    getCount(nextLink, Xrm);
                }
                else {
                    Xrm.Utility.closeProgressIndicator();
                    setTimeout(function () { alert(entName + " Final Count :" + count); }, 200);
                }

            },
                function (error) {
                    Xrm.Navigation.openAlertDialog({ confirmButtonLabel: "OK", text: error.message });
                });
        }

        console.log(count);
        resolve();
    })
};

function Send_Request(parameters, async, method = 'GET', data, callback, isEscape) {


    var url = Xrm.Utility.getGlobalContext().getClientUrl() + "/api/data/v9.1/";
    if (isEscape == null) {
        url = encodeURI(url + parameters);
    }
    else if (isEscape) {
        url = encodeURI(url) + parameters;
    }


    var req = new XMLHttpRequest();
    req.open(method, url, async);
    req.setRequestHeader("Accept", "application/json");
    req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
    req.setRequestHeader("OData-MaxVersion", "4.0");
    req.setRequestHeader("OData-Version", "4.0");

    if (method === "GET") {
        req.setRequestHeader("Cache-Control", "no-cache");
        req.setRequestHeader("Prefer", "odata.include-annotations=*");
    }

    if (data) req.send(data);
    else req.send();

    if (async) {
        req.onreadystatechange = function () {
            if (req.readyState === 4)/*4 = Complete*/ {
                if (req.status === 201 || req.status === 200)/*200 = OK*/ {
                    var result = JSON.parse(req.response);
                    callback(result);
                }
                else {
                    Xrm.Navigation.openAlertDialog({ confirmButtonLabel: "OK", text: JSON.parse(req.response).error.message });
                }
            }
        }
    }
    else {
        if (req.readyState === 4)/*4 = Complete*/ {
            if (req.status === 201 || req.status === 200)/*200 = OK*/ {
                var result = JSON.parse(req.response);
                return result;
            }
            else {
                Xrm.Navigation.openAlertDialog({ confirmButtonLabel: "OK", text: JSON.parse(req.response).error.message });
            }
        }
    }
}

function countsAppend(pagingCookie) {

    try {
        var parserXML = new DOMParser();
        if (pagingCookie !== "") {

            var xmlDocCookie = parserXML.parseFromString(Originalfet, "text/xml");
            var removeAttributes = xmlDocCookie.getElementsByTagName("attribute");
            var iteration = removeAttributes.length;
            for (i = 0; i < iteration; i++) {
                removeAttributes[0].remove();
            }

            var removeOrderby = xmlDocCookie.getElementsByTagName("order");
            var orderByIteration = removeOrderby.length;
            for (i = 0; i < orderByIteration; i++) {
                removeOrderby[0].remove();
            }

            var addAttributes = xmlDocCookie.getElementsByTagName("entity");
            var newEle = xmlDocCookie.createElement("attribute");
            addAttributes[0].appendChild(newEle);
            newEle.setAttribute("name", entName + "id");
            var xmlDocEnc = parserXML.parseFromString(pagingCookie, "text/xml");
            var cookieDoc = parserXML.parseFromString(decodeURIComponent(decodeURIComponent(xmlDocEnc.getElementsByTagName("cookie")[0].attributes.pagingcookie.value)), "text/xml");
            var lastResult = cookieDoc.getElementsByTagName(entName + "id")[0].attributes.last.value;
            var firstResult = cookieDoc.getElementsByTagName(entName + "id")[0].attributes.first.value;

            var paggg = '&lt;cookie page=&quot;' + (++xmlDocEnc.getElementsByTagName("cookie")[0].attributes.pagenumber.value) + '&quot;&gt;&lt;' + entName + 'id last=&quot;' + lastResult + '&quot; first=&quot;' + firstResult + '&quot; /&gt;&lt;/cookie&gt;';
            xmlDocCookie.getElementsByTagName("fetch")[0].setAttribute('paging-cookie', paggg);
            xmlDocCookie.getElementsByTagName("fetch")[0].setAttribute('page', ++xmlDocEnc.getElementsByTagName("cookie")[0].attributes.pagenumber.value);
            fet = xmlDocCookie.getElementsByTagName("fetch")[0].outerHTML;

            fet = fet.split('\"').join("'");
            fet = fet.split('&amp;').join("&");
        }


        Send_Request(pluralName + "?fetchXml=" + encodeURIComponent(fet), true, 'GET', null, function (results) {

            count += results.value.length;
            Xrm.Utility.showProgressIndicator(entName + " Count: " + count);
            if (results["@Microsoft.Dynamics.CRM.fetchxmlpagingcookie"] === undefined) {
                Xrm.Utility.closeProgressIndicator();
                setTimeout(function () { alert(entName + " Final Count :" + count); }, 200);
            }
            else {
                var cookie = results["@Microsoft.Dynamics.CRM.fetchxmlpagingcookie"];
                countsAppend(cookie);
            }

        });
    }
    catch(error)
    {
        throw error;
    }
}


function createDailog() {
    var entitySelectDiag = document.createElement("DIALOG");
    entitySelectDiag.id = "counterKriDialog";
    entitySelectDiag.className = "counterKriDialog";
    

    var spantext = document.createElement("span");
    spantext.setAttribute("id", "counterKriSpan");
    spantext.className = "counterKriSpan";
    spantext.innerHTML = "Select Entity Name";
    entitySelectDiag.appendChild(spantext);

    var inputtext = document.createElement("input");
    inputtext.setAttribute("id", "counterKriInput");
    inputtext.className = "counterKriSelect";
    entitySelectDiag.appendChild(inputtext);

    var Ok = document.createElement("button");
    Ok.id = "counterKriOk";
    Ok.innerHTML = "OK";
    Ok.className = "counterKriOk";


    var Cancel = document.createElement("button");
    Cancel.id = "counterKriCancel";
    Cancel.innerHTML = "Cancel";
    Cancel.className = "counterKriCancel";
    Cancel.onclick = function () {
        entitySelectDiag.open = false;
        document.body.removeChild(entitySelectDiag);
    };

    entitySelectDiag.appendChild(Ok);
    entitySelectDiag.appendChild(Cancel);

    inputtext.addEventListener("keyup", function (event) {
        // Number 13 is the "Enter" key on the keyboard
        if (event.keyCode === 13) {

            event.preventDefault();
            // Trigger the button element with a click
            document.getElementById("counterKriOk").click();
        }
        if (event.keyCode === 27) {

            event.preventDefault();
            // Trigger the button element with a click
            document.getElementById("counterKriCancel").click();
        }
    });

    document.body.appendChild(entitySelectDiag);
}

function closeDialog(entitySelectDiag) {
    return new Promise((resolve, reject) => {
        entitySelectDiag.open = false;
        resolve();
    })
}

//https://www.w3schools.com/howto/howto_js_autocomplete.asp
function autocomplete(inp, arr) {

    return new Promise((resolve, reject) => {
        /*the autocomplete function takes two arguments,
        the text field element and an array of possible autocompleted values:*/
        var currentFocus;
        inp.select();
        /*execute a function when someone writes in the text field:*/
        inp.addEventListener("input", function (e) {
            var a, b, i, val = this.value;
            /*close any already open lists of autocompleted values*/
            closeAllLists();
            if (!val) { return false; }
            currentFocus = -1;
            /*create a DIV element that will contain the items (values):*/
            a = document.createElement("DIV");
            a.setAttribute("id", this.id + "autocomplete-list");
            a.setAttribute("class", "autocomplete-items");
            /*append the DIV element as a child of the autocomplete container:*/
            this.parentNode.appendChild(a);
            /*for each item in the array...*/
            for (i = 0; i < arr.length; i++) {
                /*check if the item starts with the same letters as the text field value:*/
                if (arr[i].LogicalName.substr(0, val.length).toUpperCase() == val.toUpperCase()) {
                    /*create a DIV element for each matching element:*/
                    b = document.createElement("DIV");
                    /*make the matching letters bold:*/
                    b.innerHTML = "<strong>" + arr[i].LogicalName.substr(0, val.length) + "</strong>";
                    b.innerHTML += arr[i].LogicalName.substr(val.length);
                    /*insert a input field that will hold the current array item's value:*/
                    b.innerHTML += "<input type='hidden' value='" + arr[i].LogicalName + "'>";
                    /*execute a function when someone clicks on the item value (DIV element):*/
                    b.addEventListener("click", function (e) {
                        /*insert the value for the autocomplete text field:*/
                        inp.value = this.getElementsByTagName("input")[0].value;
                        /*close the list of autocompleted values,
                        (or any other open lists of autocompleted values:*/
                        closeAllLists();
                    });
                    a.appendChild(b);
                }
            }
        });
        /*execute a function presses a key on the keyboard:*/
        inp.addEventListener("keydown", function (e) {
            var x = document.getElementById(this.id + "autocomplete-list");
            if (x) x = x.getElementsByTagName("div");
            if (e.keyCode == 40) {
                /*If the arrow DOWN key is pressed,
                increase the currentFocus variable:*/
                currentFocus++;
                /*and and make the current item more visible:*/
                addActive(x);
            } else if (e.keyCode == 38) { //up
                /*If the arrow UP key is pressed,
                decrease the currentFocus variable:*/
                currentFocus--;
                /*and and make the current item more visible:*/
                addActive(x);
            } else if (e.keyCode == 13) {
                /*If the ENTER key is pressed, prevent the form from being submitted,*/
                e.preventDefault();
                if (currentFocus > -1) {
                    /*and simulate a click on the "active" item:*/
                    if (x) x[currentFocus].click();
                }
            }
        });
        function addActive(x) {
            /*a function to classify an item as "active":*/
            if (!x) return false;
            /*start by removing the "active" class on all items:*/
            removeActive(x);
            if (currentFocus >= x.length) currentFocus = 0;
            if (currentFocus < 0) currentFocus = (x.length - 1);
            /*add class "autocomplete-active":*/
            x[currentFocus].classList.add("autocomplete-active");
        }
        function removeActive(x) {
            /*a function to remove the "active" class from all autocomplete items:*/
            for (var i = 0; i < x.length; i++) {
                x[i].classList.remove("autocomplete-active");
            }
        }
        function closeAllLists(elmnt) {
            /*close all autocomplete lists in the document,
            except the one passed as an argument:*/
            var x = document.getElementsByClassName("autocomplete-items");
            for (var i = 0; i < x.length; i++) {
                if (elmnt != x[i] && elmnt != inp) {
                    x[i].parentNode.removeChild(x[i]);
                }
            }
        }
        /*execute a function when someone clicks in the document:*/
        document.addEventListener("click", function (e) {
            closeAllLists(e.target);
        });
        resolve();
    })
}