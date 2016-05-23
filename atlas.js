//https://blogs.bing.com/maps/2015/03/05/accessing-the-bing-maps-rest-services-from-various-javascript-frameworks/

var tombio;

(function () {
    tombio = {
        "hosturl" : null,
        "bingkey": "AohiH9ycRkNP1nZ-7x3vDHHCBVFSVoXooCfSx9mirbs5DQrlyzc9Wf-XQr-wbM09",
        "centre": null,
        "app": null,
        "map": null,
        "layers": [],
        "gridLayer": null,
        "selectedgrid": null,
        "atlasSummaryLayer": null,
        "selectedatlasSummary": null,
        "selectedatlasSummaryLabel": "",
        "selectedSubselect": "",
        precisionLevel: "tetrad",
        "summaryStyle": null,
        "summaryStyles": [],
        "gridStyle": null,
        "gridStyles": []
    }

    tombio.centre = [
        tombioinitextent[0] + (tombioinitextent[2] - tombioinitextent[0]) / 2,
        tombioinitextent[1] + (tombioinitextent[3] - tombioinitextent[1]) / 2
    ]

    var getUrl = window.location;
    tombio.hosturl = getUrl.protocol + "//" + getUrl.host

    //console.log(tombio.hosturl);
})();

jQuery(document).ready(function () {

    jQuery.get("/sites/maps/atlasv1/atlas-import.html?ver=" + tombiover, function (data) {

        //Insert contents of general atlas-import.html
        jQuery("#tombiobigdiv").html(data);

        jQuery.get(tombioatlasoverview + "?ver=" + tombiover, function (data) {
            //Insert contents of atlas specific overview
            jQuery("#tombioAtlasOverview").html(data);
        });

        if (typeof tombiousingextend !== 'undefined' && tombiosubselect != "") {
            jQuery.get(tombiousingextend + "?ver=" + tombiover, function (data) {
                //Insert contents of usage extent file
                jQuery("#tombioUsingExtend").html(data);
            });
        }

        initAtlas();
    });
});

function initAtlas() {

    jQueryStyling();

    prepareBasemapLayers();

    prepareMap();

    //Initialise the summary display styles and stuff needed forhighlighting
    setStyles();

    // Display constant layers
    displayConstantLayers();

    //Download button
    jQuery("#export-png").button();
    var exportPNGElement = document.getElementById('export-png');

    if ('download' in exportPNGElement) {
        exportPNGElement.addEventListener('click', function (e) {
            tombio.map.once('postcompose', function (event) {
                var canvas = event.context.canvas;
                exportPNGElement.href = canvas.toDataURL('image/png');
            });
            tombio.map.renderSync();
        }, false);
    } else {
        jQuery("#export-png").hide();
    }
}

