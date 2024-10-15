var gc;
//
// if(document.getElementById("spinner_button")){
//              document.getElementById("spinner_button").style.display = "none";
//
// }
function get_daps(){
    var daps=[];
    let tbl = document.getElementById("nitrogen_table").getElementsByTagName('tbody')[0];
    for(var i=0;i<tbl.rows.length;i++) {
        daps.push(parseInt(tbl.rows[i].cells[0].innerText));
    }
return daps;
}

function get_rates(){
  var rates=[];
    let tbl = document.getElementById("nitrogen_table").getElementsByTagName('tbody')[0];
    for(var i=0;i<tbl.rows.length;i++) {


        rates.push(parseInt(tbl.rows[i].cells[1].innerText));
    }
return rates;
}

const isObject = (obj) => {
  return typeof obj === 'object' && !Array.isArray(obj) && obj !== null;
}

const objToArray = (obj) => {
          return Object.keys(obj).map((key) => {
            return [
              key, isObject(obj[key]) ?
                objToArray(obj[key]) :
                obj[key]
            ];
          });
        }

function generate_charts() {
    document.getElementById("spinner_button").style.display = "block";
    document.getElementById("blur_div").style.display = "block";
    // var val_rate = document.getElementById('customRange2').value;
    // var val_dap = document.getElementById('customRange1').value;
    // if (val_dap && val_rate) {
    var planting_date;
    var daps = [];
    var rate = [];
    var cultivar;
    daps = get_daps();
    rate = get_rates();
    planting_date = $('#startDate').val();
    cultivar = $('#cultivar').val();

    console.log(planting_date);
    console.log(cultivar);
    console.log(daps);
    console.log(rate);
    if(daps.length===0)
        daps=[0]
    if(rate.length===0)
        rate=[0]
    var index = $("#stress_chart_water").data('highchartsChart');
    var water_chart = Highcharts.charts[index];
    index = $("#stress_chart_nitrogen").data('highchartsChart');
    var nitro_chart = Highcharts.charts[index];
    index = $("#column_chart").data('highchartsChart');
    var column_chart = Highcharts.charts[index];
    index = $("#anomaly_chart").data('highchartsChart');
    var anomaly_chart = Highcharts.charts[index];
    index = $("#chart").data('highchartsChart');
    var chart = Highcharts.charts[index];
    var json_data = {
        'nitrogen_rate': rate,
        'nitrogen_dap': daps,
        'cultivar': cultivar,
        'planting_date': planting_date,
        'dbname': 'dssatserv',
        'schema': admin1_country,
        'admin1': admin1,
    }
    var xhr = ajax_call('run-experiment/', json_data);
    xhr.done(function (data) {
        console.log(data);
        if(data.error.length===0) {
            //
            // var s = data.range_chart.series;
            // var series = [];
            //
            // for (var i = 0; i < s.length; i++) {
            //     var d = [];
            //     if(s[i].length>1) {
            //         console.log('iin if')
            //         for (var j = 0; j < s[i].length; j++) {
            //             d.push([s[i][j].data[0]['low'], s[i][j].data[0]['high']])
            //
            //         }
            //          s[i].data=[d];
            //     }
            //     else {
            //         d = [s[i].data[0]['low'], s[i].data[0]['high']]
            //         s[i].data = [d];
            //     }
            //     series.push(s[i])
            // }
            //
            // console.log(series)

            column_chart.addSeries(data.rdata, true);
            // anomaly_chart.update({
            //     xAxis: data.anomaly_chart.xAxis,
            //     yAxis: data.anomaly_chart.yAxis,
            //     series: data.anomaly_chart.series,
            // });
            nitro_chart.addSeries(data.stress_chart_nitrogen, true);
            water_chart.addSeries(data.stress_chart_water, true);
            document.getElementById("spinner_button").style.display = "none";
            document.getElementById("blur_div").style.display = "none";
        }
        else {
            alert('Error: '+data.error)
        }
    });
    // }
    // else{
    //     alert('Please select all parameters in order to generate charts')
    // }
};

