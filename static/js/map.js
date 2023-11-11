const colors = [
  "#FF5733", // Red
  "#5733FF", // Blue
  "#FF33FF", // Magenta
  "#FFA500", // Orange
  "#33FF57", // Green
  "#20c9c9", // Cyan
  "#cfc50e", // Yellow
  "#8B4513", // Brown
  "#3f7532", // Dark-green
  "#000000"  // BLACK
];


var min_magnitudo = null
var max_magnitudo = null
var min_depth = null
var max_depth = null
var min_significance = null
var max_significance = null
var min_date = null
var max_date = null
var selectedCountries = []
var selectedColors = []
var country_colors = new Object();

function load_filters() {
  min_magnitudo = Number.parseInt(document.getElementById("min-magnitudo").value)
  max_magnitudo = Number.parseInt(document.getElementById("max-magnitudo").value)

  min_significance = document.getElementById("min-significance").value
  max_significance = document.getElementById("max-significance").value
  if (max_significance.indexOf(">") != -1) {
    max_significance = 9999999
  }

  min_depth = document.getElementById("min-depth").value
  if (min_depth.indexOf(">") != -1) {
    min_depth = -99999999
  }
  max_depth = document.getElementById("max-depth").value
  if (max_depth.indexOf(">") != -1) {
    max_depth = 9999999
  }


  min_date = $('#timestart').data('DateTimePicker').date()
  min_date = Date.parse(min_date.toString())
  max_date = $('#timeend').data('DateTimePicker').date()
  max_date = Date.parse(max_date.toString())

}

var mapFeatures, width, height, path, projection, svg
let dataById = null
// We define a variable to later hold the data of the CSV.
var earthquakeData;

var eqDomain = [1, 2, 3, 4, 5, 6, 7, 8, 9 ];
var eqColorScale = d3.scaleLinear()
                    .domain(eqDomain)
                    .range([
                            '#fdd49e','#fdbb84',
                            '#fc8d59','#ef6548',
                            '#d7301f','#b30000','#7f0000',
                            '#660101', '#450101'
                            ]);  
var eqSizeScale = d3.scaleLinear()
                    .domain(eqDomain)
                    .range([1.5,3,4.5,6,7.5,9,11,13,14])

function reset_map() {
  d3.select("svg").remove();
  selectedCountries = []
  selectedColors = []
  country_colors = new Object();
}

function load_map() {
  load_filters()
  if (svg != null){
    reset_map()
  }

  //window.onresize = updateLegend;

  // We specify the dimensions for the map container. We use the same
  // width and height as specified in the CSS above.
  // 900 x 600 = 1.5
  width = (window.innerWidth / 2) - (window.innerWidth * 0.03),
  height = (window.innerHeight / 2);

  // We create a SVG element in the map container and give it some
  // dimensions. We can use a viewbox and preserve the aspect ratio. This
  // also allows a responsive map which rescales and looks good even on
  // different screen sizes
  svg = d3.select('#map')
    .append('svg')
    .attr('preserveAspectRatio', 'xMidYMid')
    .attr('width', width)
    .attr('height', height);

  mapFeatures = svg.append('g')
    .attr('class', 'features YlGnBu');

  // Define the zoom and attach it to the map
  var zoom = d3.zoom()
    .scaleExtent([1, 10])
    .on('zoom', doZoom);
      
  svg.call(zoom).on("dblclick.zoom", null);

  // We define a geographical projection
  //     https://github.com/mbostock/d3/wiki/Geo-Projections
  // and set some dummy initial scale. The correct scale, center and
  // translate parameters will be set once the features are loaded.
  projection = d3.geoMercator()
    .scale(1);

  // We prepare a path object and apply the projection to it.
  path = d3.geoPath()
    .projection(projection);

  // We prepare an object to later have easier access to the data.
  dataById = new Map();

  // Load the features from the GeoJSON.
  d3.json('./static/data/world-countries.geojson')
  .then(function (features) {

    projection.scale(330)
    .center([4, 54])
    .translate([width/2, height/2]);
    

    // Read the data from CSV
    d3.csv('./static/data/eartquakes-edited_eu_2000_mag1.csv')
    .then(function(data) {

      filteredData = data.filter(function(row) {
        row['date'] = Date.parse(row['date']);
        return row['date'] >= min_date && row['date'] <= max_date
                && row['magnitudo'] >= min_magnitudo && row['magnitudo'] <= max_magnitudo
                && row['significance'] >= min_significance && row['significance'] <= max_significance
                && row['depth'] >= min_depth && row['depth'] <= max_depth
        });


    data = filteredData

    // We store the data object in the variable which is accessible from
    // outside of this function.
    earthquakeData = data;

    // This maps the data of the CSV so it can be easily accessed by
    // the ID of the state, for example: dataById[Italy]
    dataById = d3.group(data, (d) => d.state);

    // get the circle selection and add the data
    var circles = svg.selectAll("circle")
        .remove() // this clears any existing circles we have, which will need updated x/y data on resize
        .data(data);
    
    // Append new circles and set their initial attributes
    circles
      .enter()
      .append('circle')
      .attr('class', 'earthquake')
      .attr('id', 'circle_earthquake')
      .attr('cx', (d) => projection([d.longitude, d.latitude])[0])
      .attr('cy', (d) => projection([d.longitude, d.latitude])[1])
      .style('fill', (d) => eqColorScale(parseInt(d.magnitudo)))
      .on('click', function(event, f) {clickCircle(f)})
      .on('dblclick', function(event, f) {
        country = f['state']
        const map_country = d3.select(`path[id="${country}"]`);
        if (selectedCountries.includes(country)) {
          map_country.style("fill", "black");
          const index = selectedCountries.indexOf(country);
          selectedCountries.splice(index, 1);
          colorToRemove = country_colors[country]
          delete country_colors[country];
          selectedColors = selectedColors.filter(item => item !== colorToRemove)
        } else {
          map_country.style("fill", "red");
          selectedCountries.push(country);
          choosedColor = get_color()
          country_colors[country] = choosedColor
          selectedColors.push(color)
        }
      })
      .attr('r', (d) => eqSizeScale(d.magnitudo))
      .attr('mag', (d) => d.magnitudo);
      
      // remove any exit selection
      circles.exit().remove();

      mapFeatures.selectAll('path')
      .data(features.features)
      .join('path') // Use `join` to handle enter, update, and exit selections
      .attr('d', path)
      .attr("id", d => {return d["properties"]["ADMIN"];})
      .style("fill", "black")
      .on('click', function(event, f) {
        showDetails(f)
      })
      .on('dblclick', function(event, f) {
        const country = getIdOfFeature(f);
    
        if (selectedCountries.includes(country)) {
          d3.select(this).style("fill", "black");
          const index = selectedCountries.indexOf(country);
          selectedCountries.splice(index, 1);
          colorToRemove = country_colors[country]
          delete country_colors[country];
          selectedColors = selectedColors.filter(item => item !== colorToRemove)
        } else {
          d3.select(this).style("fill", "red");
          selectedCountries.push(country);
          choosedColor = get_color()
          country_colors[country] = choosedColor
          selectedColors.push(color)
        }
      });

      addMagnitudeLegend();

    });

  });
}

