import flask
from flask import Flask, render_template, request, jsonify
from datetime import datetime

import pandas as pd
from sklearn.manifold import TSNE

app = Flask(__name__)

@app.route("/")
def index():
    return render_template('index.html')

'''
@app.route("/tsne", methods=["POST"])
def tsne():
    req = request.get_json()
    countries = req["countries"]
    result = {}
    input = {}
    for country_name in countries.keys():
        original_df = pd.DataFrame(countries[country_name])
        df = original_df.drop(["state", "date"], axis=1)
        df_size = df.shape[0]
        RS = 2015010
        data_tsne= TSNE(random_state=RS, perplexity=30).fit_transform(df)
        df_tsne = pd.DataFrame(data_tsne) 
        df_tsne.columns = ["tsneX","tsneY"]
        print(df_tsne["tsneX"])
        country_data = df_tsne.to_dict(orient='records')
        for record in country_data:
            record['tsneX'] = round(record['tsneX'], 7)
            record['tsneY'] = round(record['tsneY'], 7)
        result[country_name] = country_data 
        input[country_name] = original_df.to_dict(orient='records')
    return {"result": result, "input": input}
'''
@app.route("/tsne", methods=["POST"])
def tsne():
    req = request.get_json()
    countries = req["countries"]
    result = {}
    input = {}
    total_df = pd.DataFrame()
    RS = 2015010
    for country_name in countries.keys():
        original_df = pd.DataFrame(countries[country_name])
        input[country_name] = original_df.to_dict(orient='records')
        df = original_df.drop(["state", "date"], axis=1)
        if total_df.empty:
            total_df = df
        else:
            total_df = pd.concat([total_df, df], ignore_index=True)
    if len(total_df) < 30:
        data_tsne= TSNE(random_state=RS, perplexity=len(total_df) - 1).fit_transform(total_df)
    else:
        data_tsne= TSNE(random_state=RS, perplexity=30).fit_transform(total_df)
    df_tsne = pd.DataFrame(data_tsne) 
    df_tsne.columns = ["tsneX","tsneY"]
    country_data = df_tsne.to_dict(orient='records')

    last_index = 0
    for country_name in countries.keys():
        length = len(countries[country_name])
        result[country_name] = country_data[last_index : last_index + length]
        last_index += length
    return {"result": result, "input": input}