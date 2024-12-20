//Scatterplot's Animation Reference:
//The path animation is derived from the animation of Connected scartterplot published by D3 on Observable (https://observablehq.com/@d3/connected-scatterplot/2)
chart = {
    replay;
  
    // Declare the chart dimensions and margins.
    const width = 928;
    const height = 720;
    const marginTop = 20;
    const marginRight = 30;
    const marginBottom = 30;
    const marginLeft = 40;
  
    // Declare the positional encodings.
    const x = d3.scaleLinear()
        .domain(d3.extent(driving, d => d.miles)).nice()
        .range([marginLeft, width - marginRight]);
  
    const y = d3.scaleLinear()
        .domain(d3.extent(driving, d => d.gas)).nice()
        .range([height - marginBottom, marginTop]);
  
    const line = d3.line()
        .curve(d3.curveCatmullRom)
        .x(d => x(d.miles))
        .y(d => y(d.gas));
  
    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .attr("style", "max-width: 100%; height: auto;");
  
    const l = length(line(driving));
  
    svg.append("g")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .call(d3.axisBottom(x).ticks(width / 80))
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll(".tick line").clone()
            .attr("y2", -height)
            .attr("stroke-opacity", 0.1))
        .call(g => g.append("text")
            .attr("x", width - 4)
            .attr("y", -4)
            .attr("font-weight", "bold")
            .attr("text-anchor", "end")
            .attr("fill", "currentColor")
            .text("Miles per person per year"));
    
    svg.append("g")
      .attr("transform", `translate(${marginLeft},0)`)
      .call(d3.axisLeft(y).ticks(null, "$.2f"))
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll(".tick line").clone()
          .attr("x2", width)
          .attr("stroke-opacity", 0.1))
      .call(g => g.select(".tick:last-of-type text").clone()
          .attr("x", 4)
          .attr("text-anchor", "start")
          .attr("font-weight", "bold")
          .text("Cost per gallon"));
  
    svg.append("path")
        .datum(driving)
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", 2.5)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("stroke-dasharray", `0,${l}`)
        .attr("d", line)
      .transition()
        .duration(5000)
        .ease(d3.easeLinear)
        .attr("stroke-dasharray", `${l},${l}`);
  
    svg.append("g")
        .attr("fill", "white")
        .attr("stroke", "black")
        .attr("stroke-width", 2)
      .selectAll("circle")
      .data(driving)
      .join("circle")
        .attr("cx", d => x(d.miles))
        .attr("cy", d => y(d.gas))
        .attr("r", 3);
  
    const label = svg.append("g")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
      .selectAll()
      .data(driving)
      .join("text")
        .attr("transform", d => `translate(${x(d.miles)},${y(d.gas)})`)
        .attr("fill-opacity", 0)
        .text(d => d.year)
          .attr("stroke", "white")
          .attr("paint-order", "stroke")
          .attr("fill", "currentColor")
          .each(function(d) {
            const t = d3.select(this);
            switch (d.side) {
              case "top": t.attr("text-anchor", "middle").attr("dy", "-0.7em"); break;
              case "right": t.attr("dx", "0.5em").attr("dy", "0.32em").attr("text-anchor", "start"); break;
              case "bottom": t.attr("text-anchor", "middle").attr("dy", "1.4em"); break;
              case "left": t.attr("dx", "-0.5em").attr("dy", "0.32em").attr("text-anchor", "end"); break;
            }
          });
  
    label.transition()
        .delay((d, i) => length(line(driving.slice(0, i + 1))) / l * (5000 - 125))
        .attr("fill-opacity", 1);
  
    return svg.node();
}



