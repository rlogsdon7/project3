class CharacterBrush {
  constructor(_config, _data,_refresh) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 500,
      containerHeight: _config.containerHeight || 140,
      margin: { top: 40, bottom: 40, right: 50, left: 60 },
      contextWidth: 40,
      contextMargin: 20
    }
    this.data = _data; 
    this.refresh = _refresh
    this.initVis();
  }

  initVis() {
    let vis = this;
    vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right - vis.config.margin.left + vis.config.contextMargin;
    vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;
    

    // Define size of SVG drawing area
    vis.svg = d3.select(vis.config.parentElement)
        .attr('width', vis.config.containerWidth)
        .attr('height', vis.config.containerHeight);
    //Title
    vis.svg.append("text")
       .attr('transform', `translate(${vis.width/2}, ${vis.config.margin.top - 15 })`)
       .attr("class", "underline")
       .text("Lines Spoken By Characters")
       .style("font-family", "Roboto")
        .style("color", "black")
        .style("font-size", "18px");

    // X axis Label    
    vis.svg.append("text")
       .attr("transform", `translate(${vis.width/1.35},${vis.height + vis.config.margin.bottom + 35})`)
       .style("text-anchor", "middle")
       .text("Number of Lines Spoken")
       .style("font-family", "Roboto")
        .style("color", "black")
        .style("font-size", "14px")

    // Y axis Label    
    vis.svg.append("text")
       .attr("transform", "rotate(-90)")
       .attr("x", -(vis.height/2) - vis.config.margin.top)
       .attr("y", 35)
       .style("text-anchor", "middle")
       .text("Character Name")
       .style("font-family", "Roboto")
        .style("color", "black")
        .style("font-size", "14px");
    vis.yAxisLine = vis.svg.append("line")
        .attr("x1", vis.config.contextWidth + vis.config.contextMargin -1)
        .attr("y1", vis.config.margin.top )
        .attr("x2", vis.config.contextWidth + vis.config.contextMargin -1)
        .attr("y2", vis.height + vis.config.margin.top)
        .attr("stroke", "black")
        .attr("stroke-width", 1);
    vis.static = true;
    vis.updateVis(); //call updateVis() at the end - we aren't using this yet. 
  }
