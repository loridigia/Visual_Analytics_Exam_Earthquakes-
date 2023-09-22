var min_magnitudo = null
var max_magnitudo = null
var min_depth = null
var max_depth = null
var min_significance = null
var max_significance = null
var min_date = null
var max_date = null

function load_filters() {
  min_magnitudo = document.getElementById("min-magnitudo").value;
  max_magnitudo = document.getElementById("max-magnitudo").value;
  var significance = document.getElementById("significance").value;
  if (significance == "*"){
    min_significance = -999999
    max_significance = 999999
  } else {
    splitted = depth.split("-")
    min_depth = splitted[0]
    max_depth = splitted[1]
  }
  var depth = document.getElementById("depth").value;
  if (depth == "*"){
    min_depth = -999999
    max_depth = 999999
  } else {
    splitted = depth.split("-")
    min_depth = splitted[0]
    max_depth = splitted[1]
  }

  min_date = $('#timestart').data('DateTimePicker').date()
  max_date = $('#timeend').data('DateTimePicker').date()

  console.log("MIN MAG: " + min_magnitudo)
  console.log("MAX MAG: " + max_magnitudo)
  console.log("significance: " + significance)
  console.log("min_date: " + min_date)
  console.log("max_date: " + max_date)

}

var mapFeatures, width, height, path, projection, svg, dataById = null
// We define a variable to later hold the data of the CSV.
var earthquakeData;

var eqDomain = [1, 2, 3, 4, 5, 6, 9 ];
var eqColorScale = d3.scale.linear()
                    .domain(eqDomain)
                    .range([
                            '#fdd49e','#fdbb84',
                            '#fc8d59','#ef6548',
                            '#d7301f','#b30000','#7f0000'
                            ]);  
var eqSizeScale = d3.scale.linear()
                    .domain(eqDomain)
                    .range([1.5,3,4.5,6,7.5,9,13.5])

function reset_map() {
  d3.select("svg").remove();
}

