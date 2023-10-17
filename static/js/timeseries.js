function clear_timeseries(){
    d3.select("#TIMESERIES_charts").selectAll("div").remove().remove()
    d3.select("#TIMESERIES_legend").remove()
}

function load_timeseries(dataByCountry, countryColors) {
    // each magnitude = 1 graph
    // each country 1 color part bar in stack
    // each year X
    // count (year, mag) Y 
    clear_timeseries()
    console.log(dataByCountry);
    convertedData = convert_data(dataByCountry);
    console.log(convertedData);
    const magnitudes = Object.getOwnPropertyNames(convertedData);
    console.log(magnitudes)
    for (const magnitude of magnitudes) {
        append_timeseries(convertedData[magnitude], countryColors);
      }

}


function append_timeseries(data, countryColors) {
    console.log(data)
    normalizedData = preprocessData(data)
    data = normalizedData.data
    countries = normalizedData.countries
    console.log(data)
    const parentElementTimeseries = d3.select("#TIMESERIES_charts")
    svgParent = parentElementTimeseries.append("div")
        .attr("class", "row")
        .style("padding-top", "15px");
    // set the dimensions and margins of the graph
    const margin = {top: 0, right: 0, bottom: 0, left: 20};

    let width = (window.innerWidth / 2) - (window.innerWidth * 0.04);
    let height = (window.innerHeight / 2);

    width = width - margin.left - margin.right;
    height = height - margin.top - margin.bottom;

    console.log(height)
    maxMinY = findMaxMinSums(data)
    const maxY = maxMinY.max
    const minY = maxMinY.min
    // append the svg object to the body of the page
    const timeserieSVG = svgParent.append("svg")
        .attr("id","timeseries-svg")
        .attr("width", 100 + "%")
        .attr("height", height + 50)
        .attr("preserveAspectRatio", "xMinYMin")
    .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);


    // list of value keys
    const typeKeys = countries
    console.log(typeKeys)

    // stack the data
    const stack = d3.stack()
    .keys(typeKeys)
    .order(d3.stackOrderNone)
    .offset(d3.stackOffsetNone)

    const stackedData = stack(data)
    console.log(stackedData)

    // X scale and Axis
    const xScale = d3.scaleBand()
    .domain(data.map(d => d.year))
    .range([0, width])
    .padding(.2);
    timeserieSVG
    .append('g')
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(xScale).tickSize(0).tickPadding(8));

    // Y scale and Axis
    const yScale = d3.scaleLinear()
        .domain([0, maxY])
        .range([height, 0]);
    timeserieSVG
    .append('g')
    .call(d3.axisLeft(yScale).ticks(9).tickSize(0).tickPadding(6))
    .call(function(d) { return d.select(".domain").remove()});

    // color palette
    const color = d3.scaleOrdinal()
    .domain(typeKeys)
    .range(['#0072BC','#8EBEFF'])

    // set horizontal grid line
    const GridLine = function() {return d3.axisLeft().scale(yScale)};
    timeserieSVG.append("g")
        .attr("class", "grid")
    .call(GridLine()
        .tickSize(-width,0,0)
        .tickFormat("")
    );

    // create a tooltip
    const tooltip = svgParent
        .append("div")
        .attr("class", "mytooltip")
        .style("position", "fixed");

    // Three function that change the tooltip when user hover / move / leave a cell
    const mouseover = function(d) {
        tooltip.style("opacity", .9)
        d3.select(this).style("opacity", .5)
    }
    const mousemove = function(event, d) {
        console.log(d)
        const formater =  d3.format(",")
            tooltip
            .html(formater(d[1]))
            .style("display", "block")
            .style("top", (event.clientY + window.scrollY) + 20 + "px")
            .style("left", (event.clientX + window.scrollX) + 20 + "px");
        }
    const mouseleave = function(d) {
        tooltip.style("opacity", 1)
        d3.select(this).style("opacity", 1)
    }

    // create bars
    timeserieSVG.append("g")
    .selectAll("g")
    .data(stackedData)
    .enter()
    .append("g")
        .attr("fill", d => {return countryColors[d.key]} )
        .selectAll("rect")
        .data(d => d)
        .join("rect")
        .attr("x",d => xScale(d.data.year))
        .attr("y",d => yScale(d[1]))
        .attr("width", xScale.bandwidth())
        .attr("height", d => { console.log(d); return yScale(d[0]) - yScale(d[1]) })
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave)

    // set Y axis label
    timeserieSVG
    .append("text")
        .attr("class", "chart-label")
        .attr("x", -(margin.left)*0.6)
        .attr("y", -(margin.top/13))
        .attr("text-anchor", "start")
    .text("Number of earthquakes")


    //set legend
    x_counter = 0;
    y_counter = 0
    for (const country in countryColors) {
        if (x_counter % 5 == 0 && x_counter != 0) {
            y_counter += 1
            x_counter = 0
        }
        timeserieSVG
        .append("rect")
            .attr("x", -(margin.left)*0.6 + (x_counter * 80))
            .attr("y", -(margin.top/2) + (y_counter * 20))
            .attr("width", 20)
            .attr("height", 10)
            .style("fill", countryColors[country])
        timeserieSVG
        .append("text")
            .attr("class", "legend")
            .attr("x", -(margin.left)*0.6+25 + (x_counter * 80))
            .attr("y", -(margin.top/2.5) + (y_counter * 20))
        .text(country)
        x_counter += 1
    }    

}

function findMaxMinSums(data) {
    let maxSum = -Infinity;
    let minSum = Infinity;
  
    for (const entry of data) {
      const year = entry.year;
      let yearSum = 0; // Initialize the sum for the current year
  
      for (const country in entry) {
        if (country !== "year") {
          yearSum += entry[country]; // Add the value for the current country in the year
        }
      }
  
      // Update maxSum and minSum as needed
      if (yearSum > maxSum) {
        maxSum = yearSum;
      }
      if (yearSum < minSum) {
        minSum = yearSum;
      }
    }
  
    return { max: maxSum, min: minSum };
  }

function convert_data(originalData) {
    const transformedData = {};

    for (const country in originalData) {
      const countryData = originalData[country];
    
      for (const entry of countryData) {
        const year = new Date(entry.date).getFullYear();
        const magnitude = Math.floor(parseFloat(entry.magnitudo)); // Take only the integer part
    
        if (!transformedData[magnitude]) {
          transformedData[magnitude] = [];
        }
    
        const yearEntry = transformedData[magnitude].find((item) => item.year === year);
    
        if (yearEntry) {
          yearEntry[country] = (yearEntry[country] || 0) + 1;
        } else {
          const newEntry = { year };
          newEntry[country] = 1;
          transformedData[magnitude].push(newEntry);
        }
      }
    }
    
    // Sort the arrays within each magnitude by year
    for (const magnitude in transformedData) {
      transformedData[magnitude] = transformedData[magnitude].sort((a, b) => a.year - b.year);
    }

    return transformedData
}


function preprocessData(data) {
    const allCountries = new Set();
    const years = data.map(entry => entry.year);
    
    // Find all unique country names
    data.forEach(entry => {
      Object.keys(entry).forEach(key => {
        if (key !== "year") {
          allCountries.add(key);
        }
      });
    });
  
    // Create an array of objects for each year with all countries
    const result = years.map(year => {
      const entry = { year };
      allCountries.forEach(country => {
        entry[country] = data.find(d => d.year === year && d[country])?.[country] || 0;
      });
      return entry;
    });
  
    return {"data": result, "countries": allCountries};
  }