from datetime import datetime
from pathlib import Path
import pickle

import pandas
import psycopg2
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from highcharts_core.chart import Chart
from pandas_highcharts.core import serialize
import os
import geopandas as gpd
import json

import geojson
from dssatservice.ui.base import AdminBase, Session
from dssatservice.ui.plot import (
    init_anomalies_chart, init_stress_chart, get_stress_series_data,
    get_anomaly_series_data, get_columnRange_series_data,
    init_columnRange_chart, clear_yield_chart, clear_stress_chart
)
from dssat.api import init_columnRange, validation_ch

BASE_DIR = Path(__file__).resolve().parent.parent
f = open(str(BASE_DIR) + '/data.json', )
config = json.load(f)


def get_session(request):
    """
    Helper function to recreate the Session object from session data.
    """
    con_params = request.session.get('con_params')
    session_data = request.session.get('session_data')

    if not con_params or not session_data:
        return None

    # Re-establish the database connection
    con = psycopg2.connect(**con_params)
    # Recreate the Session object
    return Session(AdminBase(con, session_data['admin1_country'], session_data['admin1_name']))



def connect(dbname):
    con = psycopg2.connect(
        database=config['USERNAME'],
        user=config['DBUSER'],
        password=config['PASSWORD'],
        host=config['HOST'],
        port=5432,
    )
    return con


def get_user_session(request):
    if not hasattr(request, 'user_session'):
        request.user_session = {}
    return request.user_session


def get_geojson():
    import pandas as pd
    data = pd.read_json('C:\\Users\\gtondapu\\Downloads\\zimbabwe_fewsnet_admin2.geojson')
    import json
    data = json.load(open('C:\\Users\\gtondapu\\Downloads\\zimbabwe_fewsnet_admin2.geojson'))
    return data["result"]


def home(request, admin1='Nakuru'):
    sFile = open(config['PATH_TO_KENYA'], "rb")
    gdf = gpd.read_file(sFile)
    data = json.loads(json.dumps(gdf.to_json()))
    return render(request, 'index.html', {'data': data})


@csrf_exempt
def charts(request, admin1='Nakuru_kenya'):
    admin1_name = admin1.split('_')[0]
    admin1_country = admin1.split('_')[1]

    # Store connection and session data in Django session
    con_params = {
        "database": config['USERNAME'],
        "user": config['DBUSER'],
        "password": config['PASSWORD'],
        "host": config['HOST'],
        "port": 5432
    }
    session_data = {
        "admin1_country": admin1_country,
        "admin1_name": admin1_name,
    }
    request.session['con_params'] = con_params
    request.session['session_data'] = session_data

    # Recreate the Session object for initializing charts
    session = get_session(request)

    # Initialize charts
    anom_chart = init_anomalies_chart()
    r_chart = init_columnRange_chart(session)
    stress_chart_water = init_stress_chart('water')
    stress_chart_nitrogen = init_stress_chart('nitrogen')

    # Set containers
    stress_chart_water.container = 'stress_chart_water'
    stress_chart_nitrogen.container = 'stress_chart_nitrogen'
    anom_chart.container = 'anomaly_chart'
    r_chart.container = 'column_chart'

    # Convert charts to dictionary format and store in session
    request.session['range_chart'] = r_chart.to_dict()
    request.session['sw'] = stress_chart_water.to_dict()
    request.session['anomaly_chart'] = anom_chart.to_dict()
    request.session['sn'] = stress_chart_nitrogen.to_dict()

    # Load geographic data
    sFile = open(config['PATH_TO_KENYA'], "rb")
    gdf = gpd.read_file(sFile)
    data = json.loads(json.dumps(gdf.to_json()))

    desc, column, cultivars, x = validation_ch(request, admin1)

    # Render the response
    return render(request, 'charts.html', {
        'admin1': admin1_name,
        'admin1_country': admin1_country,
        'desc': desc,  # Placeholder, modify as needed
        'cultivar_keys': cultivars,  # Placeholder, modify as needed
        'cultivar_values': x,  # Placeholder, modify as needed
        'chart': column.to_js_literal(),  # Placeholder, modify as needed
        'data': data,
        'range_chart': r_chart.to_js_literal(),
        'anomaly_chart': anom_chart.to_js_literal(),
        'stress_chart_water': stress_chart_water.to_js_literal(),
        'stress_chart_nitrogen': stress_chart_nitrogen.to_js_literal()
    })


