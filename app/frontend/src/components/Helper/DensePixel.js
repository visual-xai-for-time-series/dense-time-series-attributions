import * as d3 from 'd3';

import { round, colorStringToD3Color, colorToSigned24Bit } from './Helper';

export function DensePixelSamplesVertical(
    data,
    graphics,
    obj_width,
    obj_height,
    start_x = 0,
    color = d3.interpolateRdBu
) {
    if (!data) {
        return false;
    }

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
            graphics.beginFill(col, 1);
            let x = round(width * j + start_x);
            let y = round(height * i);
            graphics.drawRect(x, y, width, height);
            graphics.endFill();
        });
    });

    return true;
}

export function DensePixelSamplesHorizontal(
    data,
    graphics,
    obj_width,
    obj_height,
    start_y = 0,
    color = d3.interpolateRdBu
) {
    if (!data) {
        return false;
    }

    const len_w = data.length;
    const len_h = data[0].length;

    if (typeof color === 'string') {
        color = colorStringToD3Color(color);
    }

    const width = Math.max(1, round(obj_width / len_w));
    const height = Math.max(1, round(obj_height / len_h));

    data.forEach((sample, i) => {
        sample.forEach((point, j) => {
            const col = colorToSigned24Bit(d3.color(color(point)).formatHex());
            graphics.beginFill(col, 1);
            let x = round(width * i);
            let y = round(height * j + start_y);
            graphics.drawRect(x, y, width, height);
            graphics.endFill();
        });
    });

    return true;
}

