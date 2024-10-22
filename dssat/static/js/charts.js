 // chart.addSeries(data.chart,true);
var index = $("#chart").data('highchartsChart');
var baseline_chart= Highcharts.charts[index];


// document.getElementById('baseline_desc').innerHTML = data.desc;
var select = document.getElementById("cultivar");
var options = cultivar_types;
var option_keys =cultivar_codes;

for (var i = 0; i < options.length; i++) {
    var opt = options[i];
    var el = document.createElement("option");
    el.textContent = opt;
    el.value = option_keys[i];
    select.appendChild(el);
}


    // });



//
// var select1 = document.getElementById("nitro_dap");
//  var arr=[];
//  for (var i=0; i<=120; i++) {
//     arr.push(i)
//  }
// for (var j = 0; j < arr.length; j++) {
//    var opt = arr[j];
//    var el = new Option(opt, opt);
//    select1.appendChild(el);
// }

 $('#nitro_dap').change(function(e) {
        var selected = $(e.target).val();
        $('#selected_daps').val(selected);
    });

document.getElementById('admin1').innerText=admin1+', '+admin1_country;