function load_map() {
  load_filters()
  if (svg != null){
    reset_map()
  }
  // We define a variable holding the current key to visualize on the map.
  var selectedCountries = []

  //var worldmap = d3.json("{{url_for('static',filename='data/world-countries.geojson')}}" );
  //var eartquakes = d3.csv("{{url_for('static',filename='data/subset-earthquakes.csv')}}");

  // We add a listener to the browser window, calling updateLegend when
  // the window is resized.
  //window.onresize = updateLegend;

  // We specify the dimensions for the map container. We use the same
  // width and height as specified in the CSS above.
  // 900 x 600 = 1.5
  width = (window.innerWidth / 2) - (window.innerWidth * 0.04),
  height = (window.innerHeight / 2);

  // We create a SVG element in the map container and give it some
  // dimensions. We can use a viewbox and preserve the aspect ratio. This
  // also allows a responsive map which rescales and looks good even on
  // different screen sizes
  svg = d3.select('#map').append('svg')
    .attr("preserveAspectRatio", "xMidYMid")
    .attr({
      width: width,
      height: height
    });
    //.attr("viewBox", "0 0 " + width + " " + height);


  // We add a <g> element to the SVG element and give it a class to
  // style. We also add a class name for Colorbrewer.
  mapFeatures = svg.append('g')
    .attr('class', 'features YlGnBu');

  // We add a <div> container for the tooltip, which is hidden by default.
  var tooltip = d3.select("#map")
    .append("div")
    .attr("class", "tooltip hidden");

  // Define the zoom and attach it to the map
  var zoom = d3.behavior.zoom()
    .scaleExtent([1, 10])
    .on('zoom', doZoom);
    
  svg.call(zoom).on("dblclick.zoom", null);

  // We define a geographical projection
  //     https://github.com/mbostock/d3/wiki/Geo-Projections
  // and set some dummy initial scale. The correct scale, center and
  // translate parameters will be set once the features are loaded.
  projection = d3.geo.mercator()
    .scale(1);

  // We prepare a path object and apply the projection to it.
  path = d3.geo.path()
    .projection(projection);

  // We prepare an object to later have easier access to the data.
  dataById = d3.map();

  // We prepare a quantize scale to categorize the values in 9 groups.
  // The scale returns text values which can be used for the color CSS
  // classes (q0-9, q1-9 ... q8-9). The domain will be defined once the
  // values are known.
  var quantize = d3.scale.quantize()
    .range(d3.range(9).map(function(i) { return 'q' + i + '-9'; }));

  // We prepare a number format which will always return 2 decimal places.
  var formatNumber = d3.format('.2f');


  // Load the features from the GeoJSON.
  d3.json("./static/data/world-countries.geojson", function(error, features) {

    // Get the scale and center parameters from the features.
    var scaleCenter = calculateScaleCenter(features);

    console.log(scaleCenter.scale)
    console.log(scaleCenter.center)

    projection.scale(330)
    .center([4, 54])
    .translate([width/2, height/2]);
    /*
    // Apply scale, center and translate parameters.
    projection.scale(scaleCenter.scale)
      .center(scaleCenter.center)
      .translate([width/2, height/2]);
      */

    // Read the data from CSV
    d3.csv("./static/data/subset-eu.csv", function(data) {

      filteredData = data.filter(function(row) {
        return row['magnitudo'] >= min_magnitudo &
              row['magnitudo'] <= max_magnitudo &&
              row['significance'] >= min_magnitudo &&;
      });

      var min_magnitudo = null
var max_magnitudo = null
var significance = null
var min_date = null
var max_date = null


    data = filteredData

      // We store the data object in the variable which is accessible from
      // outside of this function.
      earthquakeData = data;

      // This maps the data of the CSV so it can be easily accessed by
      // the ID of the state, for example: dataById[Italy]
      dataById = d3.nest()
      .key(function(d) { return d.state; })
      .map(data);

      // get the circle selection and add the data
      var circles = svg.selectAll("circle")
          .remove() // this clears any existing circles we have, which will need updated x/y data on resize
          .data(data);
      
      
      // on the enter selection, add x,y, radius, and color
      circles.enter()
      .append("circle")
      .attr("id", "circle_earthquake")
      .attr("cx", function(d) {
              return projection([d.longitude, d.latitude])[0];
          })
      .attr("cy", function(d) {
          return projection([d.longitude, d.latitude])[1];
          })
      .attr("r", 0)
      .transition()
      .duration(900)
      .delay(function(d,i){ return 0; })
      .ease('elastic')
      .attr("r", function(d) {
              return eqSizeScale(d.magnitudo);
          }) 
      .style("fill", function(d) {
              return eqColorScale(parseInt(d.magnitudo));
          })
      .attr("class", "earthquake");
      
      // remove any exit selection
      circles.exit().remove();
      addMagnitudeLegend();

      // We add the features to the <g> element created before.
      // D3 wants us to select the (non-existing) path objects first ...
      mapFeatures.selectAll('path')
          // ... and then enter the data. For each feature, a <path>
          // element is added.
          .data(features.features)
          .enter().append('path')
          // As "d" attribute, we set the path of the feature.
          .attr('d', path)
          .style("fill", "#black")
          // When the mouse moves over a feature, show the tooltip.
          //.on('mousemove', showTooltip)
          // When the mouse moves out of a feature, hide the tooltip.
          //.on('mouseout', hideTooltip)
          // When a feature is clicked, show the details of it.
          .on('click', showDetails)
          .on('dblclick', function(f){
            var contry = getIdOfFeature(f);
            if (selectedCountries.includes(contry)) {
              d3.select(this).style("fill", "black");
              const index = selectedCountries.indexOf(contry);
              selectedCountries.splice(index, 1);
            }
            else {
              d3.select(this).style("fill", "red");
              selectedCountries.push(contry)
            }

          });



    });

  });
}

