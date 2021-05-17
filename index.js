mapboxgl.accessToken =
  "pk.eyJ1IjoibGluZ3J1ZmVuZyIsImEiOiJja2syZmoxaGowaXZoMzJxbzdjYm83enluIn0.ddM9J2lcLfGXLxDDIGV17A"; // Put Mapbox Public Access token

// Load a new map in the 'map' HTML div
var map = new mapboxgl.Map({
  container: "map", // container id
  style: "mapbox://styles/lingrufeng/ckoe81lyq25qs19lks2cywv17", // style location
  center: [-0.1, 51.5], // starting position [lng, lat]
  zoom: 9.6, // starting zoom
});

let compute = d3.interpolate("#b3cde0", "#03396c");
map.on("load", function () {
  Promise.all([
    d3.json("neighbourhoods(1).geojson"),
    d3.csv("nhse_weekly_vaccines_london_ltla.csv"),
  ]).then(function ([result, csvdata]) {
    let sel = $("#select_id").val();
    let data = d3.group(csvdata, (d) => d["dose"]);
    let data2 = d3.group(data.get(sel), (d) => d["end_date"]);
    let data3 = d3.group(Array.from(data2)[0][1], (d) => d["ltla_name"]);

    let [mindata, maxdata] = get_max_min(data2);
    $("#select_id").change(function () {
      console.log(1);
      sel = $("#select_id").val();
      data = d3.group(csvdata, (d) => d["dose"]);
      data2 = d3.group(data.get(sel), (d) => d["end_date"]);

      data3 = d3.group(Array.from(data2)[0][1], (d) => d["ltla_name"]);

      let [mindata, maxdata] = get_max_min(data2);

      result.features.forEach((d, i) => {
        data3.forEach((ddd) => {
          if (ddd[0]["ltla_name"] == d.properties.neighbourhood) {
            let num =
              d3.sum(ddd, (dd) => +dd["vaccines"]) /
              d3.sum(ddd, (dd) => +dd["population"]);
            //    console.log("num",num)
            let _100 = (num - mindata) / (maxdata - mindata);

            //    console.log(_100)
            d.properties.color = compute(_100);
            d.properties.num = num;
          }
        });
      });

      map.getSource("LocalAuthorities").setData(result);
      map.getSource("lahighlight").setData(result);

      if (sel == "2nd dose") {
        $(".len").html(`
                     
                     `);
        return;
      }
      $(".len").html(`
                     <input type="text" id="range_2" />
                     `);
      $("#range_2").ionRangeSlider({
        values: Array.from(data2.keys()),
        from: 0,
        type: "single", //设置类型
        step: 1,
        prefix: "Date:", //设置数值前缀
        postfix: "", //设置数值后缀
        prettify: true,
        hasGrid: true,
        onChange: (e) => {
          let data3 = d3.group(data2.get(e.fromValue), (d) => d["ltla_name"]);

          result.features.forEach((d, i) => {
            data3.forEach((ddd) => {
              if (ddd[0]["ltla_name"] == d.properties.neighbourhood) {
                let num =
                  d3.sum(ddd, (dd) => +dd["vaccines"]) /
                  d3.sum(ddd, (dd) => +dd["population"]);
                //    console.log("num",num)
                let _100 = (num - mindata) / (maxdata - mindata);

                //    console.log(_100)
                d.properties.color = compute(_100);
                d.properties.num = num;
              }
            });
          });

          map.getSource("LocalAuthorities").setData(result);
          map.getSource("lahighlight").setData(result);
        },
      });
      //////////////////
    });

    function get_max_min(data2) {
      let maxdata = d3.max(Array.from(data2), (d) => {
        let ltla_name = d3.rollups(
          d[1],
          (d) => {
            return {
              pop_sum: d3.sum(d, (v) => +v["population"]),
              vac_max: d3.sum(d, (v) => +v["vaccines"]),
              vac_max_pop_sum:
                d3.sum(d, (v) => +v["vaccines"]) /
                d3.sum(d, (v) => +v["population"]),
            };
          },
          (d) => d.ltla_name
        );
        return d3.max(ltla_name, (v) => v[1].vac_max_pop_sum);
      });
      let mindata = d3.min(Array.from(data2), (d) => {
        let ltla_name = d3.rollups(
          d[1],
          (d) => {
            return {
              pop_sum: d3.sum(d, (v) => +v["population"]),
              vac_max: d3.sum(d, (v) => +v["vaccines"]),
              vac_max_pop_sum:
                d3.sum(d, (v) => +v["vaccines"]) /
                d3.sum(d, (v) => +v["population"]),
            };
          },
          (d) => d.ltla_name
        );
        return d3.min(ltla_name, (v) => v[1].vac_max_pop_sum);
      });
      return [mindata, maxdata];
    }

    result.features.forEach((d, i) => {
      data3.forEach((ddd) => {
        if (ddd[0]["ltla_name"] == d.properties.neighbourhood) {
          let num =
            d3.sum(ddd, (dd) => +dd["vaccines"]) /
            d3.sum(ddd, (dd) => +dd["population"]);
          //    console.log("num",num)
          let _100 = (num - mindata) / (maxdata - mindata);

          //    console.log(_100)
          d.properties.color = compute(_100);
          d.properties.num = num;
        }
      });
    });

    map.addLayer({
      //Add the fill layer. It is not visible (opacity 0) and is used only as the basis of the hover selection
      id: "LocalAuthorities",
      type: "fill",
      source: {
        // id:"LocalAuthoritiesdata",
        type: "geojson",
        data: result, // Your Mapbox tileset Map ID
      },

      layout: {
        visibility: "visible",
      },
      paint: {
        "fill-color": ["get", "color"],
        // 'fill-opacity': ["get", "num"],
        // 'fill-opacity':0.9,
      },
    });

    map.addLayer({
      //Add the fill layer. It is not visible (opacity 0) and is used only as the basis of the hover selection
      id: "lahighlight",
      type: "line",
      source: {
        type: "geojson",
        data: result, // Your Mapbox tileset Map ID
      },

      layout: {
        visibility: "visible",
      },
      paint: {
        "line-color": "#011f4b",
        "line-width": 2,
      },
    });
    initLegend()
    function initLegend() {
      let div = d3.select("#d3data");
      div.selectAll("*").remove();
      debugger;
      let svgwidth = +div.node().getBoundingClientRect().width * 0.8;
      let svgheight = +div.node().getBoundingClientRect().height;
      let svg = div
        .append("svg")
        .attr("width", svgwidth)
        .attr("height", svgheight);
      let num = 7;
      svg
        .selectAll("rect")
        .data(d3.range(num))
        .enter()
        .append("rect")
        .attr("x", (d, i) => (i * svgwidth) / num)
        .attr("y", 0)
        .attr("width", svgwidth / num)
        .attr("height", 30)
        .style("fill", (d, i) => compute(d / num));

      svg
        .selectAll("text")
        .data(d3.range(num))
        .enter()
        .append("text")
        .attr("x", (d, i) => (svgwidth / num) * i)
        .attr("y", 40)
        .text((d) => d * 10);
    }
    window.onresize = initLegend;
    map.on("mousemove", function (e) {
      // This is the main event listner which is triggered when the mouse moves

      var la = map.queryRenderedFeatures(e.point, {
        // This queries whether the mouse is over an object in the LocalAuthorities layer
        layers: ["LocalAuthorities"],
      });

      if (la.length == 1) {
        // This if statement is run when the mouse is over a local authority
        //get bar data

        let data4 = data
          .get(sel)
          .filter((d) => d.ltla_name === la[0].properties.neighbourhood);
        let bardata = d3.rollups(
          data4,
          (d) =>
            d3.sum(d, (v) => +v.vaccines) / +d3.sum(d, (v) => +v.population),
          (d) => d.end_date
        );

        new Bar(bardata, "bar", la[0].properties.neighbourhood);

        map.setFilter("lahighlight", [
          "==",
          "neighbourhood",
          la[0].properties.neighbourhood,
        ]); // Filter the highlight layer to show the local authority outline
        console.log(la[0].properties.neighbourhood);
        document.getElementById("laname").innerHTML = `${
          la[0].properties.neighbourhood ?? "Total"
        }<br>
                        Vaccination Rate:${(la[0].properties.num * 100).toFixed(
                          2
                        )}%`; // Change the name in the top left box to show the local authority name
      } else {
        map.setFilter("lahighlight", ["!=", "name", "null"]);
        console.log("No features");

        let index = +d3.select("#range_2").property("value");

        let data4 = data
          .get(sel)
          .filter((d) => d.end_date === Array.from(data2)[index][0]);
        let totalNum =
          d3.sum(data4, (v) => +v.vaccines) /
          +d3.sum(data4, (v) => +v.population);

        document.getElementById(
          "laname"
        ).innerHTML = `Greater London  <br> Vaccination Rate: ${d3.format(
          ".1%"
        )(totalNum)}  `;

        let bardata = d3.rollups(
          data4,
          (d) =>
            d3.sum(d, (v) => +v.vaccines) / +d3.sum(d, (v) => +v.population),
          (d) => d.end_date
        );

        new Bar(bardata, "bar", "Total");
        // d3.select("#bar").selectAll("*").remove();
      }
    });

    $("#range_2").ionRangeSlider({
      values: Array.from(data2.keys()),
      from: 0,
      type: "single", //设置类型
      step: 1,
      prefix: "Date:", //设置数值前缀
      postfix: "", //设置数值后缀
      prettify: true,
      hasGrid: true,
      onChange: (e) => {
        console.log(e);
        let data4 = data.get(sel).filter((d) => d.end_date === e.fromValue);
        let totalNum =
          d3.sum(data4, (v) => +v.vaccines) /
          +d3.sum(data4, (v) => +v.population);

        document.getElementById(
          "laname"
        ).innerHTML = `Greater London  <br> Vaccination Rate: ${d3.format(
          ".1%"
        )(totalNum)}  `;

        let data3 = d3.group(data2.get(e.fromValue), (d) => d["ltla_name"]);

        result.features.forEach((d, i) => {
          data3.forEach((ddd) => {
            if (ddd[0]["ltla_name"] == d.properties.neighbourhood) {
              let num =
                d3.sum(ddd, (dd) => +dd["vaccines"]) /
                d3.sum(ddd, (dd) => +dd["population"]);
              //    console.log("num",num)
              let _100 = (num - mindata) / (maxdata - mindata);

              //    console.log(_100)
              d.properties.color = compute(_100);
              d.properties.num = num;
            }
          });
        });

        map.getSource("LocalAuthorities").setData(result);
        map.getSource("lahighlight").setData(result);
      },
    });
  });
});
class Bar {
  constructor(data, id, title) {
    this.data = data;
    this.id = id;
    this.title = title;
    this.initBarSvg();
    this.drawBar();
  }

