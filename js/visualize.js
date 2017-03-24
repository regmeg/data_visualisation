// defines headers that are going to be used
let statistical_headers = ["Total", "Average", "Median"];
let ID_headers = ["Business Case ID", "Agency Code"];
let numberic_headers = ["Lifecycle Cost($M)",
                        "Schedule Variance (in days)", //1
                        "Schedule Variance (%)", //2
                        "Cost Variance ($ M)",
                        "Cost Variance (%)",
                        "Planned Cost ($ M)",
                        "Projected/Actual Cost ($ M)",
                        "Lenght"];
let date_headers =  ["Start Date",
                     "Completion Date (B1)",
                     "Planned Project Completion Date (B2)",
                     "Projected/Actual Project Completion Date (B2)"];
let non_modified_headers = ["Unique Investment Identifier",
                            "Agency Name",
                            "Investment Title",
                            "Project ID",
                            "Agency Project ID",
                            "Project Name",
                            "Project Description",
                            "Updated Date",
                            "Updated Time",
                            "Unique Project ID"];
//global control vars
let running = false
//define helper funtions
// function which prepares data for diaplaying
let get_display_val = function (depth, data_obj, index, headers, getPercent = false, totals, totals_left, parent) {
  //save number of projecs
  if(!getPercent) data_obj.parent = parent
  data_obj.depth = depth;
  if(!getPercent) data_obj.num_projects = data_obj.values.length;
  if(!getPercent) data_obj.color = color(index);
  //data_obj.startAngle = 0;
  //data_obj.endAngle = 0;
  headers.forEach(function (header) {
    //calculate empty values and aggregate all values for median
    if(!getPercent) {
      let empty = 0;
      let aggregate = [];
      data_obj.values.forEach(function (val) {
        if (val[header] === "")  empty = empty + 1;
        else aggregate.push(val[header])
      });
      //sort aggreagte
      aggregate.sort();
      //define new info headers for the agency
      data_obj[`Total ${header}`] = d3.sum(data_obj.values, function(d) { return d[header];});
      data_obj[`Average ${header}`] = data_obj[`Total ${header}`] / (  data_obj.num_projects - empty)
      data_obj[`Values ${header}`] = aggregate;
      data_obj[`Median ${header}`] = aggregate.length % 2 === 0 ?
                                   (aggregate[(aggregate.length/2) - 1] + aggregate[(aggregate.length/2)]) / 2 :
                                   aggregate[((aggregate.length-1)/2)];
      //get value percent of the total, make sure totals is passed in
    } else if(getPercent) {
      statistical_headers.forEach(function(stat){
        data_obj[`%${stat} ${header}`] = data_obj[`${stat} ${header}`] / totals[`Full ${stat} ${header}`]
        totals_left[`Unity ${stat} ${header}`] =  totals_left[`Unity ${stat} ${header}`] - data_obj[`%${stat} ${header}`];
        data_obj[`%prev ${stat} ${header}`] = totals_left[`Unity ${stat} ${header}`];
      })
    }
    /*
    data_obj[`%Total ${header}`] = data_obj[`Total ${header}`] / totals[`Total ${header}`]
    totals_left[`Unity ${header}`] =  totals_left[`Unity ${header}`] - data_obj[`%Total ${header}`];
    data_obj[`%prev Total ${header}`] = totals_left[`Unity ${header}`];
    */
    /*
    if(getPercent && (depth === 2)) {
      data_obj[`%par Total ${header}`] = totals[`%Total ${header}`]
      data_obj[`%par prev Total ${header}`] = totals[`%prev Total ${header}`];
      data_obj.color = d3.color(totals.color).brighter(data_obj[`%Total ${header}`]);
    }
    */
  });
}

  let get_local_totals = function(src, headers)  {
      let target = {}
      headers.forEach(function (header) {
        statistical_headers.forEach(function(stat){
          target[`Full ${stat} ${header}`] = d3.sum(src, function(d) { return d[`${stat} ${header}`];});
        })
      })
    return target;
  }

  let color = d3.scaleOrdinal(d3.schemeCategory20c);
  let luminance = d3.scaleSqrt().domain([0, 1e6]).clamp(true).range([90, 20]);
  let diagonal = function (d) {  return "M" + d.y + "," + d.x
                                    + "C" + (d.y + d.parent.y) / 2 + "," + d.x
                                    + " " + (d.y + d.parent.y) / 2 + "," + d.parent.x
                                    + " " + d.parent.y + "," + d.parent.x;
                                  }
