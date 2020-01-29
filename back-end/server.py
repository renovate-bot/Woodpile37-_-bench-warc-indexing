from flask import Flask, render_template, request
from elasticsearch import Elasticsearch
from elasticsearch_dsl import Search

import argparse

argparser = argparse.ArgumentParser(description='An Elastic interface server', formatter_class=argparse.ArgumentDefaultsHelpFormatter)
argparser.add_argument('--host', help='ElasticSearch host', default='localhost')
argparser.add_argument('--port', help='ElasticSearch port', default=9200)
argparser.add_argument('--index', help='Index to search against', default='better')
args = argparser.parse_args()


app = Flask(__name__, static_folder='../front-end/build/static', template_folder='../front-end/build')
es = Elasticsearch([
    {'host': args.host, 'port': args.port}
])


@app.route('/')
def hello():
    return render_template('index.html')


@app.route('/search')
def search():
    query = request.args['q']
    # unescape the query
    search = Search(using=es, index=args.index).query("match", text=query)
    search.aggs.bucket('persons', 'terms', field='PER.keyword')
    search.aggs.bucket('orgs', 'terms', field='ORG.keyword')
    search.aggs.bucket('gpes', 'terms', field='GPE.keyword')
    search.aggs.bucket('events', 'terms', field='EVENT.keyword')

    response = search.execute()

    app.logger.debug(response.aggregations.to_dict())
    return response.to_dict()


print('Starting Flask...')
app.debug = True
app.run(host = '0.0.0.0')
