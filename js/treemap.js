class Treemap {
    constructor(_config, _data,_refresh) {
      this.config = {
        parentElement: _config.parentElement,
        containerWidth: _config.containerWidth || 500,
        containerHeight: _config.containerHeight || 140,
        margin: { top: 50, bottom: 10, right: 50, left: 60 },
      }
      this.data = _data; // data is {name: "location name", value: 123}. All have same parent.
      this.refresh = _refresh
      this.initVis();
    }

    // first, initialize the visualization. Data is {name: "location name", value: 123}. All have same parent. no tooltips or clicking yet, just a treemap
    initVis() {
        let vis = this;
        vis.width = vis.config.containerWidth - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.bottom - vis.config.margin.top + 5;
        
        // Define size of SVG drawing area
        vis.svg = d3.select(vis.config.parentElement)
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight)
            // translate the drawing area to leave some margin.
            .append('g')
            .attr('transform', `translate(${vis.config.margin.left/2},${vis.config.margin.top - 10})`);


    
        vis.updateVis();
    }

    // update the visualization. Data is an array of objects with format {name: "location name", value: 123}. All have same parent. no tooltips or clicking yet, just a treemap
    updateVis() {
        let vis = this;
        vis.svg.selectAll("*").remove();
        // add title to chart
        vis.svg.append("text")
            .attr("x", vis.width / 2)
            .attr("y", 10 - (vis.config.margin.top / 2))
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-family", "Roboto")
            .style("fill", "black")
            .text("Most Frequent Locations");
        if(vis.data.length == 0){
            vis.svg.append("text")
            .attr("x", vis.width / 2)
            .attr("y", vis.height/ 2)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-family", "Roboto")
            .style("fill", "black")
            .text("No Data to Display");
        }
        else{
            if (vis.data.length > 1) {
                vis.color = d3.scaleOrdinal()
                    .domain(vis.data.map(d => d.name))
                    .range(d3.quantize(t => d3.interpolateSpectral(t * 0.8 + 0.1), vis.data.length).reverse());
            } else {
                vis.color = d3.scaleOrdinal()
                    .domain(vis.data.map(d => d.name))
                    .range(["steelblue"]);
            }

            vis.treemap = d3.treemap()
                .size([vis.width, vis.height])
                .padding(1)
                .round(true);
            vis.root = d3.hierarchy({children: vis.data})
                .sum(d => d.value)
                .sort((a, b) => b.height - a.height || b.value - a.value);
            vis.treemap(vis.root);
            vis.cell = vis.svg.selectAll("g")
                .data(vis.root.leaves())
                .enter().append("g")
                .attr("transform", d => `translate(${d.x0},${d.y0})`);
            vis.cell.append("rect")
                .attr("id", d => d.data.name)
                .attr("width", d => d.x1 - d.x0)
                .attr("height", d => d.y1 - d.y0)
                .attr("fill", d => vis.color(d.data.name))
                // curve edges of rectangles
                .attr("rx", 4)
                .attr("ry", 4)
                .on("click", function(event, d) {
                    vis.refresh(d.data.name);
                })
                .on("mouseover", function(event, d) {
                    d3.select(this)
                        .style("filter", "brightness(70%)");
                })
                .on("mouseout", function(event, d) {
                    d3.select(this)
                        .style("filter", "brightness(100%)");
                });
            vis.cell.append("clipPath")
                .attr("id", d => `clip-${d.data.name}`)
                .append("use")
                .attr("xlink:href", d => `#${d.data.name}`);
            vis.cell.append("text")
                .attr("clip-path", d => `url(#clip-${d.data.name})`)
                .selectAll("tspan")
                .data(d => d.data.name.split(/(?=[A-Z][^A-Z])/g))
                .enter().append("tspan")
                .attr("x", 4)
                .attr("y", (d, i) => 13 + i * 10)
                // roboto
                .style("font-family", "Roboto")
                // smaller font
                .style("font-size", "10px")
                // white
                .style("fill", "black")
                .text(d => d)
                .style("user-select", "none");
            
            vis.tooltip = d3.select("#tooltip")
            vis.cell.on('mouseenter', () => {
                vis.tooltip.style('display', 'block');
              })
              .on('mouseleave', () => {
                vis.tooltip.style('display', 'none');
                d3.select('#histo-tooltip').style('display', 'none');
              })
              .on('mouseover', (event,d) => {
                var formattedName = d.data.name;
                if (formattedName === 'Simpson Home') {
                  formattedName = "742_Evergreen_Terrace";
                } else if (formattedName === 'Street') {
                    formattedName = "Evergreen_Terrace";
                } else if (formattedName === 'Burns Manor') {
                    formattedName = "Burns_Manor";
                }

                // Make an API call to get the image URL
                const apiUrl = `https://simpsons.fandom.com/api.php?action=query&titles=${formattedName}&prop=pageimages&format=json&origin=*`;
                fetch(apiUrl, { mode: 'cors', cache: 'force-cache' })
                  .then(response => response.json())
                  .then(data => {
                    const pages = data.query.pages;
                    const pageId = Object.keys(pages)[0];
                    const imageUrl = pages[pageId].thumbnail.source;
                    const lastDotIndex = imageUrl.lastIndexOf('.');
                    const nextSlashIndex = imageUrl.indexOf('/', lastDotIndex);
                    const imageExtension = imageUrl.substring(lastDotIndex + 1, nextSlashIndex).toLowerCase();
                    if (imageExtension === 'png' || imageExtension === 'jpg') {
                      const baseImageUrl = imageUrl.substring(0, imageUrl.lastIndexOf('.' + imageExtension)); // remove url params to get the base image
                      const tooltip = document.querySelector('#tooltip');
                      tooltip.querySelector('img').src = baseImageUrl + '.' + imageExtension;
                    } else {
                      console.log('Unsupported image type: ' + imageExtension);
                    }
                  })
                  .catch(error => {
                    console.error('Error fetching image:', error);
                    tooltip.querySelector('img').src = "https://i.imgur.com/2JgBIc8.png"; // default image
                    // also set border radius of img 
                    tooltip.querySelector('img').style.borderRadius = "10px";
                  });
          
                  d3.select("#byDisc" + d.id)
                    .style("filter", "brightness(70%)");
                  d3.select('#tooltip')
                    .attr('data-value',d.id)
                    .style('display', 'block')
                    .style('left', (event.pageX - 200) + 'px')   
                    .style('top', event.pageY + 10 + 'px')
                    .html(`
                      <div style="display: flex; align-items: center;">
                        <img src="" style="height: 80px; margin-right: 10px; object-fit: contain; border-radius: 5px;">
                        <div style="flex: 1;">
                          <div style="font-weight: 600;">${d.data.name}</div>
                          <div>Lines: ${d.data.value}</div>
                        </div>
                      </div>
                    `);
              })
          }
    }
        
}