function jQueryStyling() {

    jQuery("#bannerImage")
        .attr("src", tombiobannerimg)
        .attr("alt", tombiobannertext)
        .attr("title", tombiobannertext);

    jQuery(window).resize(function () {
       
        //This is for friendly resising of the maps selection dropdown
        //for mobile devices
        if (jQuery("canvas").width() < 314) {
            jQuery("#atlasSummary-button").removeClass("summaryFixed");
            jQuery("#atlasSummary-button").addClass("summary100");
        } else {
            jQuery("#atlasSummary-button").removeClass("summary100");
            jQuery("#atlasSummary-button").addClass("summaryFixed");
        }
    });

    jQuery("#squareinfo").hide();

    jQuery("#gazControls").dialog({
        title: "Gazetteer - find a place",
        modal: true,
        autoOpen: false,
        height: 130,
        width: 430,
        show: {
            effect: "slideDown",
            duration: 500
        },
        hide: {
            effect: "explode",
            duration: 500
        }
    })

    jQuery("#tombioInfoDialog").dialog({
        title: "General information",
        modal: true,
        width: 650,
        height: 500,
        resizable: false,
        draggable: true,
        autoOpen: false,
        open: function () {
            jQuery("#tombioInfoAccordion")
                .accordion({
                    heightStyle: 'fill'
                });
        },
        show: {
            effect: "slideDown",
            duration: 500
        },
        hide: {
            effect: "explode",
            duration: 500
        }
    });

    jQuery("#tombioOptionsDialog").dialog({
        title: "Options",
        modal: false,
        width: 500,
        height: 520,
        resizable: true,
        draggable: true,
        autoOpen: false,
        show: {
            effect: "slideDown",
            duration: 500
        },
        hide: {
            effect: "explode",
            duration: 500
        }
    });
  
    jQuery('#gridLabels').click(function () {   
        displayGridLayer();
    });

    jQuery("#mapBase").selectmenu({
        change: function (event, data) {
            displayBasemap(data.item.value);
        }
    });

    jQuery("#mapGrid").selectmenu({
        change: function (event, data) {
            tombio.selectedgrid = data.item.value;
            displayGridLayer();
        }
    });

    jQuery("#atlasSummaryLabel").selectmenu({
        change: function (event, data) {
            tombio.selectedatlasSummaryLabel = data.item.value;
            displayatlasSummary();
        }
    });
    
    var subsel = jQuery("#atlasSubselect").selectmenu({
        change: function (event, data) {
            tombio.selectedSubselect = data.item.value;
            displayatlasSummary();
        }
    });
    //Dynamically add options to subselect and
    //or hide completely.
    if (typeof tombiosubselect === 'undefined' || tombiosubselect == "") {
        subsel.selectmenu("widget").hide();
    } else {
        jQuery.get(tombiosubselect, function (data) {
            var lines = data.split("\n");
            var optionList = [];
            for (var i = 0, len = lines.length; i < len; i++) {

                var sublab = lines[i].split(",")[0].trim();
                var subval = lines[i].split(",")[1].trim();
                optionList.push("<option value='" + subval + "'>" + sublab + "</option>");

                //Init selectedSubselect
                if (i == 0) tombio.selectedSubselect = subval;
            }
            $("#atlasSubselect").html(optionList).selectmenu('refresh', true);
        });
    }

    jQuery("#precisionLevel").selectmenu({
        change: function (event, data) {
            tombio.precisionLevel = data.item.value;
            displayatlasSummary();
        }
    });
    
    //Can only change the background and border of *all* dialogs with css since jquery makes
    //the div, e.g. #tombioInfoDialog, a child of the dialog and there's no CSS selector 
    //for parent, but there is a way of getting parent with jQuery.
    jQuery("#tombioInfoDialog").parent().css("background", "none").css("border", 0);

    jQuery('#tombioInfoButton')
      .button({ icons: { primary: null, secondary: 'ui-icon-info20' } })
      .click(function (event) {
          jQuery("#tombioInfoDialog").dialog("open");
      });

    jQuery('#gazToggle')
      .click(function (event) {
          jQuery("#gazControls").dialog("open");
      });

    jQuery('#tombioOptionsButton')
      .button({ icons: { primary: null, secondary: 'ui-icon-options' } })
      .click(function (event) {
          jQuery("#tombioOptionsDialog").dialog("open");
      });

    jQuery("#mapDefSlider").slider({
        orientation: "vertical",
        range: "min",
        min: 0,
        max: 1,
        value: 1,
        step: 0.05,
        slide: function (event, ui) {
            setBackgroundDef(ui.value);
        }
    });

    jQuery("#gazSearch").addClass("ui-widget ui-widget-content ui-corner-all");

    //The above does not work when options dynamically changed
    jQuery("#gazSearchResults").selectmenu()
        .on('selectmenuchange', function () {
            relocateMap();
        });

    jQuery("#gazButton")
      .button()
      .text("Find place")
      .click(function (event) {
          gazSearch();
      });

    jQuery("#lastUpdatedText")
        .html("Last updated on " + tombiover.substring(0, 2) + "/" + tombiover.substring(2, 4) + "/" + tombiover.substring(4, 8))
        .addClass("ui-corner-all");
    
    jQuery("#atlasSummary").selectmenu({
        change: function (event, data) {
            tombio.selectedatlasSummary = data.item.value;
            displayatlasSummary();
        }
    }).selectmenu("menuWidget").css("height", "250px");

    jQuery.get(tombiotaxa + '?ver=' + tombiover, function (data) {
        var lines = data.split("\n");

        lines.forEach(function (taxon) {

            if (taxon != "") {
                
                var taxonSplit = taxon.split("(");
                var scientific = taxonSplit[0].trim();

                jQuery("#atlasSummary").append(jQuery("<option>").attr("value", scientific).text(taxon));
            }       
        });
        jQuery('#atlasSummary').selectmenu('refresh');
    });
}