var addMagnitudeLegend = function()
{
  // create a list of objects representing a legend entry
  // so we can add x,y coordinates to each object and apply text
  // to each magnitude circle:
  // example here: http://stackoverflow.com/questions/11857615/placing-labels-at-the-center-of-nodes-in-d3-js
  var legendObjs = [];
  eqDomain.forEach(function(d,i) {
     legendObjs[i] = { mag: d };
  });
  
  // some sizing and location info
  var lNodeSize = 40;
  var lXOffset = 15; 
  var lYOffset = 5;
  var lTopLeft = [lXOffset, height - lNodeSize - lNodeSize / 3 - lYOffset ];
  var lBottomRight = [ (lNodeSize + 1) * legendObjs.length, height - lYOffset];
  
  // add a bounding rectangle
  svg.append("svg:rect")
      .attr("class", "legend-box")
      .attr("width", lBottomRight[0] - lTopLeft[0] + "px")
      .attr("height", lBottomRight[1] - lTopLeft[1])
      .style("fill", "white")
      .attr("transform","translate("+lTopLeft[0]+","+lTopLeft[1]+")");
   
  // append the data and get the enter selection
  var lnodes = svg.append("svg:g")
      .selectAll("g") 
      .data(legendObjs, function(d,i){ return d.mag; })
      .enter();
          
  // append the circles to the enter selection
  lnodes.append("circle")
        .attr("r", function(d){ return eqSizeScale(d.mag); })
        .attr("class", "earthquake")
        .style("fill", function(d){ return eqColorScale(d.mag); })
        .attr("transform", function(d, i) {
                               d.x = 2 * lXOffset + lNodeSize * i;
                               d.y = lBottomRight[1] - lNodeSize / 2;
                               return "translate("
                                        + d.x + ","+ d.y 
                                        + ")";
                            });
  // append the text to each "svg:g" node, which also contains a circle
  lnodes.append("text")
        .text(function(d) { return "M"+d.mag; })
        .attr("class", "legend-mag-text")
        .attr("text-anchor", "middle" )
        // the transform here contains an offset from the
        // middle of the g element, which is also the middle of the circle
        .style('fill', 'black')
        .attr("transform", function(d) {
                                return "translate("
                                   + d.x + ","
                                   + (d.y-15) + ")"; });
}

/**
 * Show the details of a feature in the details <div> container.
 * The content is rendered with a Mustache template.
 *
 * @param {object} f - A GeoJSON Feature object.
 */
function showDetails(f) {

    // Get the ID of the feature.
    var id = getIdOfFeature(f);
    var data = dataById[id];

    var columns = ['magnitudo', 'depth', 'significance', 'date'], column_id = 'state', column_class = 'norm';
    var h1 = d3.select('#details_h1')
    var table1 = d3.select('#map_table')
    table1.selectAll("tr, td, thead, tbody").remove();
    var thead = table1.append('thead');
    var tbody = table1.append('tbody');

    if (data != undefined) {
        state = data[0]['state']
        h1.text(state)
    }
    else { 
        h1.text("No Data"); 
        return 
    }

    // append the header row
    thead.append('tr')
        .selectAll('th')
        .data(["magnitudo", "depth", "significance", "date"])
        .enter()
        .append('th')
        .text(function(column) {
        return column;
        });

    // create a row for each object in the data
    var rows = tbody.selectAll('tr')
        .data(data)
        .enter()
        .append('tr');

  // create a cell in each row for each column
    var cells = rows.selectAll('td')
        .data(function(row) {
        return columns.map(function(column) {
            return {
                column: column,
                value: row[column],
                id: row[column_id],
                class: row[column_class]
                };
        });
        })
    .enter()
    .append('td')
    .attr('id', function(d) { return d.column === 'state' ? d.id : null; })
    .html(function(d) {
      return d.value;
    });


  // Hide the initial container.
  //d3.select('#initial').classed("hidden", true);

  // Put the HTML output in the details container and show (unhide) it.
  //d3.select('#details').html(detailsHtml);
  //d3.select('#details').classed("hidden", false);
}