function select_chart(btn){
    console.log(btn.id);
    if(btn.id==='yield'){
        document.getElementById('column_chart').style.display='block';
        document.getElementById('anomaly_chart').style.display='none';
    }
    if(btn.id==='anomaly'){
          document.getElementById('column_chart').style.display='none';
        document.getElementById('anomaly_chart').style.display='block';
    }
}
// function showVal_dap(val){
//         document.getElementById('nitro_dap').innerHTML=val;
// }
// function showVal_rate(val){
//         document.getElementById('nitro_rate').innerHTML=val;
// }

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

function addToBox() {
    var val_rate = document.getElementById('customRange2').value;
    var val_dap = document.getElementById('customRange1').value;
    if (val_dap && val_rate) {
        var tbodyRef = document.getElementById('nitrogen_table').getElementsByTagName('tbody')[0];

// Insert a row at the end of table
        var newRow = tbodyRef.insertRow();

// Insert a cell at the end of the row
        var newCell = newRow.insertCell();

// Append a text node to the cell
        var newText = document.createTextNode(val_dap);
        newCell.appendChild(newText);

        newCell = newRow.insertCell();

// Append a text node to the cell
        newText = document.createTextNode(val_rate);
        newCell.appendChild(newText);
        newCell = newRow.insertCell();
        var newButton = document.createElement("button");
        newButton.style='background: none;\n' +
            '\tcolor: inherit;\n' +
            '\tborder: none;\n' +
            '\tpadding: 0;\n' +
            '\tfont: inherit;\n' +
            '\tcursor: pointer;\n' +
            '\toutline: inherit;';
        newButton.innerHTML = '<i class="fa fa-remove" style="color:red"></i>';
        // newText = document.createTextNode('Delete');
        newCell.appendChild(newButton);
        newButton.onclick = function () {
   newButton.closest('tr').remove()
        };
    } else {
        alert('please enter values')
    }

}

function clear_charts() {
    var index = $("#stress_chart_water").data('highchartsChart');
    var water_chart = Highcharts.charts[index];
    index = $("#stress_chart_nitrogen").data('highchartsChart');
    var nitro_chart = Highcharts.charts[index];
    index = $("#column_chart").data('highchartsChart');
    var column_chart = Highcharts.charts[index];
    index = $("#anomaly_chart").data('highchartsChart');
    var anomaly_chart = Highcharts.charts[index];
    var xhr = ajax_call('clear-charts/', {});
    xhr.done(function (data) {
        console.log(data);
        if (data.error.length === 0) {
                //
    // var s = data.range_chart.series;
    // var series = [];
    //
    // for (var i = 0; i < s.length; i++) {
    //     var d = [];
    //     if(s[i].length>1) {
    //         console.log('iin if')
    //         for (var j = 0; j < s[i].length; j++) {
    //             d.push([s[i][j].data[0]['low'], s[i][j].data[0]['high']])
    //
    //         }
    //          s[i].data=[d];
    //     }
    //     else {
    //         d = [s[i].data[0]['low'], s[i].data[0]['high']]
    //         s[i].data = [d];
    //     }
    //     series.push(s[i])
    // }
    //
    // console.log(series)


    column_chart.update({
        xAxis: data.range_chart.xAxis,
        yAxis: data.range_chart.yAxis,
        series: data.range_chart.series,
    });


    anomaly_chart.update({
        xAxis: data.anomaly_chart.xAxis,
        yAxis: data.anomaly_chart.yAxis,

        series: data.anomaly_chart.series,
    });
 while (nitro_chart.series.length) {
     nitro_chart.series[0].remove();
 }
  while (water_chart.series.length) {
     water_chart.series[0].remove();
 }
        } else {
            alert('There is an issue clearing charts.')
        }

    });
}