function prepareBasemapLayers() {

    //Create background layers array
    tombio.styles = [
       'road',
       'aerial',
       'aerialWithLabels',
       'collinsBart',
       'ordnanceSurvey',
       'osm',
       'ocm',
       'stamen'
    ];
    var i, ii;
    for (i = 0; i < 5; i++) {
        tombio.layers.push(new ol.layer.Tile({
            visible: false,
            preload: Infinity,
            source: new ol.source.BingMaps({
                key: tombio.bingkey,
                imagerySet: tombio.styles[i],
                // use maxZoom 19 to see stretched tiles instead of the BingMaps
                // "no photos at this zoom level" tiles
                maxZoom: 19
            })
        }))
    }
    tombio.layers.push(new ol.layer.Tile({
        visible: false,
        preload: Infinity,
        source: new ol.source.OSM({
            maxZoom: 19
        })
    }))

    tombio.layers.push(new ol.layer.Tile({
        visible: false,
        preload: Infinity,
        source: new ol.source.OSM({
            attributions: [
              new ol.Attribution({
                  html: 'All maps &copy; ' +
                      '<a href="http://www.opencyclemap.org/">OpenCycleMap</a>'
              }),
              ol.source.OSM.ATTRIBUTION
            ],
            url: 'http://{a-c}.tile.opencyclemap.org/cycle/{z}/{x}/{y}.png',
            maxZoom: 19
        })
    }))

    tombio.layers.push(new ol.layer.Tile({
        visible: false,
        preload: Infinity,
        source: new ol.source.Stamen({
            layer: 'watercolor',
            maxZoom: 19
        })
    }))
    //tombio.layers.push(new ol.layer.Tile({
    //    visible: false,
    //    preload: Infinity,
    //    source: new ol.source.Stamen({
    //        layer: 'terrain-labels',
    //        maxZoom: 19
    //    })
    //}))

    //tombio.layers.push(new ol.layer.Tile({
    //    visible: false,
    //    preload: Infinity,
    //    source: new ol.source.OSM({
    //        attributions: [
    //          new ol.Attribution({
    //              html: 'All maps &copy; ' +
    //                  '<a href="http://www.opencyclemap.org/">OpenCycleMap</a>'
    //          }),
    //          ol.source.OSM.ATTRIBUTION
    //        ],
    //        url: 'https://[abc].tile.thunderforest.com/outdoors/{z}/{x}/{y}.png',
    //        maxZoom: 19
    //    })
    //}))

    //var l = new OpenLayers.Layer.OSM("OpenCycleMap", ['https://tile.thunderforest.com/cycle/${z}/${x}/${y}.png']);
}

function prepareMap() {

    // Create new map
    tombio.map = new ol.Map({
        controls: ol.control.defaults({
            //attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
            //    collapsible: false
            //})
            rotate: false
        }).extend([
            new ol.control.ZoomToExtent({
                extent: tombioinitextent,
                label: tombiozoomlabel
            })
        ]),
        layers: tombio.layers,
        // Improve user experience by loading tiles while dragging/zooming. Will make
        // zooming choppy on mobile or slow devices.
        loadTilesWhileInteracting: true,
        target: 'tombiomap',
        view: new ol.View({
            rotation: tombiomaprotation, 
            center: tombio.centre, 
            //extent: tombioinitextent,
            zoom: tombioinitzoom
        })
    });

    //Respond to map events
    tombio.map.on('pointermove', function (evt) {
        if (evt.dragging) {
            return;
        }
        var pixel = tombio.map.getEventPixel(evt.originalEvent);
        displayFeatureInfo(pixel);
    });
    tombio.map.on('click', function (evt) {
        displayFeatureInfo(evt.pixel);
    });
}

function setStyles() {

    //Summmary object styles
    tombio.summaryStyle = new ol.style.Style({
        fill: new ol.style.Fill({
            color: 'rgba(255, 0, 0, 0.2)'
        }),
        stroke: new ol.style.Stroke({
            color: 'rgba(0, 0, 0, 1)',
            width: 1
        }),
        text: new ol.style.Text({
            font: 'bold 14px Calibri,sans-serif',
            fill: new ol.style.Fill({
                color: '#000'
            }),
            stroke: new ol.style.Stroke({
                width: 3
            })
        })
    });
    tombio.summaryStyles = [tombio.summaryStyle];

    //Grid object styles
    tombio.gridStyle = new ol.style.Style({
        fill: new ol.style.Fill({
            color: 'rgba(255, 255, 255, 0)'
        }),
        stroke: new ol.style.Stroke({
            color: 'black',
            width: 1
        }),
        text: new ol.style.Text({
            font: 'bold 14px Calibri,sans-serif',
            fill: new ol.style.Fill({
                color: '#000'
            }),
            stroke: new ol.style.Stroke({
                color: 'yellow',
                width: 3
            })
        })
    });
    tombio.gridStyles = [tombio.gridStyle];

    //Highlighting styles
    tombio.highlightStyleCache = {};

    tombio.featureOverlay = new ol.layer.Vector({
        source: new ol.source.Vector(),
        map: tombio.map,
        style: function (feature, resolution) {
            //var text = resolution < 300 ? feature.get('GridRef') : '';
            var text = feature.get('GridRef');
            if (!tombio.highlightStyleCache[text]) {
                tombio.highlightStyleCache[text] = [new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: '#f00',
                        width: 3
                    }),
                    fill: new ol.style.Fill({
                        color: 'rgba(255,0,0,0.5)'
                    })
                })];
            }
            return tombio.highlightStyleCache[text];
        }
    });  
}

