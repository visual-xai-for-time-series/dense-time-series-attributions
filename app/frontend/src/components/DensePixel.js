import * as d3 from 'd3';

function round(x) {
    return Number.parseFloat(x).toFixed(2);
}

export function densePixel(data, svg, obj_width, obj_height, color = d3.interpolateRdBu) {
    const len_w = data[0].length;
    const len_h = data.length;

    const width = Math.max(1, round(obj_width / len_w));
    const height = Math.max(1, round(obj_height / len_h));

    svg.selectAll('.sample-axis')
        .data(data)
        .enter()
        .append('g')
        .attr('class', 'sample-axis')
        .attr('transform', (_, i) => {
            return 'translate(0,' + i * height + ')';
        })
        .selectAll('.time-axis')
        .data((d) => {
            return d;
        })
        .enter()
        .append('rect')
        .attr('x', (_, i) => {
            return width * i;
        })
        .attr('y', 0)
        .attr('width', width)
        .attr('height', height)
        .attr('fill', (d) => {
            return color(d);
        });
}

