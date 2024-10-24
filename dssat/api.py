import json

import psycopg2
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from dssatservice.ui.base import AdminBase, Session

from highcharts_core.chart import Chart
# Funciton for validation charts
from dssatservice.ui.plot import validation_chart
# Functions for ColumnRange charts
from dssatservice.ui.plot import init_columnRange_chart
# Functions for anomaly charts
# Function to clear yield charts (both columnrange and anomaly)
# Functions for stress charts
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
