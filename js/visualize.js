//define helper funtions
// function which prepares data for diaplaying
let get_display_val = function (depth, data_obj, index, headers, getPercent = false, totals, totals_left) {
  //save number of projecs
  data_obj.parent = totals
  data_obj.depth = depth;
  data_obj.num_projects = data_obj.values.length;
  data_obj.color = color(index);
  //data_obj.startAngle = 0;
  //data_obj.endAngle = 0;
  headers.forEach(function (header) {
    //calculate empty values and aggregate all values for median
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
    if(getPercent) {
      data_obj[`%Total ${header}`] = data_obj[`Total ${header}`] / totals[`Total ${header}`]
      totals_left[`Unity ${header}`] =  totals_left[`Unity ${header}`] - data_obj[`%Total ${header}`];
      data_obj[`%prev Total ${header}`] = totals_left[`Unity ${header}`];
    }

    /*
    if(getPercent && (depth === 2)) {
      data_obj[`%par Total ${header}`] = totals[`%Total ${header}`]
      data_obj[`%par prev Total ${header}`] = totals[`%prev Total ${header}`];
      data_obj.color = d3.color(totals.color).brighter(data_obj[`%Total ${header}`]);
    }
    */
  });
}

//define visualisation proporeties
let margin = {top: 350, right: 480, bottom: 350, left: 480},
    radius = Math.min(margin.top, margin.right, margin.bottom, margin.left) - 10;

let color = d3.scaleOrdinal(d3.schemeCategory20c);

let luminance = d3.scaleSqrt().domain([0, 1e6]).clamp(true).range([90, 20]);

//define svg
let svg = d3.select("#info_pie").append("svg")
    .attr("width", margin.left + margin.right)
    .attr("height", margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

//read the file and populate visulaistion with data
d3.csv('data/Projects_CW1_clean.csv', function (error, data) {
  if (error) throw error;
  //convert strings to numbers
  //define headers to work with
  let ID_headers = ["Business Case ID", "Agency Code"];
  let numberic_headers = ["Lifecycle Cost($M)",
                          "Schedule Variance (in days)",
                          "Schedule Variance (%)",
                          "Cost Variance ($ M)",
                          "Cost Variance (%)",
                          "Planned Cost ($ M)",
                          "Projected/Actual Cost ($ M)"];
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
    //******Numbers*****//
    numberic_headers.forEach(function (header) {
        if (d[header] !== "") d[header] = +  d[header];
    });
    //******Dates*****//
    date_headers.forEach(function (header) {
        d[header] =  new Date(d[header]);
    });
      //******put together updated time and date*****//
    d["Updated DateTime"] = new Date(re.exec(d["Updated Date"])[0] + d["Updated Time"] + 'Z');
  });

  //get totals for the global data
  let global_tot = {};
  numberic_headers.forEach(function (header) {
    //calculate empty values and aggregate all values for median
    let empty = 0;
    let aggregate = [];
    data.forEach(function (val) {
      if (val[header] === "")  empty = empty + 1;
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
  });
  //console.log('global_tot');
  //console.log(global_tot);

  //nest data by agencies
  var DataByAgencyName = d3.nest()
  .key(function(d) { return d["Agency Name"]; })
  .entries(data);
  //calculate totals, avarages, and means
  //define totals left for defining beginning and ending boundaries.
  let totals_left = {};
  numberic_headers.forEach(function (header) {
    totals_left[`Unity ${header}`]   = 1;
  });
  DataByAgencyName.forEach(function (agency, index) {
    get_display_val(1,agency, index, numberic_headers, getPercent = true, global_tot, totals_left)
    //nest by project titles
    agency.invTitles = d3.nest()
                      .key(function(d) { return d["Investment Title"]; })
                      .entries(agency.values);
    //calculate totals, avarages and means for each Investment title
    //define totals left for defining beginning and ending boundaries.
    let sub_totals_left = {};
    numberic_headers.forEach(function (header) {
      sub_totals_left[`Unity ${header}`]  = 1;
    });
    agency.invTitles.forEach(function (investment, index) {
      get_display_val(2,investment, index, numberic_headers, getPercent = true, agency, sub_totals_left)
    });
  });
  console.log('DataByAgencyName');
  console.log(DataByAgencyName);
    //scaling and info helpers
    let cScale = d3.scaleLinear().domain([0, 1]).range([0, 2 * Math.PI]);
    let getStartX = function(d,header) {
      if (d.depth < 2) return d[`%prev Total ${header}`];
      else return d.parent[`%prev Total ${header}`] +  (d.parent[`%Total ${header}`] * d[`%prev Total ${header}`]);
    }
    let getDeltaX = function(d,header) {
      if (d.depth < 2) return d[`%Total ${header}`];
      else return d.parent[`%Total ${header}`] * d[`%Total ${header}`];
    }
    let getStartAngle = function (d, header) {
      return cScale(getStartX(d,header));
    }
    let getEndAngle = function(d, header) {
      return cScale(getStartX(d,header) + getDeltaX(d,header));
    }
    let getColor = function  (d, header) {
      if (d.depth < 2) return d.color;
      else return d3.color(d.parent.color).darker(2*(d[`%prev Total ${header}`] + d[`%Total ${header}`]));
    }
    let currentArc = function(d, header) {
      return {
        depth: d.depth,
        startAngle: getStartAngle(d,header),
        endAngle: getEndAngle(d,header)
      };
    }
    let showInfo = function(d){
      this.style.cursor='pointer';
      let info = d3.select("#agency_info").selectAll("p").text("Key is: " + d.key);
    }




let mainHeader = numberic_headers[6];
    //define arc  function
    let arcDraw = d3.arc()
      .innerRadius(function(d) { return radius / 3 * d.depth; })
      .outerRadius(function(d) { return radius / 3 * (d.depth + 1) - 1; })
      .startAngle(function(d)  { return getStartAngle(d, mainHeader) })
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
  let arc_data = [];
  DataByAgencyName.forEach(function(agency){
    arc_data.push(agency);
    agency.invTitles.forEach(function(investment){
      arc_data.push(investment);
    });
  });

  let arc = svg.selectAll("path")
      .data(arc_data)
    .enter().append("path")
      .attr("d", arcDraw)
      .style("fill", function(d) {return getColor(d, mainHeader)})
     .each(function(d) {this._current = currentArc(d, mainHeader);})
      .on("click", zoom)
      .on("mouseover", showInfo)

//define running control state
let running = false
//transtion functions
  function zoom(data) {
      //if in transtion, return
       if (running) return;
      //compute direction
      let direction = "in";
      let src_depth = this._current.depth;
      if (src_depth === 0) direction = "out";
      else if (src_depth === 1 && typeof data.invTitles === "undefined") return; //if there are no children and src depth is 1, don't reportm transition
      console.log(this._current)
      console.log("launching zoom " + direction)
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
        //if zoomed in, increase depth by one level
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

    //define tweening function
    function arcTween (b, d, data) {
      let i = d3.interpolate(this._current, b);
      this._current = i(0);
      return function(t) {
        return arcDrawTwin(i(t));
      };
    }
});