/**
 * Hide the details <div> container and show the initial content instead.
 */
function hideDetails() {
  // Hide the details
  d3.select('#details').classed("hidden", true);
  // Show the initial content
  d3.select('#initial').classed("hidden", false);
}

/**
 * Show a tooltip with the name of the feature.
 *
 * @param {object} f - A GeoJSON Feature object.
 */
function showTooltip(f) {
  // Get the ID of the feature.
  var id = getIdOfFeature(f);
  // Use the ID to get the data entry.
  var d = dataById[id];

  // Get the current mouse position (as integer)
  var mouse = d3.mouse(d3.select('#map').node()).map(
    function(d) { return parseInt(d); }
  );

  // Calculate the absolute left and top offsets of the tooltip. If the
  // mouse is close to the right border of the map, show the tooltip on
  // the left.
  console.log(d)
  var left = Math.min(width - 4 * d.name.length, mouse[0] + 5);
  var top = mouse[1] + 25;

  // Show the tooltip (unhide it) and set the name of the data entry.
  // Set the position as calculated before.
  tooltip.classed('hidden', false)
    .attr("style", "left:" + left + "px; top:" + top + "px")
    .html(d.name);
}

/**
 * Hide the tooltip.
 */
function hideTooltip() {
  tooltip.classed('hidden', true);
}

/**
 * Zoom the features on the map. This rescales the features on the map.
 * Keep the stroke width proportional when zooming in.
 */
function doZoom() {
  mapFeatures.attr("transform",
    "translate(" + d3.event.translate + ") scale(" + d3.event.scale + ")")
    // Keep the stroke width proportional. The initial stroke width
    // (0.5) must match the one set in the CSS.
    .style("stroke-width", 0.5 / d3.event.scale + "px");

    circles = svg.selectAll("#circle_earthquake").attr("transform",
    "translate(" + d3.event.translate + ") scale(" + d3.event.scale + ")")
    // Keep the stroke width proportional. The initial stroke width
    // (0.5) must match the one set in the CSS.
    .style("stroke-width", 0.5 / d3.event.scale + "px");
}

/**
 * Calculate the scale factor and the center coordinates of a GeoJSON
 * FeatureCollection. For the calculation, the height and width of the
 * map container is needed.
 *
 * Thanks to: http://stackoverflow.com/a/17067379/841644
 *
 * @param {object} features - A GeoJSON FeatureCollection object
 *   containing a list of features.
 *
 * @return {object} An object containing the following attributes:
 *   - scale: The calculated scale factor.
 *   - center: A list of two coordinates marking the center.
 */
function calculateScaleCenter(features) {
  // Get the bounding box of the paths (in pixels!) and calculate a
  // scale factor based on the size of the bounding box and the map
  // size.
  var bbox_path = path.bounds(features),
      scale = 0.95 / Math.max(
        (bbox_path[1][0] - bbox_path[0][0]) / width,
        (bbox_path[1][1] - bbox_path[0][1]) / height
      );

  // Get the bounding box of the features (in map units!) and use it
  // to calculate the center of the features.
  var bbox_feature = d3.geo.bounds(features),
      center = [
        (bbox_feature[1][0] + bbox_feature[0][0]) / 2,
        (bbox_feature[1][1] + bbox_feature[0][1]) / 2];

  return {
    'scale': scale,
    'center': center
  };
}

/**
 * Helper function to access the (current) value of a data object.
 *
 * Use "+" to convert text values to numbers.
 *
 * @param {object} d - A data object representing an entry (one line) of
 * the data CSV.
 */
function getValueOfData(d) {
  return +d[currentKey];
}

/**
 * Helper function to retrieve the ID of a feature. The ID is found in
 * the properties of the feature.
 *
 * @param {object} f - A GeoJSON Feature object.
 */
function getIdOfFeature(f) {
    console.log(f)
  return f.properties.ADMIN;
}