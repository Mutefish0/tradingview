import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";
import annotationPlugin from "chartjs-plugin-annotation";
import avoidLabels from "./plugins/avoidLabels";
import "chartjs-adapter-luxon";
import _ from "lodash";
import { colorGen } from "./utils";

import "./App.css";

const config = {
  type: "line",
  data: {
    datasets: [],
  },
  options: {
    //responsive: true,
    //maintainAspectRatio: false,
    plugins: {
      decimation: {
        enabled: true,
        algorithm: "lttb",
      },
      zoom: {
        pan: {
          // pan options and/or events
          enabled: true,
          mode: "x",
        },
        limits: {
          // axis limits
        },
        zoom: {
          // zoom options and/or events
          enabled: true,
          mode: "x",
          wheel: {
            enabled: true,
          },
        },
      },
      annotation: {
        annotations: {},
      },
    },
    scales: {
      x: {
        type: "time",
      },
      y: {
        title: {
          display: true,
          text: "Value",
        },
      },
    },
    animation: false,
  },
};

const color = colorGen();

function App() {
  const refChart1 = useRef(null);
  const refChart2 = useRef(null);
  const refDatasetsMap = useRef({});
  const refColorMap = useRef({});

  // your event listener code - assuming the event object has the timestamp and value properties
  function onReceive(event) {
    const datasetsMap = refDatasetsMap.current;
    const {
      channel,
      type,
      action,
      data,
      chart: _chart = 0,
      borderColor,
      backgroundColor,
    } = event;
    const chart = _chart === 0 ? refChart1.current : refChart2.current;
    const colorMap = refColorMap.current;

    const isAnnotation = ["drawAnnotaion", "eraseAnnotaion"].includes(action);

    if (isAnnotation) {
      const annotations = chart.options.plugins.annotation.annotations;
      const id = event.id || crypto.randomUUID();

      if (action === "drawAnnotaion") {
        // 自动添加 label
        if (data.value !== undefined) {
          if (!annotations[id] || !annotations[id].lable) {
            data.label = {
              enabled: true,
              textAlign: "start",
              color: "rgb(0, 40, 57)",
              font: {
                family:
                  "-apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif",
                size: 10,
                weight: 200,
              },
              padding: 2,
              position: "start",
              backgroundColor: "rgba(217, 217, 219, 0.2)",
              drawTime: "afterDraw",
              content: [id, data.value],
            };
          }
        }

        if (!annotations[id]) {
          annotations[id] = data;
        } else {
          annotations[id] = { ...annotations[id], ...data };
        }

        if (annotations[id].colorId) {
          colorMap[annotations[id].colorId] =
            colorMap[annotations[id].colorId] || color.next().value;
        }
        annotations[id].borderColor =
          annotations[id].borderColor ||
          colorMap[annotations[id].colorId].border ||
          color.next().value.border;

        annotations[id].backgroundColor =
          annotations[id].backgroundColor ||
          colorMap[annotations[id].colorId].background ||
          color.next().value.background;
      } else if (action === "eraseAnnotaion") {
        delete annotations[id];
      }

      return;
    }

    if (!datasetsMap[channel]) {
      let options = {};
      if (borderColor) {
        options.borderColor = borderColor;
      }
      if (backgroundColor) {
        options.backgroundColor = backgroundColor;
      }
      if (type === "line") {
        options.pointRadius = 0;
      } else if (type === "bubble") {
        options.radius = 12;
      }
      const dataset = {
        label: channel,
        type,
        data: [],
        backgroundColor: color.next().value.background,
        borderColor: color.next().value.border,
        ...options,
      };
      chart.data.datasets.push(dataset);
      datasetsMap[channel] =
        chart.data.datasets[chart.data.datasets.length - 1];
    }

    const dataset = datasetsMap[channel];

    if (action === "drawPoint") {
      dataset.data.push({ x: data[0], y: data[1] });
    } else if (action === "batchDrawPoint") {
      for (let [x, y] of data) {
        dataset.data.push({ x, y });
      }
    }
    chart.update("quiet");
  }

  useEffect(() => {
    if (!refChart1.current) {
      Chart.register(...registerables);
      Chart.register(zoomPlugin);
      Chart.register(annotationPlugin);
      Chart.register(avoidLabels);
      refChart1.current = new Chart(document.getElementById("chart1"), config);
      const config2 = _.cloneDeep(config);
      refChart2.current = new Chart(document.getElementById("chart2"), config2);

      const ws = new WebSocket("ws://127.0.0.1:9400");

      ws.onopen = () => {
        console.log("websocket open!");
      };

      ws.onmessage = (e) => {
        const data = JSON.parse(e.data);
        onReceive(data);
      };
    }
  }, []);

  return (
    <div className="App">
      <canvas
        id="chart1"
        width={window.innerWidth}
        height={Math.floor(window.innerHeight * 0.6) - 10}
      />
      <div></div>
      <canvas
        id="chart2"
        width={window.innerWidth}
        height={Math.floor(window.innerHeight * 0.4) - 10}
      />
    </div>
  );
}

export default App;
