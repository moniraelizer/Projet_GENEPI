from flask import Flask
from psycopg2 import connect
from flask import render_template

app = Flask(__name__)

#Récupérer données de la page html indiquée apres le /
@app.route('/<path:path>')
def send_file(path):
    return app.send_static_file(path)

@app.route('/dep')
def dep():
    with connect("dbname=genepi user=postgres password=admin") as con:
        cur = con.cursor()
        cur.execute("""
            select json_build_object(
                'type', 'FeatureCollection',
                'features', json_agg(ST_AsGeoJSON(departement.*)::json)
            ) as geojson
            from departement
            """)
        return cur.fetchone()[0]
        
@app.route('/gaspdensi')
def gaspdensi():
    with connect("dbname=genepi user=postgres password=admin") as con:
        cur = con.cursor()
        cur.execute("""
            select json_build_object(
                'type', 'FeatureCollection',
                'features', json_agg(ST_AsGeoJSON(gaspar_dens.*)::json)
            ) as geojson
            from gaspar_dens
            """)
        return cur.fetchone()[0]
        
@app.route('/gasptemp')
def gasptemp():
    with connect("dbname=genepi user=postgres password=admin") as con:
        cur = con.cursor()
        cur.execute("""
            select json_build_object(
                'type', 'FeatureCollection',
                'features', json_agg(ST_AsGeoJSON(catnat_temp.*)::json)
            ) as geojson
            from catnat_temp
            """)
        return cur.fetchone()[0]
        
@app.route('/tornades')
def tornades():
    with connect("dbname=genepi user=postgres password=admin") as con:
        cur = con.cursor()
        cur.execute("""
            select json_build_object(
                'type', 'FeatureCollection',
                'features', json_agg(ST_AsGeoJSON(torna_pt.*)::json)
            ) as geojson
            from torna_pt
            """)
        return cur.fetchone()[0]

@app.route('/avalanche')
def avalanche():
    with connect("dbname=genepi user=postgres password=admin") as con:
        cur = con.cursor()
        cur.execute("""
            select json_build_object(
                'type', 'FeatureCollection',
                'features', json_agg(ST_AsGeoJSON(aval_poly.*)::json)
            ) as geojson
            from aval_poly
            """)
        return cur.fetchone()[0]
        
@app.route('/avalanchept')
def avalanchept():
    with connect("dbname=genepi user=postgres password=admin") as con:
        cur = con.cursor()
        cur.execute("""
            select json_build_object(
                'type', 'FeatureCollection',
                'features', json_agg(ST_AsGeoJSON(aval_pt.*)::json)
            ) as geojson
            from aval_pt
            """)
        return cur.fetchone()[0]
        
@app.route('/mvtterrain')
def mvtterrain():
    with connect("dbname=genepi user=postgres password=admin") as con:
        cur = con.cursor()
        cur.execute("""
            select json_build_object(
                'type', 'FeatureCollection',
                'features', json_agg(ST_AsGeoJSON(mvt_poly.*)::json)
            ) as geojson
            from mvt_poly
            """)
        return cur.fetchone()[0]
        
        
@app.route('/mvtterrainpt')
def mvtterrainpt():
    with connect("dbname=genepi user=postgres password=admin") as con:
        cur = con.cursor()
        cur.execute("""
            select json_build_object(
                'type', 'FeatureCollection',
                'features', json_agg(ST_AsGeoJSON(mvt_pt.*)::json)
            ) as geojson
            from mvt_pt
            """)
        return cur.fetchone()[0]
        
        
@app.route('/feuxforet')
def feuxforet():
    with connect("dbname=genepi user=postgres password=admin") as con:
        cur = con.cursor()
        cur.execute("""
            select json_build_object(
                'type', 'FeatureCollection',
                'features', json_agg(ST_AsGeoJSON(feux_pt.*)::json)
            ) as geojson
            from feux_pt
            """)
        return cur.fetchone()[0]
        
@app.route('/feuxforetco')
def feuxforetco():
    with connect("dbname=genepi user=postgres password=admin") as con:
        cur = con.cursor()
        cur.execute("""
            select json_build_object(
                'type', 'FeatureCollection',
                'features', json_agg(ST_AsGeoJSON(feux_poly.*)::json)
            ) as geojson
            from feux_poly
            """)
        return cur.fetchone()[0]
        
        
@app.route('/inondationco')
def inondationco():
    with connect("dbname=genepi user=postgres password=admin") as con:
        cur = con.cursor()
        cur.execute("""
            select json_build_object(
                'type', 'FeatureCollection',
                'features', json_agg(ST_AsGeoJSON(inond_poly.*)::json)
            ) as geojson
            from inond_poly
            """)
        return cur.fetchone()[0]

@app.route('/inondationpt')
def inondationpt():
    with connect("dbname=genepi user=postgres password=admin") as con:
        cur = con.cursor()
        cur.execute("""
            select json_build_object(
                'type', 'FeatureCollection',
                'features', json_agg(ST_AsGeoJSON(inond_pt.*)::json)
            ) as geojson
            from inond_pt
            """)
        return cur.fetchone()[0]
        
@app.route('/synthesedensi')
def synthesedensi():
    with connect("dbname=genepi user=postgres password=admin") as con:
        cur = con.cursor()
        cur.execute("""
            select json_build_object(
                'type', 'FeatureCollection',
                'features', json_agg(ST_AsGeoJSON(syn_dens.*)::json)
            ) as geojson
            from syn_dens
            """)
        return cur.fetchone()[0]
       
@app.route('/synthesequalit')
def synthesequalit():
    with connect("dbname=genepi user=postgres password=admin") as con:
        cur = con.cursor()
        cur.execute("""
            select json_build_object(
                'type', 'FeatureCollection',
                'features', json_agg(ST_AsGeoJSON(syn_quali.*)::json)
            ) as geojson
            from syn_quali
            """)
        return cur.fetchone()[0]
        
@app.route('/table_synthese')
def synthese_graph():
    with connect("dbname=genepi user=postgres password=admin") as con:
        cur = con.cursor()
        cur.execute("""
            select json_build_object(
                'annee', array_agg(annee),
                'mvt', array_agg(mvt),
                'aval', array_agg(aval),
                'feux', array_agg(feux),
                'inond', array_agg(inond),
                'tornad', array_agg(tornad)
            ) as geojson
            from synthese_graph
            """)
        return cur.fetchone()[0]
        
        
@app.route('/accueil.html')
def accueil():
    return render_template('accueil.html')
    
@app.route('/pfeux.html')
def pfeux():
    return render_template('pfeux.html')
    
@app.route('/ptornades.html')
def ptornades():
    return render_template('ptornades.html')
    
@app.route('/pinondation.html')
def pinondation():
    return render_template('pinondation.html')

@app.route('/pgaspar.html')
def pgaspar():
    return render_template('pgaspar.html')
    
@app.route('/pmvtterrain.html')
def pmvtterrain():
    return render_template('pmvtterrain.html')
    
    
@app.route('/pavalanche.html')
def paval():
    return render_template('pavalanche.html')

@app.route('/ptout.html')
def synthese():
    return render_template('ptout.html')
       
@app.route('/pdocum.html')
def documentation():
    return render_template('pdocum.html')

@app.route('/pqsn.html')
def quisommenous():
    return render_template('pqsn.html')

app.run(host='0.0.0.0', port='5000')