//Legend Reference:
// Flexible legend-drawing function - Jeff Rzeszotarski, 2022
//   Released under MIT Free license
//  Takes in an SVG element selector <legendSelector> and a d3 color scale <legendColorScale>
//
// Usage example: drawLegend("#legendID", grossIncomeColorScale)
function drawLegend(legendSelector, legendColorScale) {
    
    // This code should adapt to a variety of different kinds of color scales
    //  Credit Prof. Rz if you are basing a legend on this structure, and note PERFORMANCE CONSIDERATIONS
    
    // Shrink legend bar by 5 px inwards from sides of SVG
    const offsets = { width: 10,
                        top: 2,
                        bottom: 24 }; 
    // Number of integer 'pixel steps' to draw when showing continuous scales
    //    Warning, not using a canvas element so lots of rect tags will be created for low stepSize, causing issues with performance -- keep this large
    const stepSize = 4; 
    // Extend the minmax by 0% in either direction to expose more features by default
    const minMaxExtendPercent = 0;
        
    
    const legend = d3.select(legendSelector);
    const legendHeight = legend.attr("height");
    const legendBarWidth = legend.attr("width") - (offsets.width * 2);
    const legendMinMax = d3.extent(legendColorScale.domain()); 
                // recover the min and max values from most kinds of numeric scales
    const minMaxExtension = (legendMinMax[1] - legendMinMax[0]) * minMaxExtendPercent;
    const barHeight = legendHeight - offsets.top - offsets.bottom;     
    
    // In this case the "data" are pixels, and we get numbers to use in colorScale
    // Use this to make axis labels
    let barScale = d3.scaleLinear().domain([legendMinMax[0]-minMaxExtension,
                                                legendMinMax[1]+minMaxExtension])
                                    .range([0,legendBarWidth]);
    let barAxis = d3.axisBottom(barScale);
    
    // Place for bar slices to live
    let bar = legend.append("g")
                    .attr("class", "legend colorbar")
                    .attr("transform", `translate(${offsets.width},${offsets.top})`)
    
    // ****** SWITCHES FOR DIFFERENT SCALE TYPES ******
    
    // Check if we're using a binning scale - if so, we make blocks of color
    if (legendColorScale.hasOwnProperty('thresholds') || legendColorScale.hasOwnProperty('quantiles')) {
        // Get the thresholds
        let thresholds = [];
        if (legendColorScale.hasOwnProperty('thresholds')) { thresholds = legendColorScale.thresholds() }
        else { thresholds = legendColorScale.quantiles() }
        
        const barThresholds = [legendMinMax[0], ...thresholds, legendMinMax[1]];
        
        // Use the quantile breakpoints plus the min and max of the scale as tick values
        barAxis.tickValues(barThresholds);
        
        // Draw rectangles between the threshold segments
        for (let i=0; i<barThresholds.length-1; i++) {
        let dataStart = barThresholds[i];
        let dataEnd = barThresholds[i+1];
        let pixelStart = barAxis.scale()(dataStart);
        let pixelEnd = barAxis.scale()(dataEnd);
        
        bar.append("rect")
            .attr("x", pixelStart)
            .attr("y", 0)
            .attr("width", pixelEnd - pixelStart )
            .attr("height", barHeight)
            .style("fill", legendColorScale( (dataStart + dataEnd) / 2.0 ) ); 
        }
    }
    // Else if we have a continuous / roundable scale
    //  In an ideal world you might construct a custom gradient mapped to the scale
    //  For this one, we use a hack of making stepped rects
    else if (legendColorScale.hasOwnProperty('rangeRound')) {
        // NOTE: The barAxis may round min and max values to make them pretty
        // ** This also means there is a risk of the legend going beyond scale bounds
        // We need to use the barAxis min and max just to be sure the bar is complete
        //    Using barAxis.scale().invert() goes from *axis* pixels to data values easily
        // ** We also need to create patches for the scale if the labels exceed bounds
        //     (floating point comparisons risky for small data ranges,but not a big deal
        //      because patches will be indistinguishable from actual scale bottom)
        // It's likely that scale clamping will actually do this for us elegantly
        // ...but better to be safer and patch the regions anyways
        
        for (let i=0; i<legendBarWidth; i=i+stepSize) {
        
        let center = i+(stepSize/2);
        let dataCenter = barAxis.scale().invert( center );
        
        // below normal scale bounds
        if ( dataCenter < legendMinMax[0] ) { 
            bar.append("rect")
                .attr("x", i)
                .attr("y", 0)
                .attr("width", stepSize)
                .attr("height",barHeight)
                .style("fill", legendColorScale( legendMinMax[0] ) ); 
            }
            // within normal scale bounds
            else if ( dataCenter < legendMinMax[1] ) {
            bar.append("rect")
                .attr("x", i)
                .attr("y", 0)
                .attr("width", stepSize)
                .attr("height",barHeight)
                .style("fill", legendColorScale( dataCenter ) ); 
            }
            // above normal scale bounds
            else {
            bar.append("rect")
                .attr("x", i)
                .attr("y", 0)
                .attr("width", stepSize)
                .attr("height",barHeight)
                .style("fill", legendColorScale( legendMinMax[1] ) ); 
            }
        
        }
    }
    // Otherwise we have a nominal scale
    else {
        let nomVals = legendColorScale.domain().sort();
        
        // Use a scaleBand to make blocks of color and simple labels
        let barScale = d3.scaleBand().domain(nomVals)
                                    .range([0,legendBarWidth])
                                    .padding(0.05);
        barAxis.scale(barScale);
        
        // Draw rectangles for each nominal entry
        nomVals.forEach( d => {
        bar.append("rect")
            .attr("x", barScale(d) )
            .attr("y", 0)
            .attr("width", barScale.bandwidth() )
            .attr("height", barHeight)
            .style("fill", legendColorScale( d ) );
        });
    }
    // DONE w/SWITCH
    
    // Finally, draw legend labels
    legend.append("g")
            .attr("class", "legend axis")
            .attr("transform",`translate(${offsets.width},${offsets.top+barHeight+5})`)
            .call(barAxis);
    
    }
      