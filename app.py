import flask
from flask import Flask, render_template, request, jsonify
from datetime import datetime

import pandas as pd
from sklearn.manifold import TSNE

app = Flask(__name__)

@app.route("/")
def index():
    return render_template('index.html')

@app.route("/tsne", methods=["POST"])
def tsne():
    req = request.get_json()
    countries = req["countries"]
    france = countries["Iceland"]
    df = pd.DataFrame(france)
    print(df)
    df = df.drop("state", axis=1)
    RS = 2015010
    data_tsne= TSNE(random_state=RS, perplexity=30).fit_transform(df)
    df_tsne = pd.DataFrame(data_tsne) 
    df_tsne.columns = ["tsneX","tsneY"]
    print(df_tsne)
    response = {"tsne": df_tsne.to_dict()}
    return jsonify(response)
