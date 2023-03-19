import * as d3 from 'd3';

import { round, colorStringToD3Color, colorToSigned24Bit } from './Helper';

export function densePixel(data, g, start_x, obj_width, obj_height, color = d3.interpolateRdBu) {
    const len_w = data[0].length;
    const len_h = data.length;

    if (typeof color === 'string') {
        color = colorStringToD3Color(color);
    }

    const width = Math.max(1, round(obj_width / len_w));
    const height = Math.max(1, round(obj_height / len_h));

    data.forEach((sample, i) => {
        sample.forEach((point, j) => {
            const col = colorToSigned24Bit(d3.color(color(point)).formatHex());
            g.beginFill(col, 1);
            let x = round(start_x + width * j);
            let y = round(i * height);
            g.drawRect(x, y, width, height);
            g.endFill();
        });
    });

    return true;
}

