import requests
import json
import flask

app = flask.Flask(__name__)

@app.route('/results.json')
def results():
  with open('results.json', 'r') as f:
    response = flask.make_response(f.read())
    response.headers['Content-Type'] = 'application/json'
    response.headers['Access-Control-Allow-Origin'] = '*'
    return response

app.run()
