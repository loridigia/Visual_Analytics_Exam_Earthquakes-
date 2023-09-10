import flask
from flask import Flask, render_template, request
from datetime import datetime

import pandas as pd
from sklearn.manifold import TSNE

app = Flask(__name__)

@app.route("/")
def index():
    return render_template('index.html')