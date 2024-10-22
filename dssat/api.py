import json

import psycopg2
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from dssatservice.dssat import run_spatial_dssat
from dssatservice.ui.base import SCHEMAS, admin_list, AdminBase, BASELINE_YEARS, Session

from highcharts_core.chart import Chart
# Funciton for validation charts
from dssatservice.ui.plot import validation_chart
# Functions for ColumnRange charts
from dssatservice.ui.plot import init_columnRange_chart, get_columnRange_series_data
# Functions for anomaly charts
from dssatservice.ui.plot import init_anomalies_chart, get_anomaly_series_data
# Function to clear yield charts (both columnrange and anomaly)
from dssatservice.ui.plot import clear_yield_chart
# Functions for stress charts
from dssatservice.ui.plot import init_stress_chart, get_stress_series_data, clear_stress_chart
from datetime import datetime
import pandas as pd
import numpy as np
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
f = open(str(BASE_DIR) + '/data.json', )
config = json.load(f)


def connect(dbname):
    con = psycopg2.connect(
        database=config['USERNAME'],
        user=config['DBUSER'],
        password=config['PASSWORD'],
        host=config['HOST'],
        port=5432,
    )

    return con


con = connect(config['USERNAME'])


def validation_ch(request, admin1):
    selector_pars = {"schema": admin1.split('_')[1], "admin1": None, "session": None}
    schema = selector_pars["schema"]
    selector_pars["session"] = Session(
        AdminBase(con, schema, admin1.split('_')[0])
    )
    desc = selector_pars["session"].adminBase.baseline_description() + \
           ". If the assumptions are not accurate you can set your own baseline scenario."
    val_chart = validation_chart(selector_pars["session"])
    val_chart["container"]='chart'
    session = selector_pars["session"]
    return desc, val_chart, list(session.adminBase.cultivar_labels.keys()), list(
        session.adminBase.cultivar_labels.values())


def init_columnRange(admin1):
    selector_pars = {"schema": admin1.split('_')[1], "admin1": None, "session": None}
    schema = selector_pars["schema"]
    selector_pars["session"] = Session(
        AdminBase(con, schema, admin1.split('_')[0])
    )
    return init_columnRange_chart(selector_pars["session"])


@csrf_exempt
def regions_geojson(request):
    schema = request.POST.get('schema')
    # It'll bring the latest forecast
    query = """
            SELECT jsonb_build_object(
            'type',     'FeatureCollection',
            'features', jsonb_agg(features.feature)
        )
        FROM (
          SELECT jsonb_build_object(
            'type',       'Feature',
            'admin1',         admin1,
            'gid',gid,
                'country',admin1,
            'geometry',   ST_AsGeoJSON(geom)::jsonb,
            'properties', to_jsonb(inputs) - 'gid' - 'geom'
          ) AS feature
          FROM (SELECT * FROM {0}.latest_forecast) inputs) features;
  """.format(schema)
    cur = con.cursor()
    cur.execute(query)
    rows = cur.fetchall()
    cur.close()
    return JsonResponse({'rows': rows[0]})