//read the file and populate visulaistion with data
let load_graphs = function () {

  //define info tooltips
  let info = d3.select("#tooltip_pie")
  let info_tree = d3.select("#tooltip_tree")
  //define visualisation proporeties
  let main_width = d3.select("#main")._groups[0][0].offsetWidth
  let container_width = main_width*0.9
  let radius = container_width/2;

  //inject svgs
  let svg = d3.select("#info_pie")
  svg = d3.select("#info_pie").append("svg")
      .attr("width",  container_width)
      .attr("height", container_width)
     .append("g")
      .attr("transform", "translate(" + radius + "," + radius + ")");

  let svg_tree = d3.select("#info_tree")
  svg_tree = d3.select("#info_tree").append("svg")
      .attr("width",  container_width)
      .attr("height", container_width*1.35)
     .append("g")
      .attr("transform", "translate(10,10 )");
/*##########################################################################################
#########################Preprocess the Data ###############################################
##########################################################################################*/
 d3.csv('data/Projects_CW1_clean.csv', function (error, data) {
  if (error) throw error;
  //convert strings to numbers
    //time parsers
  let strictIsoParse = d3.utcParse("%Y-%m-%dT%H:%M:%S.%LZ");
  //time regex
  let re = /^.*T/;
  //parse data
  data.forEach(function (d) {
    //d["Projected/Actual Cost ($ M)"] = +d["Projected/Actual Cost ($ M)"];
    //******IDs*****//
    ID_headers.forEach(function (header) {
        if (d[header] !== "") d[header] = +  d[header];
      });
      //******Dates*****//
      date_headers.forEach(function (header) {
            d[header] =  new Date(d[header]);
      });
      //******Numbers*****//
      numberic_headers.forEach(function (header) {
          if (d[header] !== "") d[header] = +  d[header];
          //Create new header for caluclating project lenght, if result is NaN (one of the conversion dates is missing), save it empty val, sp that avarages later on are counted without it
          if (header == 'Lenght') {
            d[header] =  Math.ceil(Math.abs((d[numberic_headers[1]]*100) / d[numberic_headers[2]]));
            if (isNaN(d[header] ) || (d[header] === 0)) d["Lenght"] =  Math.abs(new Date(d[date_headers[3]]) - new Date(d[date_headers[0]]))/(1000*60*60*24);
            if (isNaN(d[header] ) || (d[header] === 0)) d["Lenght"] = 0
          }
      });
      //******put together updated time and date*****//
    d["Updated DateTime"] = new Date(re.exec(d["Updated Date"])[0] + d["Updated Time"] + 'Z');
  });

  //get totals for the global data
  let global_tot = {key:"All Values", depth: 0, num_projects: data.length, color: "#f9f9f9", parent:{}};
  numberic_headers.forEach(function (header) {
    //calculate empty values and aggregate all values for median
    let empty = 0;
    let aggregate = [];
    data.forEach(function (val) {
      if (val[header] === "")  empty = empty + 1;
      if (header === 'Lenght' && val[header] === 0)  empty = empty + 1;
      else aggregate.push(val[header])
    });
    //sort aggreagte
    aggregate.sort();
    //define new info headers for the agency
    global_tot[`Total ${header}`] = d3.sum(data, function(d) { return d[header];});
    global_tot[`Average ${header}`] = global_tot[`Total ${header}`] / (  data.length - empty)
    global_tot[`Values ${header}`] = aggregate;
    global_tot[`Median ${header}`] = aggregate.length % 2 === 0 ?
                                 (aggregate[(aggregate.length/2) - 1] + aggregate[(aggregate.length/2)]) / 2 :
                                 aggregate[((aggregate.length-1)/2)];
    statistical_headers.forEach(function(stat){
      global_tot[`%${stat} ${header}`] = 1
      global_tot[`%prev ${stat} ${header}`] = 0
    });
  });
  //nest data by agencies
  var DataByAgencyName = d3.nest()
  .key(function(d) { return d["Agency Name"]; })
  .entries(data);

  //define totals left for defining beginning and ending boundaries.
  let totals_left = {};
  numberic_headers.forEach(function (header) {
    statistical_headers.forEach(function(stat){
      totals_left[`Unity ${stat} ${header}`] = 1;
    })
  });

  //calculate depth 1 values first, so that local totals can be calculated
  DataByAgencyName.forEach(function (agency, index) {
    get_display_val(1,agency, index, numberic_headers, getPercent = false, {}, {}, global_tot)
  })
  //calculate
//let str =""
  //calculate totals, avarages, and means
  DataByAgencyName.forEach(function (agency, index) {
    get_display_val(1,agency, index, numberic_headers, getPercent = true, get_local_totals(DataByAgencyName, numberic_headers), totals_left)
    //nest by project titles
    agency.invTitles = d3.nest()
                      .key(function(d) { return d["Investment Title"]; })
                      .entries(agency.values);
    //calculate totals, avarages and means for each Investment title
    //define totals left for defining beginning and ending boundaries.
    let sub_totals_left = {};
    numberic_headers.forEach(function (header) {
      statistical_headers.forEach(function(stat){
        sub_totals_left[`Unity ${stat} ${header}`] = 1;
      })
    });
    //calcualte values at the local level first
    agency.invTitles.forEach(function (investment, index) {
      get_display_val(2,investment, index, numberic_headers, getPercent = false, {}, {}, agency)
    });
    //caclultae persentages
    agency.invTitles.forEach(function (investment, index) {
      get_display_val(2,investment, index, numberic_headers, getPercent = true, get_local_totals(agency.invTitles, numberic_headers), sub_totals_left)
    });
    //str = str+ agency["Average Lenght"] + " + "
  });

  /*##########################################################################################
  #########################Construct Donut Pie ##############################################
  ##########################################################################################*/
    //scaling and info helpers
    let cScale = d3.scaleLinear().domain([0, 1]).range([0, 2 * Math.PI]);
    let getStartX = function(d,header) {
      if (d.depth < 2) return d[`%prev ${header}`];
      else return d.parent[`%prev ${header}`] +  (d.parent[`%${header}`] * d[`%prev ${header}`]);
    }
    let getDeltaX = function(d,header) {
      if (d.depth < 2) return d[`%${header}`];
      else return d.parent[`%${header}`] * d[`%${header}`];
    }
    let getStartAngle = function (d, header) {
      return cScale(getStartX(d,header));
    }
    let getEndAngle = function(d, header) {
      return cScale(getStartX(d,header) + getDeltaX(d,header));
    }
    let getColor = function  (d, header) {
      if (d.depth < 2) return d.color;
      //else return d3.color(d.parent.color).darker(2*(d[`%prev Total ${header}`] + d[`%Total ${header}`]));
      else return d3.color(d.parent.color).darker(2*(d[`%prev ${header}`] + d[`%${header}`]));
    }
    let currentArc = function(d, header) {
      return {
        depth: d.depth,
        startAngle: getStartAngle(d,header),
        endAngle: getEndAngle(d,header),
        innerRadius:  radius / 3 * d.depth,
        outerRadius: radius / 3 * (d.depth + 1) - 1,
        padRadius: radius / 3
      };
    }
    let showInfo = function(d){
      this.style.cursor='pointer';
      info.style( "display", "block");
      info.style( "position", "absolute");
      info.style('top', (d3.event.layerY + 10) + 'px')
      info.style('left', (d3.event.layerX - 10 ) + 'px');
      if (d.depth === 0)  info.selectAll("h4").text("Global Info")
      else if (d.depth === 2) info.selectAll("h4").text("Investment Info")
      else info.selectAll("h4").text("Agency Info")
      info.selectAll("p#prop").text("View: " + mainHeader)
      if (d.depth === 0) info.selectAll("p#key").text("Selection: " + d.key)
      else if (d.depth === 2) info.selectAll("p#key").text("Investment Type: " + d.key)
      else info.selectAll("p#key").text("Agency: " + d.key)
      if (numHeader === numberic_headers[7]) info.selectAll("p#val").text("Value: "+ Math.round(d[mainHeader]) + " (days)");
      else info.selectAll("p#val").text("Value: "+ Math.round(d[mainHeader]) + " ($M)");
      info.selectAll("p#num").text("Number of Projects: "+ d.num_projects)
    }
/*
let statistical_headers = ["Total", "Average", "Median"];
let numberic_headers = ["Lifecycle Cost($M)", //0
                        "Schedule Variance (in days)", //1
                        "Schedule Variance (%)", //2
                        "Cost Variance ($ M)", //3
                        "Cost Variance (%)", //4
                        "Planned Cost ($ M)", //5
                        "Projected/Actual Cost ($ M)", //6
                        "Lenght"]; /7
*/
let statHeader = statistical_headers[0]
let numHeader = numberic_headers[0]
let mainHeader = statHeader + " " + numHeader;
    //define arc  function
    let arcDraw = d3.arc()
      .innerRadius(function(d) { return radius / 3 * d.depth; })
      .outerRadius(function(d) { return radius / 3 * (d.depth + 1) - 1; })
      .startAngle(function(d)  { return getStartAngle(d, mainHeader); })
      .endAngle(  function(d)  { return getEndAngle(d, mainHeader) })
      .padAngle(.01)
      .padRadius(radius / 3);

      let arcDrawTwin = d3.arc()
        .innerRadius(function(d) { return radius / 3 * d.depth; })
        .outerRadius(function(d) { return radius / 3 * (d.depth + 1) - 1; })
        .startAngle(function(d)  { return d.startAngle; })
        .endAngle(  function(d)  { return d.endAngle; })
        .padAngle(.01)
        .padRadius(radius / 3);

//linearsize data for presentation
  let arc_data = [global_tot];
  DataByAgencyName.forEach(function(agency){
    arc_data.push(agency);
    agency.invTitles.forEach(function(investment){
      arc_data.push(investment);
    });
  });


//define the zentra circle

  let arc = svg.selectAll("path")
      .data(arc_data)
    .enter().append("path")
      .attr("d", arcDraw)
      .attr("id", function(d) {return d.depth + "-" + d.key}) //
      .style("fill", function(d) {return getColor(d, mainHeader)})
     .each(function(d) {this._current = currentArc(d, mainHeader);})
      .on("click", zoom)
      .on("mousemove", showInfo)
      .on("mouseleave", function() { info.style( "display", "none"); })

/*
    let text = svg.selectAll('text')
        .data(arc_data.filter(function(item) { return  getDeltaX(item,mainHeader) > 0.02;})).enter()
        .append('text')
          .attr("x", function(d) {return radius*getDeltaX(d,mainHeader)*2})
          .attr("dy", function(d) {
            if (d.depth === 1) return radius/6;
            else if (d.depth === 2) return 10;
          })
        .append('textPath')
          .attr("stroke","black")
          .attr("color","white")
          .attr( 'xlink:href', function(d) {return "#" + d.depth + "-" + d.key})
          .text(function(d) { return Math.round(d[`%${mainHeader}`] * 100) + "% "});
*/

/*
    let text = svg.append("text")
    .enter().append("textPath")
      .data(arc_data)
      .attr("stroke","black")
      .attr("xlink:href", function(d) {return "#" + d.depth + "-" + d.key})
      .text(function(d) {return "#" + d.depth + "-" + d.key});
*/


//transtion functions
  function zoom(data) {
      //if in transtion, return
       if (running) return;
      //compute direction
      let direction = "in";
      let src_depth = this._current.depth;
      if (src_depth === 0) direction = "out";
      else if (src_depth === 1 && typeof data.invTitles === "undefined") return; //if there are no children and src depth is 1, don't reportm transition
            console.log("clickin")
      let finalState = function(d) {
        let depth, startAngle, endAngle, dummy_obj;
        //if zoomed in, decrease depth by one level
        if (direction === "in") {
          depth = d.depth - 1;
          startAngle = 0;
          endAngle = 0;
          //if it is a clicked element at depth 1, or parent to clicked element at depth 2, make take full circle
          if ((d === data && src_depth === 1) || (src_depth === 2 && d === data.parent))
            startAngle = 0,  endAngle = 2*Math.PI;
          //if its parent is the clicked elment at depth 1, or its parent and parent of cliked elment at depth to is the same, bring it down one level and recalculate new angles.
          else if ((d.parent === data && src_depth === 1) || (src_depth === 2 && d.parent === data.parent))
            dummy_obj = Object.assign({}, d), dummy_obj.depth = depth,  startAngle = getStartAngle(dummy_obj, mainHeader), endAngle = getEndAngle(dummy_obj, mainHeader);
          return {depth, startAngle, endAngle};
        //if zoomed out, reset depth and angle
        } else if (direction === "out") {
          depth = d.depth;
          startAngle = getStartAngle(d, mainHeader);
          endAngle = getEndAngle(d, mainHeader);
          return {depth, startAngle, endAngle};
        }
      }

      arc.transition().duration(750)
        .attrTween("d", function(d) {return arcTween.call(this, finalState(d), d, data); })
        .on('start', function() {running = true})
        .on('end', function() {running = false})
      //.remove();
    }


    //define pie cotronls
    //data type
    let datt = d3.select("#pie_control").selectAll("span").on("click", control_click).on("mouseover", showPointer)

    function control_click() {
      if (running) return;
      if (this.parentNode.id === "data-type") {
        if ( numHeader === numberic_headers[parseInt(this.id)]) return;
        numHeader = numberic_headers[parseInt(this.id)];
        [].slice.call(this.parentNode.children).forEach(function(child){child.style = "";});
      } else if (this.parentNode.id === "stat-type") {
        if (statHeader === statistical_headers[parseInt(this.id)]) return;
        statHeader = statistical_headers[parseInt(this.id)];
        [].slice.call(this.parentNode.children).forEach(function(child){child.style = "";});
      }
      this.style = "font-weight: bold;  color: blue;";
      mainHeader = statHeader + " " + numHeader;
      let SelectionChange = function(d, current) {
            dummy_obj = Object.assign({}, d);
            dummy_obj.depth = current.depth,
            obj = {depth: current.depth, startAngle: getStartAngle(dummy_obj, mainHeader), endAngle: getEndAngle(dummy_obj, mainHeader)}
            if (current.depth === 0) obj = current;
            if (current.startAngle === 0 && current.endAngle === 0 && current.depth === 1) obj = current;
            return obj;
      }
      arc.transition().duration(750)
        .attrTween("d", function(d) {return arcTween.call(this, SelectionChange(d, this._current), d, " "); })
        .on('start', function() {running = true})
        .on('end', function() {running = false})
      //.remove();
    }
    function showPointer(){
      this.style.cursor='pointer';
    }
    //define tweening function
    function arcTween (b, d, data) {
      let i = d3.interpolate(this._current, b);
      this._current = i(0);
      return function(t) {
        return arcDrawTwin(i(t));
      };
    }

    function arcTweenRes (b) {
      let i = d3.interpolate(this._current, b);
      this._current = i(0);
      return function(t) {
        return arcDrawTwin(i(t));
      };
    }

    //resize graph
    function resize_graph() {
      main_width = d3.select("#main")._groups[0][0].offsetWidth
      container_width = main_width*0.9
      radius = container_width/2;

      d3.select("#info_pie").select("svg")
          .attr("width",  container_width)
          .attr("height", container_width)
         .select("g")
          .attr("transform", "translate(" + radius + "," + radius + ")");

      arc.transition().duration(3)
        .attrTween("d", function(d) {
          let b = this._current;
          b.padRadius = radius / 3;
          b.innerRadius = radius / 3 * b.depth;
          b.outerRadius = radius / 3 * (b.depth + 1) - 1;
          return arcTweenRes(b);
        })
   }

/*##########################################################################################
#########################Construct Tree ####################################################
##########################################################################################*/
//construct tree stcturcture and nodes
  let i = 0;
  let duration = 100;
  let source = {}
  source.x0 = container_width*1.35 / 2;
  source.y0 = 0;
  let treeNodes =  Object.assign({display:true}, global_tot);
  let flatNodes = [];
  treeNodes.children = Object.assign([], DataByAgencyName);
  treeNodes.children.forEach(function (child){
    child.parent = global_tot
    child.display = false;
    child.children = child.invTitles;
    child.children.forEach(function(ch){
      ch.parent = child;
      ch.children = ch.values;
      ch.display = false
      ch.children.forEach(function(c){
        c.parent = ch;
        c.display = false;
        c.depth = 3;
        flatNodes.push(c);
      })
      flatNodes.push(ch);
    })
    flatNodes.push(child);
  });

  //deinfe links and nodes
  let link = svg_tree.selectAll(".link")
  let node = svg_tree.selectAll("g.node")

  function draw_tree (source) {

    let tree = d3.tree().size([container_width*1.35 - 20, container_width - 20]);
    let nodes = d3.hierarchy(source, function(d) { if (d.display) return d.children; });
    nodes = tree(nodes);
    //console.log(tree)
    //console.log("resulting nodes are")
    //console.log(nodes)
    //add links between the ndoes
    link = link
      .data( nodes.descendants().slice(1))
    .enter().append("path")
      .attr("class", "link")
      .style("stroke", function(d) { return d.data.level; })
      .attr("d", function(d) { return diagonal(d)});

      // add each nodes
    node = node
      .data(nodes.descendants())
    .enter().append("g")
      .attr("class", function(d) {
        return "node" +
          (d.children ? " node--internal" : " node--leaf"); })
      .attr("transform", function(d) {
        return "translate(" + d.y + "," + d.x + ")"; })
      .on("click", click);


      // adds circle to nodes
    node.append("circle")
        .attr("r", 4.5)
        .style("fill", function(d) { return d.data.color; })
        .style("stroke", "steelblue")
        .style("stroke-width", "1.5px")
        .on("mousemove", showInfoTree)
        .on("mouseleave", function() { info_tree.style( "display", "none"); })

}

  function reside_tree(d) {
    main_width = d3.select("#main")._groups[0][0].offsetWidth
    container_width = main_width*0.9

    nodeUpdate = node.transition()
          .duration(duration)
          .attr("transform", function(d) { return "translate(" + 10 + "," + 100 + ")"; });
  }



  draw_tree(treeNodes)

//helper functions
//respond to a click on a node
  function click(d) {
    d = d.data
    let name = "";
    //if clicked on parent
    console.log(d)
  if (d.depth === 0) name =`Global View`
  if (d.depth === 1) name = `Agnecy: ${d.key}`
  if (d.depth === 2) name = `Invetesment: ${d.key}`
  if (d.depth === 3) name = `Project: ${d["Project Name"]}`
  document.querySelector('#selectedTree').innerHTML = name;
    if (d.display) {
      d.display = false;
      d.parent.display = true;
      draw_tree(d);
    //if clicked on children
  } else if (!d.display) {
    console.log("clickeon children")
    console.log(d)
      d.display = true;
      d.parent.display = false;
      draw_tree(d);
    }
  }


//show tooltip
function showInfoTree  (d) {
  this.style.cursor='pointer';
  info_tree.style( "display", "block");
  info_tree.style( "position", "absolute");
  info_tree.style('top', (d3.event.layerY + 10) + 'px')
  info_tree.style('left', (d3.event.layerX - 10 ) + 'px');
  if (d.data.depth === 0)  info_tree.selectAll("h4").text("Global Info")
  else if (d.data.depth === 2) info_tree.selectAll("h4").text("Investment Info")
  else if (d.data.depth === 1) info.selectAll("h4").text("Agency Info")
  else if (d.data.depth === 3) info.selectAll("h4").text("Project Info")
  if (d.data.depth === 0) info_tree.selectAll("p#key").text("Selection: " + d.data.key)
  else if (d.data.depth === 2) info_tree.selectAll("p#key").text("Investment Type: " + d.data.key)
  else if (d.data.depth === 1)  info_tree.selectAll("p#key").text("Agency: " + d.data.key)
  else if (d.data.depth === 3)  info_tree.selectAll("p#key").text("Project Name: " + d.data["Project Name"])

//    if (numHeader === numberic_headers[7]) info_tree.selectAll("p#val").text("Value: "+ Math.round(d.data[mainHeader]) + " (days)");
//  else info_tree.selectAll("p#val").text("Value: "+ Math.round(d.data[mainHeader]) + " ($M)");
      let vals = ""
  if (d.data.depth !== 3) {
    info_tree.selectAll("p#num").text("Number of Projects: "+ d.data.num_projects)
    //info_tree.selectAll("p#val").text(vals)
    numberic_headers.forEach(function(num, ind){
      statistical_headers.forEach(function(stat){
        if (ind === 0 || ind === 6 || ind === 7) {
          val = Math.round(d.data[`${stat} ${num}`] * 100)/100
          vals = vals +  `<p> ${stat} ${num}: ${val}</p>`
        }
      })
    })
    document.querySelector('#val_tree').innerHTML = vals;

  } else {
    numberic_headers.forEach(function(num, ind){
      val = Math.round(d.data[`${num}`] * 100)/100
      vals = vals +  `<p>${num}: ${val}</p>`
    });
   document.querySelector('#val_tree').innerHTML = vals;
 }
}

/*##########################################################################################
#########################Bind events for winwos loading and resizing ########################
##########################################################################################*/
    window.addEventListener("resize", function() {
      resize_graph()
      resize_tree()
      });
  });
}
//add event listner for window load and resize for reshaping graphs
window.addEventListener("load", function()   { load_graphs();});