  initBarSvg() {
    let div = d3.select(`#${this.id}`);
    this.getWH(div);

    div.selectAll("*").remove();
    this.margin = { left: 50, right: 10, top: 30, bottom: 50 };
    this.innerW = this.width - this.margin.left - this.margin.right;
    this.innerH = this.height - this.margin.top - this.margin.bottom;
    this.svg = div
      .append("svg")
      .attr("width", this.width)
      .attr("height", this.height);
    this.ChartArea = this.svg
      .append("g")
      .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

    this.ChartArea.append("text")
      .attr("transform", `translate(${this.innerW / 2},${this.innerH + 30})`)
      .text("");
    this.ChartArea.append("text")
      .attr("transform", `translate(${-55},${this.innerH / 4}) rotate(90)`)
      .text("");
    //title
    this.svg.append("text").attr("x", 10).attr("y", 20).text(this.title);

    this.DrawArea = this.ChartArea.append("g");

    this.x = d3
      .scaleBand()
      .range([0, this.innerW])
      .domain(this.data.map((d) => d[0]))
      .padding(0.3);
    this.y = d3
      .scaleLinear()
      .range([this.innerH, 0])
      .domain([0, d3.max(this.data, (d) => d[1])]);

    this.AxisY = this.ChartArea.append("g");
    this.AxisX = this.ChartArea.append("g").attr(
      "transform",
      `translate(0,${this.innerH})`
    );
    this.AxisX.call(d3.axisBottom(this.x));
    this.AxisX.selectAll(".tick text").attr(
      "transform",
      ` translate(10,20) rotate(45)`
    );
  }

  getWH(node) {
    this.width = node.node().getBoundingClientRect().width;
    this.height = node.node().getBoundingClientRect().height;
  }
  drawBar() {
    this.AxisY.call(d3.axisLeft(this.y).tickFormat(d3.format(".1%")));

    this.DrawArea.selectAll("rect")
      .data(this.data)
      .join("rect")
      .attr("class", (d) => d[0]) //设置一个类名,方便后续调用
      .attr("x", (d) => this.x(d[0]))
      .attr("y", (d) => this.y(d[1]))
      .attr("width", this.x.bandwidth())
      .attr("height", (d) => this.innerH - this.y(d[1]))
      .attr("stroke", "black")
      .attr("stroke-width", "0.25")
      .attr("fill", "#005b96");

    this.DrawArea.selectAll("text")
      .data(this.data)
      .join("text")
      .attr("class", (d) => `text ${d[0]}`) //设置一个类名,方便后续调用
      .attr("x", (d) => this.x(d[0]))
      .attr("y", (d) => this.y(d[1]) - 5)
      .text((d) => d3.format(".1%")(d[1]))
      .attr("text-anchor", "start")
      .attr("font-size", "0.6rem")
      .attr("fill", "gray");
  }
}