@csrf_exempt
def run_experiment(request, admin1):
    try:
        schema = request.POST.get('schema')
        admin1 = request.POST.get('admin1')

        # Retrieve and recreate the session object
        session = get_session(request)
        if session is None:
            return JsonResponse({'error': 'no session'})

        # Retrieve charts from the session
        range_chart = request.session.get('range_chart')
        anomaly_chart = request.session.get('anomaly_chart')
        sw = request.session.get('sw')
        sn = request.session.get('sn')

        # Update session parameters
        session.simPars.planting_date = datetime.strptime(request.POST.get('planting_date'), '%Y-%m-%d')
        session.simPars.cultivar = request.POST.get('cultivar')
        session.simPars.nitrogen_rate = [int(i) for i in  request.POST.getlist('nitrogen_rate[]')]
        session.simPars.nitrogen_dap = [int(i) for i in request.POST.getlist('nitrogen_dap[]')]
        session.run_experiment(fakerun=True)

        # Update charts with new data
        new_chart_data_range = get_columnRange_series_data(session)
        for serie in range_chart["userOptions"]["series"]:
            if serie.get("data"):
                data = [new_chart_data_range[serie["name"]]['name'],new_chart_data_range[serie["name"]]['low'], new_chart_data_range[serie["name"]]['high']]
                serie["data"] += [data]
            else:
                data = [new_chart_data_range[serie["name"]]['name'],new_chart_data_range[serie["name"]]['low'], new_chart_data_range[serie["name"]]['high']]
                serie["data"] = [data]

        new_chart_data_an = get_anomaly_series_data(session)
        for serie in anomaly_chart["userOptions"]["series"]:
            if serie.get("data"):
                serie["data"] += [new_chart_data_an[serie["name"]]]
            else:
                serie["data"] = [new_chart_data_an[serie["name"]]]

        new_chart_data_water = get_stress_series_data(session, stresstype="water")
        if not sw["userOptions"].get("series"):
            new_chart_data_water["name"] = f"Exp 1"
            sw["userOptions"]["series"] = [new_chart_data_water]
        else:
            n_exps = len(sw["userOptions"]["series"])
            new_chart_data_water["name"] = f"Exp {n_exps + 1}"
            sw["userOptions"]["series"] += [new_chart_data_water]

        new_chart_data_nitro = get_stress_series_data(session, stresstype="nitrogen")
        if not sn["userOptions"].get("series"):
            new_chart_data_nitro["name"] = f"Exp 1"
            sn["userOptions"]["series"] = [new_chart_data_nitro]
        else:
            n_exps = len(sn["userOptions"]["series"])
            new_chart_data_nitro["name"] = f"Exp {n_exps + 1}"
            sn["userOptions"]["series"] += [new_chart_data_nitro]

        # Save the updated charts back to the session
        request.session['range_chart'] = range_chart
        request.session['anomaly_chart'] = anomaly_chart
        request.session['sw'] = sw
        request.session['sn'] = sn

        # Return the response
        return JsonResponse({
            'error': '',
            'anomaly_chart': anomaly_chart["userOptions"],
            'aseries': new_chart_data_an,
            'rdata': new_chart_data_range,
            'range_chart': range_chart["userOptions"],
            'stress_chart_water': new_chart_data_water,
            'stress_chart_nitrogen': new_chart_data_nitro
        })
    except Exception as e:
        return JsonResponse({'error': str(e)})

def about(request):
    return render(request, 'about.html')


@csrf_exempt
def clear_charts(request, admin1):
    try:
        session = get_session(request)

        anom_chart = init_anomalies_chart()
        r_chart = init_columnRange_chart(session)
        stress_chart_water = init_stress_chart('water')
        stress_chart_nitrogen = init_stress_chart('nitrogen')
        # Set containers
        stress_chart_water.container = 'stress_chart_water'
        stress_chart_nitrogen.container = 'stress_chart_nitrogen'
        anom_chart.container = 'anomaly_chart'
        r_chart.container = 'column_chart'

        # Convert charts to dictionary format and store in session
        request.session['range_chart'] = r_chart.to_dict()
        request.session['sw'] = stress_chart_water.to_dict()
        request.session['anomaly_chart'] = anom_chart.to_dict()
        request.session['sn'] = stress_chart_nitrogen.to_dict()
        clear_yield_chart(request.session['range_chart'] )
        clear_stress_chart(request.session['sw'])
        clear_stress_chart(request.session['sn'])
        clear_yield_chart(request.session['anomaly_chart'])



        return JsonResponse({
            'error': '',
            'anomaly_chart': request.session['anomaly_chart']["userOptions"],
            'range_chart': request.session['range_chart']["userOptions"],
            'stress_chart_water': request.session['sw']['userOptions'],
            'stress_chart_nitrogen': request.session['sn']["userOptions"]["series"]
        })
    except Exception as e:
        return JsonResponse({'error': str(e)})

