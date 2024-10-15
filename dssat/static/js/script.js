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

function zoomToRegions(schema){
    var json_data={'schema':schema};
    var xhr = ajax_call('get-regions/',json_data);
 xhr.done(function(data){
     console.log(data)
     var geojson = L.geoJSON(data.rows,{onEachFeature: onEachFeature_regions}).addTo(map);
 });
}

function whenClicked(e) {
    var country = e.target.feature.properties.country;
    gcountry = country;
    map.fitBounds(e.target.getBounds());
    zoomToRegions(country)
}

function whenClicked_region(e){
    console.log(e.target.feature)
    var admin1 = e.target.feature.properties.admin1;
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
             +'Clicking on the following button will show the baseline charts and allow you to work with yield, anomaly and stress charts.'
             + '<br><br><center><button id="charts" class="btn btn-secondary" onclick="load_charts('+str+')">Load charts</button>')
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
