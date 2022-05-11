var map = L.map('map', {
    minZoom:2,zoomControl: false 
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

/////////////////// fetch //////////////////
////// departement ///////////
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
  
/////////// densité communale //////////:

function getColor(d) {
    return  d > 0.552 ? '#034e7b' :
             d > 0.435 ? '#0570b0' :
              d > 0.299 ? '#3690c0' :
               d > 0.153  ? '#74a9cf' :
                d > 0.09 ? '#a6bddb' :
		         d > 0.048  ? '#d0d1e6' :
		    	                 '#f1eef6' ; 
}

function style(features) {
    return {
        fillColor: getColor(features.properties.dens_inond),
        weight: 0.5,
        opacity: 0.4,
        color: 'white',
        dashArray: '10',
        fillOpacity: 1
    };
}

fetch('inondationco', { credentials: 'include' })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        inond(data);
    });

function inond(donnees) {
    var inondations = L.geoJson(donnees, {
        style: style,
        onEachFeature: function (feature, inood) {
            inood.bindTooltip( feature.properties.nom_com + '<br> ' + "Densité d'inondation (km²) : " +
             feature.properties.dens_inond.substring(0,5)+ "<br>" + 
             "Nombre d'inondation : " + feature.properties.count);
        }
    });
  //inondations.addTo(map);

  //////////// timeline ///////////////

  fetch('inondationpt', { credentials: 'include' })
  .then(response => response.json())
  .then(inondtime => {
    console.log(inondtime);
    inondationtime(inondtime);
  });

  function inondationtime(inond) {
      var getInterval = function (alea) {
    var start_list = alea.properties.start.split('-');
    var start = new Date(start_list[0],start_list[1]); //,start_list[2]
    var end_list = alea.properties.end.split('-');
    var end = new Date(end_list[0],end_list[1]); //,end_list[2]+1
    return {
        start: start.setMonth(start.getMonth() -1),
        end: end.setMonth(end.getMonth() + 1)
    };
};

var slider = L.timelineSliderControl({
    duration : 100000,
    showTicks : true,
    formatOutput: function (date) {
      return moment(date).format("MM-YYYY"); //format de date de l'affichage
    },
  });
map.addControl(slider);

var timeline = L.timeline(inond, {
    getInterval: getInterval,
    pointToLayer: function (inond_pt, latlng) { 
      return L.circleMarker(latlng, {
        radius: inond_pt.properties.dens_inond * 50,
        color: '#13ba1a', //"hsl(" + hue + ", 100%, 50%)",
        fillColor: '#13ba1a', //"hsl(" + hue + ", 100%, 50%)",
        weight: 0.9
      }).bindPopup(
        inond_pt.properties.nom_com + ' ' +
        inond_pt.properties.yr_mn.substring(5,7)+ '/' +
        inond_pt.properties.yr_mn.substring(0,4)  +
        '<br>'+ "Densité d'inondations (km²) : " + Number(inond_pt.properties.dens_inond).toFixed(2)
        );
    },
}).addTo(map);

slider.addTimelines(timeline);

//////////////////////////////////////////
var inondpt = inond
var raw = [];

for (var i = 0; i < inondpt.features.length; i++) {
      var tmp = [];
      tmp [0] = inondpt.features[i].geometry.coordinates[1];
      tmp [1] = inondpt.features[i].geometry.coordinates[0];
      tmp [2] = inondpt.features[i].properties.intensite;
      //console.log(tmp);
      raw.push(tmp);
}
var inond_heatmap = L.heatLayer((raw),{
          minOpacity: 0.6,
          maxZoom: 12,
          max: 10.0,
          radius: 14,
          blur: 16
      });
//map.addLayer(inond_heatmap);

    ////////////////////////////

    var baseMaps = {
        "Satellite": ign,
        "Open Street Map": osm,
        "Terrain": stamen_terrain,
    }
    
    var overlayLayers = {
      "Départements": depart,
      "Densité communale" : inondations,
      "Carte de chaleur" : inond_heatmap,
      "Frise chronologique" : timeline
    
    };
    L.control.layers(baseMaps , overlayLayers, {collapsed : false}).addTo(map);
    
}
  }
}


//////////////// panneau de contrôle ////////////////


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

function manualPrint () {
  printer.printMap('CurrentSize', 'MyManualPrint')
};

//////// echelle //////////

L.control.scale({position : "topright"}).addTo(map);

/////sidebar

var sidebar = L.control.sidebar('sidebar').addTo(map);