function get_color() {
  for (color of colors) {
    if (selectedColors.includes(color)){
      continue
    }
    return color
  }
}

var addMagnitudeLegend = function()
{
const legendObjs = [];
  eqDomain.forEach(function(d,i) {
     legendObjs[i] = { mag: d };
  });


// Some sizing and location info
var lNodeSize = 40;
var lXOffset = 15; 
var lYOffset = 5;
var lTopLeft = [lXOffset, height - lNodeSize - lNodeSize / 3 - lYOffset ];
var lBottomRight = [ (lNodeSize + 1) * legendObjs.length, height - lYOffset];

// Add a bounding rectangle
svg.append("rect")
  .attr("class", "legend-box")
  .attr("width", lBottomRight[0] - lTopLeft[0] + "px")
  .attr("height", lBottomRight[1] - lTopLeft[1])
  .style("fill", "white")
  .attr("transform", "translate(" + lTopLeft[0] + "," + lTopLeft[1] + ")");

// Append the data and get the enter selection
var lnodes = svg.selectAll("g.leg")
  .data(legendObjs)
  .join("g")
  .attr("class", "leg");

// Append the circles to the enter selection
lnodes.append("circle")
  .attr("r", function (d) { return eqSizeScale(d.mag); })
  .attr("class", "earthquake")
  .style("fill", function (d) { return eqColorScale(d.mag); })
  .attr("transform", function (d, i) {
    d.x = 2 * lXOffset + lNodeSize * i;
    d.y = lBottomRight[1] - lNodeSize / 2;
    return "translate(" + d.x + "," + d.y + ")";
  });

// Append the text to each "svg:g" node, which also contains a circle
lnodes.append("text")
  .text(function (d) { return "M" + d.mag; })
  .attr("class", "legend-mag-text")
  .attr("text-anchor", "middle")
  .style('fill', 'black')
  .attr("transform", function (d) {
    return "translate(" + d.x + "," + (d.y - 15) + ")";
  });

}

function clickCircle(f) {
  showStateDetails(f['state'])
}

function showDetails(f) {
  var id = getIdOfFeature(f);
  showStateDetails(id)

}

function showStateDetails(countryName) {
  const data = dataById.get(countryName);  

  var columns = ['magnitudo', 'depth', 'significance', 'date'], column_id = 'state', column_class = 'norm';
  var h1 = d3.select('#details_h1')
  var table1 = d3.select('#map_table')
  table1.selectAll("tr, td, thead, tbody").remove();
  var thead = table1.append('thead');
  var tbody = table1.append('tbody');

  if (data != undefined) {
      state = data[0]['state']
      count = data.length
      h1.text(state + " : " + count)
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
              value: column == "date" ? new Date(row[column]).toUTCString() : row[column],
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
 * Zoom the features on the map. This rescales the features on the map.
 * Keep the stroke width proportional when zooming in.
 */
function doZoom(event) {
  const transform = event.transform;
  console.log(event.transform)
  mapFeatures.attr("transform", transform);
  mapFeatures.style("stroke-width", 0.5 / transform.k + "px");
  svg.selectAll("#circle_earthquake")
    .attr("transform", transform)
    .attr("r", function(d) {
      var mag = d3.select(this).attr("mag")
      var newR = eqSizeScale(mag) / transform.k;
      return newR;
    })
    .style("stroke-width", 0.5 / transform.k + "px");
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
  const bbox_path = d3.geoBounds(features);

  // Calculate the scaling factor
  const scale = 0.95 / Math.max(
    (bbox_path[1][0] - bbox_path[0][0]) / width,
    (bbox_path[1][1] - bbox_path[0][1]) / height
  );

  // Get the bounding box of the features (in map units!) and use it
  // to calculate the center of the features.
  const bbox_feature = d3.geoBounds(features);

  // Calculate the center
  const center = [
    (bbox_feature[1][0] + bbox_feature[0][0]) / 2,
    (bbox_feature[1][1] + bbox_feature[0][1]) / 2
  ];

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
  return f.properties.ADMIN;
}