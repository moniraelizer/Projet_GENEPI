var map = L.map('map', {
  minZoom: 5, zoomControl: false
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



/////////////////// Fetch POSTGIS ////////////////:

fetch('tornades', { credentials: 'include' })
  .then(response => response.json())
  .then(data => {
    console.log(data);
    torna(data);
  });

/// fonction timeline et heatmap///

function torna(donneest) {
  var getInterval = function (alea) {
    var start_list = alea.properties.start.split('-');
    var start = new Date(start_list[0], start_list[1]); //,start_list[2]
    var end_list = alea.properties.end.split('-');
    var end = new Date(end_list[0], end_list[1]); //,end_list[2]+1
    return {
      start: start.setMonth(start.getMonth() - 1),
      end: end.setMonth(end.getMonth() + 2)
    };
  };

  var slider = L.timelineSliderControl({
    duration: 100000,
    showTicks: true,
    formatOutput: function (date) {
      return moment(date).format("MM-YYYY"); //format de date de l'affichage
    },
  });
  map.addControl(slider);

  var tortime = L.timeline(donneest, {  /// ici on appelle les donnees de la fonction
    getInterval: getInterval,
    pointToLayer: function (tornades, latlng) {
      return L.circleMarker(latlng, {
        radius: tornades.properties.intensite * 5,
        color: 'red', 
        fillColor: 'red' 
      }).bindPopup(
        tornades.properties.yr_mn.substring(5,7)+ '/' +
        tornades.properties.yr_mn.substring(0,4)  + ' ' +
        '<br>' + "EF" + tornades.properties.echelle +
        " sur l'échelle de Fujita. "
      );
    },
  }).addTo(map);

  slider.addTimelines(tortime);

  //////////// heatmap fetch /////////////////

  var tornade = donneest
  var rawtor = [];

  for (var i = 0; i < tornade.features.length; i++) {
    console.log("geome_tornade")
    console.log(tornade.features[i])
    var tmp = [];
    tmp[0] = tornade.features[i].geometry.coordinates[1];
    tmp[1] = tornade.features[i].geometry.coordinates[0];
    tmp[2] = tornade.features[i].properties.intensite;
   // console.log("tornades")
   // console.log(tmp);
    rawtor.push(tmp);
  }

  var heat_map = L.heatLayer((rawtor), {
    minOpacity: 0.6,
    maxZoom: 12,
    max: 1.0,
    radius: 25,
    blur: 16
  });
 // console.log("heat_map")
 // console.log(heat_map)
 // heat_map.addTo(map);

  ////////// dep///////////////
  fetch('dep', { credentials: 'include' })
    .then(response => response.json())
    .then(dat => {
      console.log(dat);
      departement(dat);
    });


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

  function departement(depdo) {
    var depart = L.geoJson(depdo, {
      style: styleDEP_ARA,
    });
    depart.addTo(map);


    var baseMaps = {
      "Satellite": ign,
      "Open Street Map": osm,
      "Terrain": stamen_terrain
    }
    var overlayLayers = {
      "Départements": depart,
      "Densité d'évènement": heat_map,
      "Frise chronologique": tortime,
    };

    L.control.layers(baseMaps, overlayLayers, { position: 'topright', collapsed: false }).addTo(map);
  }
}
//////////////// panneau de contrôle ////////////////
/////// zoom ///////
L.control.zoom({
  position: 'topright'
}).addTo(map);

///// géocoder///////
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



