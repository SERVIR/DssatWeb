var map = L.map('map');
var gcountry='';
var adm1='';
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

function load_charts(admin1){
    window.location.href=window.location.protocol
        +'//'+window.location.host
        +'/charts/'+admin1+'/';
}

function ajax_call(ajax_url, ajax_data) {
    //update database
    console.log(ajax_data);
    return $.ajax({
        type: "POST",
        headers: {'X-CSRFToken': getCookie('csrftoken')},
        url: ajax_url.replace(/\/?$/, '/'),
        dataType: "json",
        data: ajax_data
    })
        .fail(function (xhr, status, error) {
        });
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// ['#7f1a01', '#ac7726', '#c0eac3', '#2d88be', '#053399']
// Color from roma cmap https://www.fabiocrameri.ch/colourmaps-userguide/
// vik: ['#5b0108', '#b75a26', '#ebe6e2', '#116496', '#011462']
function getColor(d) {
    return d == 'Very Low' ? '#5b0108':
           d == 'Low' ? '#b75a26':
           d == 'Normal' ? "#ebe6e2":
           d == 'High' ? "#116496":
           d == 'Very High' ? "#011462":
           "#FFFFFF";
}

function yieldCatStyle(feature) {
    return {
        fillColor: getColor(feature.properties.pred_cat),
        weight: 2,
        opacity: 1,
        color: '#000000',
        // dashArray: '3',
        fillOpacity: 0.7
    }
}

function zoomToRegions(schema){
    var json_data={'schema':schema};
    var xhr = ajax_call('get-regions/',json_data);
 xhr.done(function(data){
     console.log(data)
     var geojson = L.geoJSON(
        data.rows,{
            onEachFeature: onEachFeature_regions,
            style: yieldCatStyle
        }
    ).addTo(map);
 });
}

// Legend to be added when country is clicked
var legend = L.control({position: 'topright'});
legend.onAdd = function (map) {

    var div = L.DomUtil.create('div', 'info legend'),
        labels = ['Very Low', 'Low', 'Normal', 'High', 'Very High'];

    // loop through our density intervals and generate a label with a colored square for each interval
    div.innerHTML += '<h5>Legend</h5>'
    for (var i = labels.length; i > 0; i--) {
        div.innerHTML +=
            '<i style="background:' + getColor(labels[i-1]) + '"></i> ' +
            labels[i-1]  + '<br>';
    }

    return div;
};

function whenClicked(e) {
    var country = e.target.feature.properties.country;
    gcountry = country;
    map.fitBounds(e.target.getBounds());
    zoomToRegions(country);
    legend.addTo(map)
}

function whenClicked_region(e){
    console.log(e.target.feature)
    var admin1 = e.target.feature.properties.admin1;
    var predCat = e.target.feature.properties.pred_cat;
    var predVal = Math.round(e.target.feature.properties.pred);
    var nitroRate = Math.round(e.target.feature.properties.nitro_rate);
    var ureaRate = Math.round(e.target.feature.properties.urea_rate);
    var refPeriod = e.target.feature.properties.ref_period;
    var plantingPeriod = e.target.feature.properties.planting_p;
    var obsAvg = Math.round(e.target.feature.properties.obs_avg)
    console.log(admin1);

    // var country = e.target.feature.properties.adm0_en;
    console.log(e.target.feature.properties);
    var str=[admin1,gcountry.toLowerCase().toString()].join('_');
    console.log(str)
    str="'"+str+"'";
    
    var popup = L.popup();
    popup.setLatLng(e.latlng)
         .setContent(
             '<h4>'+admin1+'</h4>'
             + '<h5>'+predVal+' kg/ha</h5>'
             + 'The season was simulated with planting dates during the '
             + plantingPeriod + ' period, and an average nitrogen rate of '
             + nitroRate + ' kg N / ha, which is equivalent to ' + ureaRate
             + ' kg of urea (46-0-0) per hectare. <b>An average yield of ' 
             + predVal + ' kg/ha</b> was obtained, which is a ' + predCat 
             + ' yield when compared to the average of the '
             + refPeriod + ' reference period (' + obsAvg + ' kg/ha). <br>'
             + '<br><center><button id="charts" class="btn btn-secondary"'
             + 'style="font-weight: bold; background: green"'
             + ' onclick="load_charts('+str+')">Explore simulations</button>')
        .openOn(map);
}

function onEachFeature(feature, layer) {
    //bind click
    layer.on({
        click: whenClicked
    });
}

function onEachFeature_regions(feature, layer) {
    layer.on({
        click: whenClicked_region
    })
}

var  country_layer = L.geoJSON(
    shp_obj, 
    {
        style: {
            weight: 2,
            opacity: 1,
            color: '#000000',  //Outline color
            fillOpacity: 0.2,
                strokeWidth: 0,
        },
    onEachFeature: onEachFeature,
        // onEachFeature: onEachFeature_country,
    });

country_layer.addTo(map);
map.fitBounds(country_layer.getBounds());


