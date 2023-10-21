function reset_scatterplot() {
    console.log(d3.select("#scatterplot").select("svg"))
    d3.select("#scatterplot").select("svg").remove();
    d3.select("#TSNE_colors_legend_1").select("svg").remove();
    d3.select("#TSNE_colors_legend_2").select("svg").remove();
    d3.select("#TSNE_info_legend").selectAll("div").remove().remove()
  }

function load_scatterplot(data, input, countryColors) {
    console.log(data)
    console.log(input)
    console.log(countryColors)
    reset_scatterplot()
    load_click_circle()
    const xyvalues = calculate_min_max(data)

    const parent_svg_div = d3.select("#scatterplot")
        .append("p")
        .text("** Parameters used: Magnitude, Latitude, Longitude, Depth, Significance")

    // set the dimensions and margins of the graph
    let margin = {top: 10, right: 30, bottom: 30, left: 60},
    width = (window.innerWidth / 2) - (window.innerWidth * 0.04) ,
    height = (window.innerHeight / 2);

    // append the svg object to the body of the page
    const svg_scatter = d3.select("#scatterplot")
    .append("svg")
    .attr("id","scatter-svg")
    .attr("width", width + 30)
    .attr("height", height + 30)
    .append("g")
    .attr("transform",
        "translate(" + 15 + "," + 10 + ")");

    // Add X axis
    let x = d3.scaleLinear()
    .domain([xyvalues.minX, xyvalues.maxX])
    .range([ 0, width ]);

    svg_scatter.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));

    // Add Y axis
    let y = d3.scaleLinear()
    .domain([xyvalues.minY, xyvalues.maxY])
    .range([ height, 0]);

    svg_scatter.append("g")
    .call(d3.axisLeft(y));

    picked_colors = []
    
    for (const key in data) {
        svg_scatter.selectAll(key)
        .data(data[key])
        .enter()
        .append("circle")
        .attr("cx", d => x(d.tsneX))
        .attr("cy", d => y(d.tsneY))
        .attr("r", 3)
        .style("fill", countryColors[key])
        .on('click', function(event, f) {getDetail(f, data[key], input[key])});
    }
    loadLegend(countryColors)
}

function loadLegend(countryColors){
    d3.select("#TSNE_text").remove();
    const legendData = Object.entries(countryColors).map(([label, color]) => ({ label, color }));
    parentElement1 = d3.select("#TSNE_colors_legend_1")
    parentElement2 = d3.select("#TSNE_colors_legend_2")

    width = ((window.innerWidth / 2) - (window.innerWidth * 0.04)) / 2 ,
    height = 110;

    len_data = legendData.length
    if (len_data > 5) {
        data1 = legendData.slice(0, 5)
        data2 = legendData.slice(5, len_data)
        load_svg_legend(parentElement1, data1)
        load_svg_legend(parentElement2, data2)
    } else {
        load_svg_legend(parentElement1, legendData)
    }
    
}

function load_svg_legend(parentElement, legendData) {
    const svg = parentElement
        .append("svg")
        .attr("id","legend-scatter-svg")
        .attr("width", width)
        .attr("height", height);

    // Create a legend group
    const legend = svg
    .append("g")
    .attr("class", "legend")
    .attr("transform", "translate(10, 10)");

    // Bind data to create legend items
    const legendItems = legend
    .selectAll(".legend-item")
    .data(legendData)
    .enter()
    .append("g")
    .attr("class", "legend-item")
    .attr("transform", (d, i) => `translate(0, ${i * 20})`); // Vertical spacing

    // Add squares
    legendItems
    .append("rect")
    .attr("width", 16)
    .attr("height", 16)
    .attr("fill", (d) => d.color);

    // Add labels
    legendItems
    .append("text")
    .attr("x", 24) // Distance from the colored square
    .attr("y", 12) // Vertical alignment
    .text((d) => d.label);
}

function load_click_circle() {
    parentElement = d3.select("#TSNE_info_legend")
    let rowDiv = parentElement.append("div")
        .attr("class", "row")
        .style("padding-top", "15px");
    let col1Div = rowDiv.append("div")
        .attr("class", "col-sm-12");
    col1Div.append("h3")
        .text("Click on circles to load details here")
        .style("text-align", "center");
}

function getDetail(f, data, input){
    parentElement = d3.select("#TSNE_info_legend")
    parentElement.style("margin-top", "15px")
    parentElement.selectAll("div").remove()
    const idx = data.findIndex(obj => obj.tsneX === f.tsneX && obj.tsneY === f.tsneY);
    country_info = input[idx]

    // Convert the object entries into an array of pairs
    let entries = Object.entries(country_info);

    // Iterate over the pairs two at a time
    for (let i = 0; i < entries.length; i += 2) {
        let pair1 = entries[i];
        let pair2 = entries[i + 1];
        if (pair1[0] == "state"){
            continue
        }

        if (pair1[0] == "date") {
            date = new Date(pair1[1])
            let day = date.getUTCDate();
            let month = date.getUTCMonth() + 1; // Add 1 because months are 0-indexed
            let year = date.getUTCFullYear();
            let hours = date.getUTCHours();
            let minutes = date.getUTCMinutes();
            pair1[1] =
            (day < 10 ? '0' : '') + day + '/' +
            (month < 10 ? '0' : '') + month + '/' +
            year + ' ' +
            (hours < 10 ? '0' : '') + hours + ':' +
            (minutes < 10 ? '0' : '') + minutes;
        }
        let rowDiv = parentElement.append("div")
            .attr("class", "row");
        if (pair2) {
            let col1Div = rowDiv.append("div")
                .attr("class", "col-sm-6");
            let col2Div = rowDiv.append("div")
                .attr("class", "col-sm-6");
            col1Div.append("p")
                .text(pair1[0] + ": " + pair1[1])
                .style("text-align", "left");
            col2Div.append("p")
                .text(pair2[0] + ": " + pair2[1])
                .style("text-align", "left");
        }
        else {
            let col1Div = rowDiv.append("div")
                .attr("class", "col-sm-12");
            col1Div.append("p")
                .text(pair1[0] + ": " + pair1[1])
                .style("text-align", "left");
        }

    }
}

function calculate_min_max(data){
    let maxX = -99999999999
    let maxY = -99999999999
    let minX = 99999999999
    let minY = 99999999999
    for (const key in data) {
        if (data.hasOwnProperty(key)) {
        // Iterate through the array of objects for each key
        data[key].forEach(obj => {
            minX = Math.min(minX, obj.tsneX);
            maxX = Math.max(maxX, obj.tsneX);
            minY = Math.min(minY, obj.tsneY);
            maxY = Math.max(maxY, obj.tsneY);
        });
        }
    }
    return {minX, maxX, minY, maxY}
}