//   var xhr = ajax_call('baseline-chart/', );
//     xhr.done(function (data) {
//          const baselinechart = Highcharts.chart('chart', {
//
//      xAxis: {
//          "title": {
//              'text': 'Year',
//              "style": {
//                  "font-size": "15px",
//              }
//          },
//          "labels": {
//              "style": {
//                  "font-size": "15px",
//              }
//          }
//      },
//      yAxis: {
//          "title": {
//              'text': 'Yield (kg/ha)',
//              "style": {
//                  "font-size": "15px"
//              }
//          },
//          "labels": {
//              "style": {
//                  "font-size": "15px",
//              }
//          }
//      },
//
//  });
//         for(var i=0;i<data.column1.length;i++){
//             baselinechart.addSeries(data.column1[i]);
//         }
//
// baselinechart.addSeries(data.scatter1);
// baselinechart.setTitle({
//         text: 'Observed and Simulated yield for the baseline scenario in ' + admin1,
//         style: {
//             "font-size": "15px"
//         }
//     }
//     )

 // chart.addSeries(data.chart,true);
var index = $("#chart").data('highchartsChart');
var baseline_chart= Highcharts.charts[index];


// document.getElementById('baseline_desc').innerHTML = data.desc;
var select = document.getElementById("cultivar");
var options = cultivar_values;
var option_keys =cultivar_keys;

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

document.getElementById('adm1').innerText=admin1+', '+admin1_country;