function setBackgroundDef(defValue) {
    for (var i=0; i < tombio.layers.length; i++){
        layer = tombio.layers[i];
        layer.setOpacity(defValue);
    }
}

function gazSearch() {

    console.log("search: " + jQuery("#gazSearch").val());
    
    var geocodeRequest = "http://dev.virtualearth.net/REST/v1/Locations?q=";
    geocodeRequest += jQuery("#gazSearch").val();
    geocodeRequest += " " + tombiogazconstraint + "&key=";
    geocodeRequest += tombio.bingkey;

    callGazSearchRestService(geocodeRequest, processGazSearchResults);
}

function callGazSearchRestService(request, callback) {
    jQuery.ajax({
        url: request,
        dataType: "jsonp",
        jsonp: "jsonp",
        success: function (r) {
            callback(r);
        },
        error: function (e) {
            alert(e.statusText);
        }
    });
}

function processGazSearchResults(data) {

    var options = [];
    for (var i = 0; i < data.resourceSets.length; i++) {
        for (var j = 0; j < data.resourceSets[i].resources.length; j++) {
            
            var match = data.resourceSets[i].resources[j];

            if (match.name.toLowerCase() != tombiogazconstraint + ", united kingdom") {
                console.log(match.name + " (" + match.entityType + ")" + match.point.coordinates);

                var minx = match.bbox[1];
                var miny = match.bbox[0];
                var maxx = match.bbox[3];
                var maxy = match.bbox[2];

                var xCentre = match.point.coordinates[1];
                var yCentre = match.point.coordinates[0];

                options.push("<option value='" + ol.proj.transform([xCentre, yCentre], 'EPSG:4326', 'EPSG:3857') + "'>" + match.name + " (" + (j+1) + ")" + "</option>");
            }
        }
    }
    jQuery("#gazSearchResults")
        .find('option')
        .remove();
    jQuery('#gazSearchResults').selectmenu('destroy').selectmenu({ style: 'dropdown' });

    if (options.length > 0) {
        jQuery("#gazSearchResults").append(options.join(""));
        jQuery("#gazSearchResults").val(jQuery("#gazSearchResults option:first").val());
        jQuery('#gazSearchResults').selectmenu('refresh', true);

        relocateMap();
    } else {
        jQuery("#gazSearchResults").append(["<option>Not in Bing gazetteer</option>"]);
        jQuery("#gazSearchResults").val(jQuery("#gazSearchResults option:first").val());
        jQuery('#gazSearchResults').selectmenu('refresh', true);
    }

    //If only one result, remove dialog automatically
    if (options.length == 1) {
        $('#gazControls').dialog('close');
    }
}

function relocateMap() {
  
    var coords = jQuery("#gazSearchResults").val().split(",");
    console.log("coords are " + coords);
    tombio.map.getView().setCenter(coords);
    tombio.map.getView().setZoom(13); 
}

function displayFeatureInfo(pixel) {

    var feature = tombio.map.forEachFeatureAtPixel(pixel, function (feature, layer) {
        if (layer == tombio.atlasSummaryLayer) {
            return feature;
        }
    });

    if (feature) {
        jQuery("#squareinfo").show();
        jQuery("#sqref").html(feature.get('GridRef'));
        jQuery("#sqrecs").html(feature.get('Records'));
        jQuery("#sqspec").html(feature.get('Richness'));
    } else {

        jQuery("#squareinfo").hide();
    }
    
    if (feature !== tombio.highlight) {
        if (tombio.highlight) {
            tombio.featureOverlay.getSource().removeFeature(tombio.highlight);
        }
        if (feature) {
            tombio.featureOverlay.getSource().addFeature(feature);
        }
        tombio.highlight = feature;
    }
};

function displayBasemap(baseMap) {

    for (var i = 0, ii = tombio.layers.length; i < ii; ++i) {
        tombio.layers[i].setVisible(tombio.styles[i] === baseMap);
    }
}

