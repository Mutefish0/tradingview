import { sortBy, reverse } from "lodash";

const LABEL_HEIGHT = 32;

// avoid labels
const AvoidLabels = {
  id: "avoid-labels",
  beforeUpdate(chart) {
    const annotations =
      chart.config._config.options.plugins.annotation.annotations;
    const yScale = chart.scales.y;
    const yMax = yScale.getPixelForValue(yScale.min);
    const yMin = yScale.getPixelForValue(yScale.max);
    const yCenter = (yMin + yMax) / 2;
    const labels = [];
    for (let key in annotations) {
      const annotation = annotations[key];
      if (
        annotation.value !== undefined &&
        annotation.label &&
        annotation.scaleID === "y"
      ) {
        labels.push({
          pos: yScale.getPixelForValue(annotation.value),
          label: annotation.label,
        });
      }
    }

    // merge labels that have same values
    const sameMaps = {};
    for (let lb of labels) {
      if (sameMaps[lb.pos]) {
        sameMaps[lb.pos].label.ori_content =
          sameMaps[lb.pos].label.ori_content || sameMaps[lb.pos].label.content;
        sameMaps[lb.pos].label.content = [...sameMaps[lb.pos].label.content];
        sameMaps[lb.pos].label.content[0] += `, ${lb.label.content[0]}`;
        lb.label.enabled = false;
      } else {
        sameMaps[lb.pos] = lb;
        lb.label.content = lb.label.ori_content || lb.label.content;
        lb.label.ori_content = undefined;
        lb.label.enabled = true;
      }
    }

    const sortedLabelsASC = sortBy(Object.values(sameMaps), (l) => l.pos);

    const lowLables = sortedLabelsASC.filter((l) => l.pos <= yCenter);
    const highLabels = reverse(sortedLabelsASC.filter((l) => l.pos > yCenter));

    let lastPos = yMin - LABEL_HEIGHT;
    for (let lb of lowLables) {
      const delta = lb.pos - lastPos;
      if (delta < LABEL_HEIGHT) {
        lb.label.yAdjust = LABEL_HEIGHT - delta;
        lastPos = lb.pos + lb.label.yAdjust;
      } else {
        lastPos = lb.pos;
      }
    }

    lastPos = yMax + LABEL_HEIGHT;
    for (let lb of highLabels) {
      const delta = lastPos - lb.pos;
      if (delta < LABEL_HEIGHT) {
        lb.label.yAdjust = -(LABEL_HEIGHT - delta);
        lastPos = lb.pos + lb.label.yAdjust;
      } else {
        lastPos = lb.pos;
      }
    }
  },
};

export default AvoidLabels;
