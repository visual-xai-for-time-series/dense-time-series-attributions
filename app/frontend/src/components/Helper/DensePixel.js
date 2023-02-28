import * as d3 from 'd3';

function round(x) {
    return Number.parseFloat(x).toFixed(2);
}

function colorToSigned24Bit(s) {
    return (parseInt(s.substr(1), 16) << 8) / 256;
}

function colorStringToD3Color(color) {
    if (color === 'interpolateRdBu') {
        return d3.interpolateRdBu;
    }
    if (color === 'interpolateOranges') {
        return d3.interpolateOranges;
    }
    if (color === 'interpolatePuOr') {
        return d3.interpolatePuOr;
    }
    if (color === 'interpolateBlues') {
        return d3.interpolateBlues;
    }
    if (color === 'interpolateTurbo') {
        return d3.interpolateTurbo;
    }
    if (color === 'interpolateViridis') {
        return d3.interpolateViridis;
    }
    if (color === 'interpolateMagma') {
        return d3.interpolateMagma;
    }
}

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