function displayConstantLayers() {
    //Boundary layer
    //http://openlayers.org/en/v3.6.0/examples/vector-layer.html

    tombio.boundary = new ol.layer.Vector({
        title: 'Boundary layer',
        source: new ol.source.Vector({
            format: new ol.format.GeoJSON(),
            projection: 'EPSG:4326',
            url: tombio.hosturl + tombiobasemaps + 'boundary.' + geoext
        }),
        style: new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: 'black',
                width: 2
            }),
            fill: new ol.style.Fill({
                color: 'rgba(255,0,0,0)'
            })

        })
    });
    tombio.map.addLayer(tombio.boundary);

    //Thematic? https://www.e-education.psu.edu/geog585/node/728
}

function displayGridLayer() {

    //Remove grid layer if it already exists
    if (tombio.gridLayer) {
        tombio.map.removeLayer(tombio.gridLayer);
    }

    //Set gridLayer to null if none specified
    if (tombio.selectedgrid == null || tombio.selectedgrid == "none") {
        tombio.gridLayer = null;
        return;
    }

    var displayThreshold;
    if (!jQuery("#gridLabels").is(':checked')) {
        displayThreshold = 0;
    } else if (tombio.selectedgrid == "hectads") {
        displayThreshold = 500;
    } else if (tombio.selectedgrid == "quadrants") {
        displayThreshold = 300;
    } else if (tombio.selectedgrid == "tetrads") {
        displayThreshold = 100;
    } else if (tombio.selectedgrid == "monads") {
        displayThreshold = 30;
    }

    //Add grid layer
    tombio.gridLayer = new ol.layer.Vector({
        title: 'OS grid',
        source: new ol.source.Vector({
            format: new ol.format.GeoJSON(),
            projection: 'EPSG:4326',
            url: tombio.hosturl + tombiobasemaps + tombio.selectedgrid + '.' + geoext
        }),
        style: function(feature, resolution) {
            tombio.gridStyle.getText().setText(resolution < displayThreshold ? feature.get('GridRef') : '');
            return tombio.gridStyles;
        }
    })
    tombio.map.addLayer(tombio.gridLayer);
}

function displayatlasSummary() {

    //Remove species summary layer if it already exists
    if (tombio.atlasSummaryLayer) {
        tombio.map.removeLayer(tombio.atlasSummaryLayer);
    }

    //Set species summary to null if none specified
    if (tombio.selectedatlasSummary == null || tombio.selectedatlasSummary == "none") {
        tombio.atlasSummaryLayer = null;
        return;
    }

    //Set label attr
    var labelAttr;
    if (tombio.selectedatlasSummaryLabel == "records") {
        labelAttr = "Records";
    } else if(tombio.selectedatlasSummaryLabel == "species") {
        labelAttr = "Richness";
    }

    //Add sprintail summary layer
    var km;
    var displayThreshold;
    if (tombio.precisionLevel == "monad") {
        km = 1;
        displayThreshold = 100;
    } else if (tombio.precisionLevel == "tetrad") {
        km = 2;
        displayThreshold = 200;
    } else if (tombio.precisionLevel == "quadrant") {
        km = 5;
        displayThreshold = 500;
    } else {
        km = 10;
        displayThreshold = 500;
    }
    
    if (tombio.selectedSubselect == "") {
        var layerFolder = tombiolayers;
    } else {
        var layerFolder = tombiolayers + tombio.selectedSubselect + "/";
    }

    var layerName = tombio.hosturl + layerFolder;
    layerName += tombio.precisionLevel + '/';
    layerName += tombio.selectedatlasSummary + ' ' + km + ' km atlas.' + geoext;

    console.log("tombio.selectedSubselect: " + tombio.selectedSubselect);
    console.log("tombiolayers: " + tombiolayers);
    console.log("layerFolder: " + layerFolder);
    console.log("layerName: " + layerName);

    tombio.atlasSummaryLayer = new ol.layer.Vector({
        title: 'species summary',
        source: new ol.source.Vector({
            format: new ol.format.GeoJSON(),
            projection: 'EPSG:4326',
            url: layerName + '?ver=' + tombiover
        }),
        style: function (feature, resolution) {
            if (labelAttr) {
                tombio.summaryStyle.getText().setText(resolution < displayThreshold ? feature.get(labelAttr) : '');
            } else {
                tombio.summaryStyle.getText().setText('');
            };
            if (labelAttr == "Records") {
                tombio.summaryStyles[0].getText().getStroke().setColor("yellow");
            } else {
                tombio.summaryStyles[0].getText().getStroke().setColor("cyan");
            }
            return tombio.summaryStyles;
        }
    })
    tombio.map.addLayer(tombio.atlasSummaryLayer);
}