/**
   * Prepare the data and scales before we render it.
   */
  updateVis() {
    let vis = this;
    vis.svg.selectAll('.y-axis').remove();
    vis.svg.selectAll('.x-axis').remove();
    vis.svg.selectAll('.chart').remove();
    vis.svg.selectAll('.plan').remove();
    vis.svg.selectAll('.no-data-text').remove();
    vis.svg.selectAll('.rectsdrawn').remove();


    
    let yMax = vis.data.length-1
    if (yMax > 11){
      yMax = 11
    }
    if(yMax == 1){
    vis.yScale = d3.scaleLinear()
        .domain([-.5,1.5])
        .range([0, vis.height])
    vis.yContext = d3.scaleLinear()
      .domain([-.5,1.5])
      .range([0, vis.height])
    }
    else{
      vis.yScale = d3.scaleLinear()
        .domain([0,yMax])
        .range([0, vis.height])
      vis.yContext = d3.scaleLinear()
      .domain([d3.min(vis.data, d => d.id),d3.max(vis.data, d => d.id)])
      .range([0, vis.height])
    }

    

    var max = d3.max( vis.data, d => d.lines)
    //console.log(vis.data)
    vis.chart = vis.svg.append('g')
        .attr('transform', `translate(${vis.config.margin.left + vis.config.contextMargin + vis.config.contextWidth},${vis.config.margin.top})`);

    if(vis.data.length ==0){
        //do this so it looks good when there is no data
        max = 1;

      // Add text in the center of the chart if there is no data
      vis.chart.append('text')
        .attr('class', 'no-data-text')
        .attr('transform', `translate(${vis.width / 2}, ${vis.height / 2})`)
        .attr('text-anchor', 'middle')
        .text('No Data to Display')
        .style("font-family", "Roboto")
        .style("color", "black")
        .style("font-size", "14px");


      vis.yAxisLine = vis.svg.append("line")
        .attr("x1", vis.config.contextWidth + vis.config.contextMargin + vis.config.margin.left)
        .attr("y1", vis.config.margin.top )
        .attr("x2", vis.config.contextWidth + vis.config.contextMargin + vis.config.margin.left)
        .attr("y2", vis.height + vis.config.margin.top)
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .attr('class', 'no-data-text')
      vis.xAxisLine = vis.svg.append("line")
        .attr("x1", vis.config.contextWidth + vis.config.contextMargin + vis.config.margin.left)
        .attr("y1", vis.height + vis.config.margin.top)
        .attr("x2", vis.config.contextWidth + vis.config.contextMargin + vis.config.margin.left + vis.width)
        .attr("y2", vis.height + vis.config.margin.top)
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .attr('class', 'no-data-text')
    }
    else{


      // Initialize scales
      vis.xScale = d3.scaleLinear()
        .domain([0, max])
        .range([0, vis.width])
        .nice();

      // Initialize axes
      vis.xAxis = d3.axisBottom(vis.xScale)
        .ticks()

      vis.yAxis = d3.axisLeft(vis.yScale)
        .ticks(6)
        .tickSizeOuter(0)
        .tickPadding(10)

      // X axis: scale and draw:
      vis.xContext = d3.scaleLinear()
        .range([0, vis.config.contextWidth])
        .domain([0, max]);   

      vis.contextRects = vis.svg.append('g').attr('class', 'rects');

      // Append group element that will contain our actual chart (see margin convention)
      
      vis.brushChart = vis.svg.append('g')
        .attr('transform', `translate(0,${vis.config.margin.top})`);

      // Append y-axis group
      vis.yAxisG = vis.chart.append('g')
        .attr('class', 'axis y-axis')

      vis.svg.append('defs').append('clipPath')
        .attr('id', 'clipChar')
        .attr('class', 'chart')
        .append('rect')
        .attr('x',  0)
        .attr('y',  0)
        .attr('width', vis.width - vis.config.contextWidth + vis.config.contextMargin)
        .attr('height', vis.height)

      vis.contextRects.selectAll('rect')
        .data(vis.data)
        .join('rect')
        .attr('class', 'plan')
        .attr('data',(d) => d.id)
        .style("fill", "#d2d2d2")
        .style("border-left","none")
        .attr('y', (d) => {
          return vis.config.margin.top + vis.yContext(d.id)}) 
        .attr('height', "15")
        .attr('x', vis.config.contextMargin + vis.config.contextWidth)
        .attr('width', (d) => vis.xContext(d.lines));

      // Add the brush
      vis.brush = d3.brushY()
        .extent([[vis.config.margin.left -1, 0], [vis.config.contextWidth + vis.config.margin.left,vis.height]])
        .on('brush', function({selection}) {
            if (selection) vis.brushed(selection);
          })
      let defaultBrushSelection = [vis.yContext(0), vis.yContext(yMax)]
      if(yMax == 1){
         defaultBrushSelection = [vis.yContext(-.5), vis.yContext(1.5)]
      }
      vis.brushG = vis.brushChart.append('g')
        .attr('class', 'plan')
        .call(vis.brush) // initialize the brush
        .call(vis.brush.move, defaultBrushSelection)

      vis.brushG.selectAll(".resize").remove();
      vis.svg.selectAll('.handle ').remove();
      vis.svg.selectAll('.overlay').remove();
      vis.chart.attr('clip-path', 'url(#clipChar)');
    }
  }
   brushed(selection) {
    let vis = this;

    // Check if the brush is still active or if it has been removed
    if (selection) {
      vis.selectedDomain = selection.map(vis.yContext.invert, vis.yContext);
      vis.yScale.domain(vis.selectedDomain)
      
      //do the same for the range
      var xData = vis.data
      var xMax = 1;
      var j = vis.selectedDomain[1]
      if(j == 0){
        j = 1
      }
      if(j > vis.data.length){
        j = vis.data.length
      }
      var i = Math.floor(vis.selectedDomain[0])
      if(i < 0){
        i = 0
      }
      for(i; i < j; i++){
        if(xData.filter(e => e.id === i)[0].lines>xMax){
          xMax = xData.filter(e => e.id === i)[0].lines
        }
      } 

      vis.xScale.domain([0,xMax])

    } 
    vis.svg.selectAll('.rectsdrawn').remove();

    vis.rects = vis.chart.selectAll('rect')
      .data(vis.data)
      .join('rect')
      .attr('class', 'rectsdrawn')
      .attr('data',(d) => d.id)
      .attr('fill', "#ffe144")
      .attr("stroke", "#a18700")
      .style("border-left","none")
      .attr('y', (d) => {
        return vis.yScale(d.id)}) 
      .attr('id', (d) => {
        return "byDisc" + d.id})
      .attr('height', "15")
      .attr('x', 1)
      .attr('width', 0)

    vis.rects
    .on('mouseover', (event,d) => {
      var formattedName = d.name;
      if (formattedName === 'C. Montgomery Burns') {
        formattedName = "Charles Montgomery Burns";
      } else if (formattedName === 'Grampa Simpson') {
        formattedName = "Abe Simpson II";
      } else if (formattedName === 'Chief Wiggum') {
        formattedName = "Clancy Wiggum";
      } else if (formattedName === 'Waylon Smithers'){
        formattedName = "Waylon_Smithers,_Jr.";
      } else if (formattedName === 'Dr. Julius Hibbert'){
        formattedName = "Julius_Hibbert";
      } else if (formattedName === 'Rev. Timothy Lovejoy'){
        formattedName = "Timothy_Lovejoy";
      } else if (formattedName === 'Sideshow Bob'){
        formattedName = "Robert_Terwilliger";
      } else if (formattedName === 'Mayor Joe Quimby'){
        formattedName = "Joe_Quimby";
      } else if (formattedName === 'Martin Prince'){
        formattedName = "Martin_Prince,_Jr.";
      } else if (formattedName === 'HERB'){
        formattedName = "Herbert_Powell";
      } else if (formattedName === 'Miss Hoover'){
        formattedName = "Elizabeth_Hoover";
      } else if (formattedName === 'Dr. Nick Riviera'){
        formattedName = "Nick_Riviera";
      }
      // Make an API call to get the image URL
      const apiUrl = `https://simpsons.fandom.com/api.php?action=query&titles=${formattedName}&prop=pageimages&format=json&origin=*`;
      fetch(apiUrl, { mode: 'cors', cache: 'force-cache' })
        .then(response => response.json())
        .then(data => {
          const pages = data.query.pages;
          const pageId = Object.keys(pages)[0];
          const imageUrl = pages[pageId].thumbnail.source;
          const baseImageUrl = imageUrl.substring(0, imageUrl.lastIndexOf('.png') + 4); // remove url params to get the base image
          const tooltip = document.querySelector('#tooltip');
          tooltip.querySelector('img').src = baseImageUrl;
        })
        .catch(error => {
          console.error('Error fetching image:', error);
          tooltip.querySelector('img').src = "https://ca.slack-edge.com/T0266FRGM-U015ZPLDZKQ-gf3696467c28-512"; // default image
          // also set border radius of img 
          tooltip.querySelector('img').style.borderRadius = "10px";
        });

        d3.select("#byDisc" + d.id)
          .style("filter", "brightness(70%)");
        d3.select('#tooltip')
          .attr('data-value',d.id)
          .style('display', 'block')
          .style('left', event.pageX + 10 + 'px')   
          .style('top', event.pageY + 'px')
          .html(`
            <div style="display: flex; align-items: center;">
              <img src="" style="width: 80px; height: 80px; margin-right: 10px; object-fit: contain; border-radius: 5px;">
              <div style="flex: 1;">
                <div style="font-weight: 600;">${d.name}</div>
                <div>Lines: ${d.lines}</div>
              </div>
            </div>
          `);
    })
    .on('mouseleave', () => {
      d3.select('#tooltip').style('display', 'none');
      d3.selectAll("rect")
        .style("filter", "brightness(100%)");
    });

    vis.rects.transition()
      .duration(1000)
      .attr('width', (d) => vis.xScale(d.lines));

    vis.label = vis.chart.append('g')
      .attr('class', 'rectsdrawn')
      .attr('transform', `translate(${0},${0})`)
      .call(d3.axisLeft(vis.yScale))
      .selectAll("text")
      .style("text-anchor", "start")
      .style("word-wrap", "break-word")
      .style("font-family", "Roboto")
      .style("color", "black")
      .style("font-size", "12px")
      .style("user-select", "none")
      .attr("dx", "1.2em")
      .attr("dy", ".9em")
      .text(function(d) {
        if(Number.isInteger(d) && d < vis.data.length){
          return vis.data.filter(e => e.id === d)[0].name
        }
        else{
          return ""
        }
        });

    vis.label
      .on('mouseover', (event,d) => {
        var formattedName = vis.data.filter(e => e.id === d)[0].name
        if (formattedName === 'C. Montgomery Burns') {
          formattedName = "Charles Montgomery Burns";
        } else if (formattedName === 'Grampa Simpson') {
          formattedName = "Abe Simpson II";
        } else if (formattedName === 'Chief Wiggum') {
          formattedName = "Clancy Wiggum";
        } else if (formattedName === 'Waylon Smithers'){
          formattedName = "Waylon_Smithers,_Jr.";
        } else if (formattedName === 'Dr. Julius Hibbert'){
          formattedName = "Julius_Hibbert";
        } else if (formattedName === 'Rev. Timothy Lovejoy'){
          formattedName = "Timothy_Lovejoy";
        } else if (formattedName === 'Sideshow Bob'){
          formattedName = "Robert_Terwilliger";
        } else if (formattedName === 'Mayor Joe Quimby'){
          formattedName = "Joe_Quimby";
        } else if (formattedName === 'Martin Prince'){
          formattedName = "Martin_Prince,_Jr.";
        } else if (formattedName === 'HERB'){
          formattedName = "Herbert_Powell";
        } else if (formattedName === 'Miss Hoover'){
          formattedName = "Elizabeth_Hoover";
        } else if (formattedName === 'Dr. Nick Riviera'){
          formattedName = "Nick_Riviera";
        }
        // Make an API call to get the image URL
        const apiUrl = `https://simpsons.fandom.com/api.php?action=query&titles=${formattedName}&prop=pageimages&format=json&origin=*`;
        fetch(apiUrl, { mode: 'cors' })
          .then(response => response.json())
          .then(data => {
            const pages = data.query.pages;
            const pageId = Object.keys(pages)[0];
            const imageUrl = pages[pageId].thumbnail.source;
            const baseImageUrl = imageUrl.substring(0, imageUrl.lastIndexOf('.png') + 4); // remove url params to get the base image
            const tooltip = document.querySelector('#tooltip');
            tooltip.querySelector('img').src = baseImageUrl;
          })
          .catch(error => {
            console.error('Error fetching image:', error);
            tooltip.querySelector('img').src = "https://ca.slack-edge.com/T0266FRGM-U015ZPLDZKQ-gf3696467c28-512"; // default image
            // also set border radius of img
            tooltip.querySelector('img').style.borderRadius = "10px";
          });

        d3.select("#byDisc" + d)
          .style("filter", "brightness(70%)");
        d3.select('#tooltip')
          .style('display', 'block')
          .style('left', event.pageX + 10 + 'px')   
          .style('top', event.pageY + 'px')
          .style('opacity', 1)
          .attr('data-value',d)
          .html(`
            <div style="display: flex; align-items: center;">
              <img src="" style="width: 80px; height: 80px; margin-right: 10px; object-fit: contain;">
              <div style="flex: 1;">
                <div class="tooltip-title" style="font-weight: 600;">${vis.data.filter(e => e.id === d)[0].name}</div>
                <div>Calls: ${vis.data.filter(data => data.id === d)[0].lines}</div>
              </div>
            </div>
          `);
      })
      .on('mouseleave', () => {
        d3.select('#tooltip').style('display', 'none');
        d3.selectAll("rect")
          .style("filter", "brightness(100%)");
      })

    vis.rects.on('click', (event, d) => {
      d3.select('#tooltip').style('display', 'none')
        vis.refresh(d.name);
    })

    vis.label.on('click', (event, d) => {
      d3.select('#tooltip').style('display', 'none')
      vis.refresh(vis.data.filter(e => e.id ==  d)[0].name);
    })

    vis.xAxisG =vis.svg.append('g')
      .attr('class', 'rectsdrawn')
      .attr('transform', `translate(${vis.config.contextWidth + vis.config.contextMargin + vis.config.margin.left}, ${vis.config.margin.top + vis.height})`)
      .call(d3.axisBottom(vis.xScale).ticks(6))
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", "-4.1em")
      .attr("text-anchor", "end")
      .attr("stroke", "black")

    vis.yAxisG.call(vis.yAxis);  }
}