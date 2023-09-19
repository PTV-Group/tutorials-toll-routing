$(document).ready(function () {
    const api_key = "YOUR_API_KEY";
    var markers = [];
    var coordinate = L.latLng(49, 8.4);
    var map = new L.Map('map', {
        center: coordinate,
        zoom: 9,
        zoomControl: false
    });
    L.control.zoom({
        position: 'bottomright'
    }).addTo(map);
    var tileLayer = new L.tileLayer(
        "https://api.myptv.com/rastermaps/v1/image-tiles/{z}/{x}/{y}?size={tileSize}",
        {
            attribution: "© " + new Date().getFullYear() + ", PTV Group, HERE",
            tileSize: 256,
            trackResize: false,
        },
        [
            { header: "apiKey", value: api_key },
    ]).addTo(map);
    map.on('click', onMapClick);

    addControls();
    addSummaryControl();
    addCostsResultControl();
    addSystemsResultControl();
    addSectionResultControl();
    addEventsResultControl();
    addDescriptionBanner();

    function onMapClick(e) {
        var icon = getIcon();
        var marker = L.marker(e.latlng, {icon: icon}).addTo(map);
        marker.on('contextmenu', removeMarker);
        markers.push(marker);
        fetchRoute();
    }
    function removeMarker(e) {
        map.eachLayer((layer) => {
            if (layer instanceof L.Marker && layer._latlng === e.latlng) {
                layer.remove();
            }
        });
        var marker = markers[markers.findIndex(marker => marker._latlng === e.latlng)]
        markers.splice(markers.findIndex(marker => marker._latlng === e.latlng), 1);
        if (marker.options.icon.options.iconUrl === "./icons/marker-red.svg") {
            colorLastMarkerRed();
        }
        fetchRoute();
    }
    function fetchRoute() {
        if (markers.length > 1) {
            fetch(
                "https://api.myptv.com/routing/v1/routes" + getTollQuery(),
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "apiKey": api_key
                    }
                })
                .then(response => response.json()
                    .then(result => {
                        clearResults();
                        displayPolyline(JSON.parse(result.polyline));
                        displayRoutingResults(result);
                    }));
        }
        else {
            clearResults();
            if (polylineLayer !== null) {
                map.removeLayer(polylineLayer);
            }
        }
    }
    function getTollQuery() {
        var tollQuery = "?results=POLYLINE";
        var tollResults = [];
        
        if (document.getElementById("TOLL_COSTS").checked) {
            tollResults.push("TOLL_COSTS");
        }
        if (document.getElementById("TOLL_SYSTEMS").checked) {
            tollResults.push("TOLL_SYSTEMS");
        }
        if (document.getElementById("TOLL_SECTIONS").checked) {
            tollResults.push("TOLL_SECTIONS");
        }
        if (document.getElementById("TOLL_EVENTS").checked) {
            tollResults.push("TOLL_EVENTS");
        }
        
        if (tollResults.length > 0) {
            tollQuery += "," + tollResults.join();
        }
        if (document.getElementById("vehicleProfile").value !== "") {
            tollQuery += "&profile=" + document.getElementById("vehicleProfile").value;
        }
        if (document.getElementById("currency").value !== "") {
            tollQuery += "&options[currency]=" + document.getElementById("currency").value;
        }
        if (document.getElementById("emissionStandard").value !== "") {
            tollQuery += "&vehicle[emissionStandard]=" + document.getElementById("emissionStandard").value;
        }
        if (document.getElementById("engineType").value !== "") {
            tollQuery += "&vehicle[engineType]=" + document.getElementById("engineType").value;
        }
        if (document.getElementById("co2EmissionClass").value !== "") {
            tollQuery += "&vehicle[co2EmissionClass]=" + parseInt(document.getElementById("co2EmissionClass").value);
        }
        if (document.getElementById("referenceTime").value !== "" && document.getElementById("referenceDate").value) {
            const date = new Date(document.getElementById('referenceDate').value + 'T' + document.getElementById('referenceTime').value).toISOString()
            tollQuery += "&options[startTime]=" + date
        }
        markers.forEach(marker => {
            tollQuery += "&waypoints=" + marker._latlng.lat + "," + marker._latlng.lng;
        });
        return tollQuery;
    } 
    function addControls() {
        const routingControl = L.control({ position: 'topleft' });
        routingControl.onAdd = function (map) {
            const div = L.DomUtil.create('div', 'routing-control');
            const html = `
            <h2>Toll Routing</h2>
            <div>
                <label for="vehicleProfile" style="display: block;">Vehicle Profile</label>
                <select name="vehicleProfile" id="vehicleProfile" style="display: block;">
                    <option value="">No Value</option>
                    <option value="EUR_TRAILER_TRUCK" selected>EUR_TRAILER_TRUCK</option>
                    <option value="EUR_TRUCK_40T">EUR_TRUCK_40T</option>
                    <option value="EUR_TRUCK_11_99T">EUR_TRUCK_11_99T</option>
                    <option value="EUR_TRUCK_7_49T">EUR_TRUCK_7_49T</option>
                    <option value="EUR_VAN">EUR_VAN</option>
                    <option value="EUR_CAR">EUR_CAR</option>
                    <option value="USA_8_SEMITRAILER_5AXLE">USA_8_SEMITRAILER_5AXLE</option>
                    <option value="USA_5_DELIVERY">USA_5_DELIVERY</option>
                    <option value="USA_1_PICKUP">USA_1_PICKUP</option>
                    <option value="AUS_LCV_LIGHT_COMMERCIAL">AUS_LCV_LIGHT_COMMERCIAL</option>
                    <option value="AUS_MR_MEDIUM_RIGID">AUS_MR_MEDIUM_RIGID</option>
                    <option value="AUS_HR_HEAVY_RIGID">AUS_HR_HEAVY_RIGID</option>
                    <option value="IMEA_TRUCK_40T">IMEA_TRUCK_40T</option>
                    <option value="IMEA_TRUCK_7_49T">IMEA_TRUCK_7_49T</option>
                    <option value="IMEA_VAN">IMEA_VAN</option>
                    <option value="IMEA_CAR">IMEA_CAR</option>
                </select>
            </div>
            <div>
                <label for="engineType" style="display: block;">Engine Type</label>
                <select name="engineType" id="engineType" style="display: block;">
                    <option value="">No Value</option>
                    <option value="COMBUSTION" selected>COMBUSTION</option>
                    <option value="ELECTRIC">ELECTRIC</option>
                    <option value="HYBRID">HYBRID</option>
                </select>
            </div>
            <div>
                <label for="emissionStandard" style="display: block;">Emission Standard</label>
                <select name="emissionStandard" id="emissionStandard" style="display: block;">
                    <option value="">No Value</option>
                    <option value="NONE">NONE</option>
                    <option value="EURO_0">EURO_0</option>
                    <option value="EURO_1">EURO_1</option>
                    <option value="EURO_2">EURO_2</option>
                    <option value="EURO_3">EURO_3</option>
                    <option value="EURO_4">EURO_4</option>
                    <option value="EURO_5" selected>EURO_5</option>
                    <option value="EURO_EEV">EURO_EEV</option>
                    <option value="EURO_6">EURO_6</option>
                    <option value="EURO_6C">EURO_6C</option>
                    <option value="EURO_6D_TEMP">EURO_6D_TEMP</option>
                    <option value="EURO_6D">EURO_6D</option>
                    <option value="EURO_6E">EURO_6E</option>
                    <option value="EURO_7">EURO_7</option>
                </select>
            </div>
            <div>
                <label for="co2EmissionClass" style="display: block;">Co2 Emission Class</label>
                <select name="co2EmissionClass" id="co2EmissionClass" style="display: block;">
                    <option value="">No Value</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                </select>
            </div>
            <div>
                <span>Start time</span>
                <table style="border: none;">
                    <tr>
                        <td height="20px" style="text-align:right; padding: 0px 5px 0px 0px; border: none;"><input type="date" id="referenceDate" value="2023-08-29"/></td>
                        <td height="20px" style="text-align:right; border: none;"><input type="time" id="referenceTime" value="12:00"/></td>
                    </tr>
                </table>
            </div>
            <div>
                <label for="currency" style="display: block;">Currency</label>
                <select name="currency" id="currency" style="display: block;">
                    <option value="">No Value</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="CHF">CHF</option>
                    <option value="PLN">PLN</option>
                    <option value="GBP">GBP</option>
                </select>
            </div>
            <div><input type="checkbox" id="TOLL_COSTS" checked><label for="TOLL_COSTS">TOLL_COSTS</label></div>
            <div><input type="checkbox" id="TOLL_SYSTEMS"><label for="TOLL_SYSTEMS">TOLL_SYSTEMS</label></div>
            <div><input type="checkbox" id="TOLL_SECTIONS"><label for="TOLL_SECTIONS">TOLL_SECTIONS</label></div>
            <div><input type="checkbox" id="TOLL_EVENTS"><label for="TOLL_EVENTS">TOLL_EVENTS</label></div>
    `;
            div.innerHTML = html;

            L.DomEvent.disableScrollPropagation(div);
            L.DomEvent.disableClickPropagation(div);

            return div;
        };
        routingControl.addTo(map);
        document.getElementById("TOLL_COSTS").addEventListener("click", fetchRoute);
        document.getElementById("TOLL_SYSTEMS").addEventListener("click", fetchRoute);
        document.getElementById("TOLL_SECTIONS").addEventListener("click", fetchRoute);
        document.getElementById("TOLL_EVENTS").addEventListener("click", fetchRoute);
        document.getElementById("vehicleProfile").addEventListener("change", fetchRoute);
        document.getElementById("emissionStandard").addEventListener("change", fetchRoute);
        document.getElementById("engineType").addEventListener("change", fetchRoute);
        document.getElementById("referenceTime").addEventListener("change", fetchRoute);
        document.getElementById("referenceDate").addEventListener("change", fetchRoute);
        document.getElementById("currency").addEventListener("change", fetchRoute);
        document.getElementById("co2EmissionClass").addEventListener("change", fetchRoute);
    }
    function getIcon() {
        if (markers.length === 0) {
            return L.icon({
                iconUrl: './icons/marker-green.svg',
                iconSize: [24, 60],
                iconAnchor: [12, 59]
            });
        }
        if (markers.length > 1) {
            colorLastMarkerBlue();
        }
        return L.icon({
            iconUrl: './icons/marker-red.svg',
            iconSize: [24, 60],
            iconAnchor: [12, 59]
        });
    }
    function colorLastMarkerBlue() {
        var marker = markers.pop();
        map.eachLayer((layer) => {
            if (layer instanceof L.Marker && layer._latlng === marker._latlng) {
                layer.remove();
            }
        });
        var icon = L.icon({
            iconUrl: './icons/marker.svg',
            iconSize: [24, 60],
            iconAnchor: [12, 59]
        });
        var newMarker = L.marker(marker._latlng, {icon: icon}).addTo(map);
        newMarker.on('contextmenu', removeMarker)
        markers.push(newMarker);
    }
    function colorLastMarkerRed() {
        if (markers.length > 1) {
            var marker = markers.pop();
            map.eachLayer((layer) => {
                if (layer instanceof L.Marker && layer._latlng === marker._latlng) {
                    layer.remove();
                }
            });
            var icon = L.icon({
                iconUrl: './icons/marker-red.svg',
                iconSize: [24, 60],
                iconAnchor: [12, 59]
            });
            var newMarker = L.marker(marker._latlng, {icon: icon}).addTo(map);
            newMarker.on('contextmenu', removeMarker)
            markers.push(newMarker);
        }
    }

    // UI controls
    function addSummaryControl() {
        const summaryControl = L.control({ position: 'topleft' });
        summaryControl.onAdd = function (map) {
            const div = L.DomUtil.create('div', 'summary-control');
            const html = `
            <h2>Summary</h2>
            <div id="summaryTableWrapper">
                <table id="summaryTable"></table>
            </div>
        `;
            div.innerHTML = html;

            L.DomEvent.disableScrollPropagation(div);
            L.DomEvent.disableClickPropagation(div);

            return div;
        };
        summaryControl.addTo(map);
    }
    function addCostsResultControl() {
        const resultControl = L.control({ position: 'topleft' });
        resultControl.onAdd = function (map) {
            const div = L.DomUtil.create('div', 'result-control-left');
            const html = `
            <h2>Toll Costs</h2>
            <div id="tollReportTableWrapper">
                <table id="tollCostsTable"></table>
            </div>
        `;
            div.innerHTML = html;

            L.DomEvent.disableScrollPropagation(div);
            L.DomEvent.disableClickPropagation(div);

            return div;
        };
        resultControl.addTo(map);
    }
    function addSectionResultControl() {
        const resultControl = L.control({ position: 'topright' });
        resultControl.onAdd = function (map) {
            const div = L.DomUtil.create('div', 'result-control');
            const html = `
            <h2>Toll Sections</h2>
            <div id="tollReportTableWrapper">
                <table id="tollSectionsTable"></table>
            </div>
        `;
            div.innerHTML = html;

            L.DomEvent.disableScrollPropagation(div);
            L.DomEvent.disableClickPropagation(div);

            return div;
        };
        resultControl.addTo(map);
    }
    function addSystemsResultControl() {
        const resultControl = L.control({ position: 'topright' });
        resultControl.onAdd = function (map) {
            const div = L.DomUtil.create('div', 'result-control');
            const html = `
            <h2>Toll Systems</h2>
            <div id="tollReportTableWrapper">
                <table id="tollSystemsTable"></table>
            </div>
        `;
            div.innerHTML = html;

            L.DomEvent.disableScrollPropagation(div);
            L.DomEvent.disableClickPropagation(div);

            return div;
        };
        resultControl.addTo(map);
    }
    function addEventsResultControl() {
        const resultControl = L.control({ position: 'topright' });
        resultControl.onAdd = function (map) {
            const div = L.DomUtil.create('div', 'result-control');
            const html = `
            <h2>Toll Events</h2>
            <div id="tollReportTableWrapper">
                <table id="tollEventsTable"></table>
            </div>
        `;
            div.innerHTML = html;

            L.DomEvent.disableScrollPropagation(div);
            L.DomEvent.disableClickPropagation(div);

            return div;
        };
        resultControl.addTo(map);
    }
    function addDescriptionBanner() {
        const banner = L.control({ position: 'bottomleft' });
        banner.onAdd = function (map) {
            const div = L.DomUtil.create('div', 'banner');
            const html = `
            <p>
                Left click to add waypoints and right click to remove them.<br>
                The order of waypoints is determined by the order of clicks.
            </p>
        `;
            div.innerHTML = html;

            L.DomEvent.disableScrollPropagation(div);
            L.DomEvent.disableClickPropagation(div);

            return div;
        };
        banner.addTo(map);
    }

    // display result
    var polylineLayer = null;
    function displayPolyline(polyline) {
        if (polylineLayer !== null) {
            map.removeLayer(polylineLayer);
        }
    
        var myStyle = {
            "color": '#2882C8',
            "weight": 5,
            "opacity": 0.65
        };
    
        polylineLayer = L.geoJSON(polyline, {
            style: myStyle
        }).addTo(map);
    
        map.fitBounds(polylineLayer.getBounds());
    }
    function displayRoutingResults(result) {
        const sections = result.toll.sections;
        const costs = result.toll.costs;
        const events = result.events;
        const systems = result.toll.systems;

        clearResults();

        displaySummary(result);

        if (costs) {
            displayTollCostsResult(costs);
        }
        if (sections) {
            displayTollSections(sections);
        }
        if (systems) {
            displayTollSystems(systems);
        }
        if (events) {
            displayTollEvents(events);
        }
    }
    function displaySummary(result) {
        $("#summaryTable").append($.parseHTML(getRow(["Distance", convertDistance(result.distance)])));
        $("#summaryTable").append($.parseHTML(getRow(["Travel Time", convertTime(result.travelTime)])));
    }
    function displayTollCostsResult(tollCosts) {
        $("#tollCostsTable").append($.parseHTML(getRow(["Country", "Price"])));
        tollCosts.countries.forEach(country => {
            var price;
            if (country.convertedPrice) {
                price = (+country.convertedPrice.price).toFixed(2) + " " + country.convertedPrice.currency;
            } else {
                price = (+country.price.price).toFixed(2) + " " + country.price.currency;
            }
            $("#tollCostsTable").append($.parseHTML(getRow([country.countryCode, price])));
        });
        var total;
        if (tollCosts.convertedPrice) {
            total = tollCosts.convertedPrice.price + " " + tollCosts.convertedPrice.currency;
        } else if (tollCosts.prices.length === 1) {
            total = tollCosts.prices[0].price + " " + tollCosts.prices[0].currency;
        } else {
            total = "";
            tollCosts.prices.forEach(price => {
                total += "<li>" + price.price + " " + price.currency + "</li>"
            });
            total = "<ul>" + total + "</ul>";
        }
        $("#tollCostsTable").append($.parseHTML(getRow(["Total", total])));
    }
    function displayTollSystems(tollSystems) {
        $("#tollSystemsTable").append($.parseHTML(getRow(["Name", "Operator"])));
        tollSystems.forEach(system => {
            $("#tollSystemsTable").append($.parseHTML(getRow([system.name, system.operatorName])));
        })
    }
    function displayTollSections(sections) {
        $("#tollSectionsTable").append($.parseHTML(getRow(["Section", "Price"])));
        sections.forEach((section) => {
            let price = 0;
            let currency = "";
            if (section.costs[0].convertedPrice) {
                price = (+section.costs[0].convertedPrice.price).toFixed(2);
                currency = section.costs[0].convertedPrice.currency;
            } else {
                section.costs.forEach((c) => {
                    
                });
                price = (+section.costs[0].price).toFixed(2);
                currency = section.costs[0].currency;
            }
            $("#tollSectionsTable").append($.parseHTML(getRow([section.displayName, price + " " +  currency])));
        });
    }
    function displayTollEvents(events){
        $("#tollEventsTable").append($.parseHTML(getRow(["Country", "Name", "Event"])));
        events.forEach(event => {
            $("#tollEventsTable").append($.parseHTML(getRow([event.countryCode, event.toll.displayName, event.toll.accessType])));
        });
    }
    function getRow(columns) {
        var row = '';
        columns.forEach(col => {
            row += '<td>' + col + '</td>'
        });
        return '<tr>' + row + '</tr>'
    }
    function clearResults() {
        $("#summaryTable").empty();
        $("#tollCostsTable").empty();
        $("#tollSystemsTable").empty();
        $("#tollSectionsTable").empty();
        $("#tollEventsTable").empty();
    }
});