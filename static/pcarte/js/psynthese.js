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


//////////////// fetch ////////////////


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

    ////////// densite ////////
    function getColor(p) {
        return p > 0.1234 ? '#990000' :
            p > 0.0566 ? '#d7301f' :
                p > 0.0304 ? '#ef6548' :
                    p > 0.016 ? '#fc8d59' :
                        p > 0.0077 ? '#fdbb84' :
                            p > 0.0025 ? '#fdd49e' :
                                '#fef0d9';
    }

    function style(features) {
        return {
            fillColor: getColor(features.properties.dens_moy_a),
            weight: 0.5,
            opacity: 0.4,
            color: 'white',
            dashArray: '10',
            fillOpacity: 1
        };
    }

    fetch('synthesedensi', { credentials: 'include' })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            densi(data);
        });

    function densi(donnees) {
        var synthdensi = L.geoJson(donnees, {
            style: style,
            onEachFeature: function (feature, syt) {
                syt.bindTooltip(feature.properties.nom_com + "<br>" +
                 "Densité moyenne d'évènement par an : " + Number(feature.properties.dens_moy_a).toFixed(3) + "<br>" +
                 "Moyenne annuelle  : " + Number(feature.properties.moy_an).toFixed(2));
            }
        }).addTo(map);

///// qualit////

        function getColor(a) {
            return a >4 ? '#a50f15' :
                    a >3 ? '#de2d26' :
                        a >2 ? '#fb6a4a' :
                            a >1 ? '#fcae91' :
                                 '#fee5d9';
        }
    
        function styled(features) {
            return {
                fillColor: getColor(features.properties.nnn),
                weight: 0.5,
                opacity: 0.4,
                color: 'white',
                dashArray: '10',
                fillOpacity: 1
            };
        }
    
        fetch('synthesequalit', { credentials: 'include' })
            .then(response => response.json())
            .then(dat => {
                console.log(dat);
                densiq(dat);
            });
    
        function densiq(donne) {
            var synthqualit = L.geoJson(donne, {
                style: styled,
                onEachFeature: function (feature, syta) {
                    syta.bindTooltip(feature.properties.nom_com + "<br>" +
                     "Type d'aléa présent : " + feature.properties.alea + "<br>"+
                     "Nombre d'aléa : " + feature.properties.nnn);
                }
            });

            //// graphique////
        fetch('table_synthese', { credentials: 'include' })
        .then(response => response.json())
        .then(data => {
      
            
      var config = {
              type: 'line',
              data: {
                  labels: data['annee'],
                  datasets: [{
                      label: 'Mouvement de terrain',
                      backgroundColor: "black",
                      borderColor: "black",
                      fill: false,
                      data: data['mvt'],
                  },
                  {
                    label: 'Avalanche',
                    backgroundColor: "yellow",
                    borderColor: "yellow",
                    fill: false,
                    data: data['aval'],
                },
                {
                    label: 'Feux de forêts',
                    backgroundColor: "red",
                    borderColor: "red",
                    fill: false,
                    data: data['feux'],
                },
                {
                    label: 'Inondations',
                    backgroundColor: "blue",
                    borderColor: "blue",
                    fill: false,
                    data: data['inond'],
                },
                {
                    label: 'Tornades',
                    backgroundColor: "grey",
                    borderColor: "grey",
                    fill: false,
                    data: data['tornad'],
                }]
              },
              options: {
                  responsive: true,
                  title: {
                      display: true,
                      text: 'Communes touchées par année'
                  },
                  scales: {
                      xAxes: [{
                          display: true,
                scaleLabel: {
                  display: true,
                  labelString: 'Date'
                },
                  
                      }],
                      yAxes: [{
                          display: true,
                          //type: 'logarithmic',
                scaleLabel: {
                                  display: true,
                                  labelString: 'nbr de communes touchées'
                              },
                              ticks: {
                                  min: 0,
                                  max: 300,
                                  max: 300,
      
                                  // forces step size to be 5 units
                                  stepSize: 100
                              }
                      }]
                  }
              }
          };
                  var ctx = document.getElementById('canvas').getContext('2d');
              window.myLine = new Chart(ctx, config);
        });

var baseMaps = {
    "Satellite": ign, 
    "Open Street Map" : osm,
    "Terrain" : stamen_terrain
}
var overlayLayers = {
    "Départements": depart, 		// BaseMaps
    "Densité d'évènement moyen annuel" : synthdensi, // layers
    "Type d'aléas par commune" : synthqualit,
};
L.control.layers(baseMaps , overlayLayers, {collapsed : false}).addTo(map);
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

function manualPrint () {
  printer.printMap('CurrentSize', 'MyManualPrint')
};

//////// echelle //////////

L.control.scale({position : "topright"}).addTo(map);

/////sidebar

var sidebar = L.control.sidebar('sidebar').addTo(map);


//Mise en place de l'outil leaflet measure:

L.control.measure({
    primaryLengthUnit: 'meters', secondaryLengthUnit: 'kilometers',
    primaryAreaUnit: 'hectares', secondaryAreaUnit: 'sqmeters'

}).addTo(map);