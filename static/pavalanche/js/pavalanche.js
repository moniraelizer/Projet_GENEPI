var map = L.map('map', {
  minZoom: 2, zoomControl: false
});
var osmUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
var osmAttrib = 'Map data © OpenStreetMap contributors';
var osm = new L.TileLayer(osmUrl, { attribution: osmAttrib }).addTo(map);
map.setView([45.5, 4.5], 7);

var ign = L.tileLayer('https://wxs.ign.fr/choisirgeoportail/geoportail/wmts?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&STYLE=normal&TILEMATRIXSET=PM&FORMAT=image/jpeg&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}');
ign.addTo(map);

var stamen_terrain = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.{ext}', {
  attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  subdomains: 'abcd',
  minZoom: 0,
  maxZoom: 18,
  ext: 'png'
});
/////////////////// fetch ////////////////:
//// couche communes ////
function getColor(d) {
  return d > 1.273 ? '#084594' :
    d > 0.761 ? '#2171b5' :
      d > 0.491 ? '#4292c6' :
        d > 0.28 ? '#6baed6' :
          d > 0.162 ? '#9ecae1' :
            d > 0.075 ? '#c6dbef' :
              '#eff3ff';
}

function style(features) {
  return {
    fillColor: getColor(features.properties.dens_aval),
    weight: 0.5,
    opacity: 0.4,
    color: 'white',
    dashArray: '10',
    fillOpacity: 1
  };
}

fetch('avalanche', { credentials: 'include' })
  .then(response => response.json())
  .then(data => {
    console.log(data);
    aval(data);
  });

function aval(donnees) {
  var aval2 = L.geoJson(donnees, {
    style: style,
    onEachFeature: function (feature, avall) {
      avall.bindTooltip(feature.properties.nom_com + '<br>' + 
      "Densité au km² : " + feature.properties.dens_aval.substring(0,4)+ '<br>'+
      "Nombre d'avalanche sur la période : " + feature.properties.count);
    }
  });
  //aval2.addTo(map);

  ////// departement //////

  function styleDEP_ARA(feature) {
    return {
      fillColor: 'white',
      weight: 1,
      opacity: 0.5,
      color: 'black',
      dashArray: '3',
      fillOpacity: 0.1
    }
  };
  fetch('dep', { credentials: 'include' })
    .then(response => response.json())
    .then(dat => {
      console.log(dat);
      departement(dat);
    });

  function departement(depdo) {
    var depart = L.geoJson(depdo, {
      style: styleDEP_ARA,
    });
    depart.addTo(map);

    //////////// timeline ///////////////

    fetch('avalanchept', { credentials: 'include' })
      .then(response => response.json())
      .then(avaltime => {
        console.log(avaltime);
        avalanchetime(avaltime);
      });

    function avalanchetime(donnaval) {
      var getInterval = function (alea) {
        var start_list = alea.properties.date.split('-');
        var start = new Date(start_list[0], start_list[1]); //,start_list[2]
        var end_list = alea.properties.date.split('-');
        var end = new Date(end_list[0], end_list[1]); //,end_list[2]+1
        return {
          start: start.setMonth(start.getMonth() - 1),
          end: end.setMonth(end.getMonth() + 1)
        };
      };

      var slider = L.timelineSliderControl({
        duration: 100000,
        showTicks: true,
        formatOutput: function (date) {
          return moment(date).format("MM-YYYY");  //format de date de l'affichage
        },
      });
      map.addControl(slider);

      var aval_timeline = L.timeline(donnaval, {
        getInterval: getInterval,
        pointToLayer: function (aval_pt, latlng) {
          return L.circleMarker(latlng, {
            radius: aval_pt.properties.intensite * 5,
            color: 'blue', //"hsl(" + hue + ", 100%, 50%)",
            fillColor: 'blue' //"hsl(" + hue + ", 100%, 50%)",
          }).bindPopup(
            "Massif " + aval_pt.properties.massif + '<br>' +
            aval_pt.properties["sommet_sec"] + ' ' +
            '<br>' + "Date : " + aval_pt.properties.yr_mn.substring(5, 7) + '/' +
            aval_pt.properties.yr_mn.substring(0, 4) +
            '<br>' + "Risque MF : " + aval_pt.properties["risque_mf"]
          );
        },
      }).addTo(map);

      slider.addTimelines(aval_timeline);
      aval_timeline.bringToFront();


      //////////////////////////////////////////
      var aval_pt = donnaval
      var raw = [];

      for (var i = 0; i < aval_pt.features.length; i++) {
        var tmp = [];
        tmp[0] = aval_pt.features[i].geometry.coordinates[1];
        tmp[1] = aval_pt.features[i].geometry.coordinates[0];
        tmp[2] = aval_pt.features[i].properties.intensite;
        //console.log(tmp);
        raw.push(tmp);
      }
      var aval_heatmap = L.heatLayer((raw), {
        minOpacity: 0.6,
        maxZoom: 12,
        max: 10.0,
        radius: 14,
        blur: 16
      });
      //map.addLayer(aval_heatmap);
      ////////// couches ///////

      var baseMaps = {
        "Satellite": ign,
        "Open Street Map": osm,
        "Terrain": stamen_terrain
      }
      var overlayLayers = {
        "Départements": depart,
        "Densité communale": aval2,
        "Densité d'évènement": aval_heatmap,
        "Frise chronologique": aval_timeline

      };
      L.control.layers(baseMaps, overlayLayers, { collapsed: false }).addTo(map);
    }
  }
}
/////////////////////////////////////////////////////
//////////////// panneau de contrôle ////////////////
/////////////////////////////////////////////////////




/////// zoom /// 

L.control.zoom({
  position: 'topright'
}).addTo(map);


///// géocoder///////////
L.Control.geocoder().addTo(map);

/// position ////
L.geolet({ position: 'topright' }).addTo(map);


/// printer /// 

var printer = L.easyPrint({
  tileLayer: ign,
  position: 'topright',
  sizeModes: ['Current', 'A4Landscape', 'A4Portrait'],
  filename: 'myMap',
  exportOnly: true,
  hideControlContainer: true
}).addTo(map);

function manualPrint() {
  printer.printMap('CurrentSize', 'MyManualPrint')
};

//////// echelle //////////

L.control.scale({ position: "topright" }).addTo(map);

/////sidebar

var sidebar = L.control.sidebar('sidebar').addTo(map);
