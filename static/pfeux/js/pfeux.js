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


////////////////// fencth ///////////////////////:

function getColor(p) {
  return p > 2.286 ? '#b10026' :
    p > 1.21 ? '#e31a1c' :
      p > 0.724 ? '#fc4e2a' :
        p > 0.429 ? '#fd8d3c' :
          p > 0.227 ? '#feb24c' :
            p > 0.103 ? '#fed976' :
              '#ffffb2';
}

function style(features) {
  return {
    fillColor: getColor(features.properties.dens_feux),
    weight: 0.5,
    opacity: 0.4,
    color: 'white',
    dashArray: '10',
    fillOpacity: 1
  };
}

fetch('feuxforetco', { credentials: 'include' })
  .then(response => response.json())
  .then(data => {
    console.log(data);
    feux(data);
  });

function feux(donnees) {
  var feuxdensi = L.geoJson(donnees, {
    style: style,
    onEachFeature: function (feature, feuxx) {
      feuxx.bindTooltip(feature.properties.nom_com + '<br>' + ' ' + "Densité : "+
        feature.properties.dens_feux.substring(0, 4) + " par km²" + '<br>' +
       "Nombre d'évènement : " + feature.properties.count);
    }
  });
  //feuxdensi.addTo(map);

  //////// timeline //////

  fetch('feuxforet', { credentials: 'include' })
    .then(response => response.json())
    .then(dat => {
      console.log(dat);
      feuxt(dat);
    });
  function feuxt(donn) {
    var getInterval = function (alea) {
      var start_list = alea.properties.start.split('-');
      var start = new Date(start_list[0], start_list[1]); //,start_list[2]
      var end_list = alea.properties.end.split('-');
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
        return moment(date).format("MM-YYYY"); //format de date de l'affichage
      },
    });
    map.addControl(slider);

    var feuxTimeline2 = L.timeline(donn, {
      getInterval: getInterval,
      pointToLayer: function (feux_pt, latlng) {
        return L.circleMarker(latlng, {
          radius: feux_pt.properties.sbrulee_m2 / 10000,
          color: 'red', //"hsl(" + hue + ", 100%, 50%)",
          fillColor: 'red' //"hsl(" + hue + ", 100%, 50%)",
        }).bindPopup(
          feux_pt.properties.nom_com + ' ' +
          feux_pt.properties.annee_mois.substring(5, 7) + '/' +
          feux_pt.properties.annee_mois.substring(0, 4) +
          '<br>' + feux_pt.properties.sbrulee_m2 +
          "m² " + 'brulées'
        );
      },
    }).addTo(map);

    slider.addTimelines(feuxTimeline2);

    ////////////// heatmap//////////////
    var feux_pt = donn
    var raw = [];

    for (var i = 0; i < feux_pt.features.length; i++) {
      var tmp = [];
      tmp[0] = feux_pt.features[i].geometry.coordinates[1];
      tmp[1] = feux_pt.features[i].geometry.coordinates[0];
      tmp[2] = feux_pt.features[i].properties.count;
    //  console.log("feux")
     // console.log(tmp);
      raw.push(tmp);
    }
    var heat_map = L.heatLayer((raw), {
      minOpacity: 0.6,
      maxZoom: 12,
      max: 10.0,
      radius: 14,
      blur: 16
    });

    console.log("heat_map")
    console.log(heat_map)
    //map.addLayer(heat_map);

    ////////// dep///////////////
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
        //   onEachFeature: function (feature, gaspaa) {
        //    gaspaa.bindTooltip(feature.properties.nombre_cat);
      });
      depart.addTo(map);

      ///// couches /////

      var baseMaps = {
        "Satellite": ign,
        "Open Street Map": osm,
        "Terrain": stamen_terrain
      }
      var overlayLayers = {
        "Départements": depart,
        "Densité communale": feuxdensi,
        "Densité d'évènement": heat_map,
        "Frise chronologique": feuxTimeline2


      };
      L.control.layers(baseMaps, overlayLayers, { collapsed: false }).addTo(map);

    }
  }
}


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


