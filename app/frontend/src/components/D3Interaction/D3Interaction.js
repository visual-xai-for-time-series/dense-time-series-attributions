import * as d3 from 'd3';

import React, { useRef, useEffect } from 'react';

import { round } from './../Helper/Helper';

import './D3Interaction.css';

export function D3Interaction({ input_data, output_data }) {
    console.log(input_data);

    const x_pos = input_data.x_pos;
    const y_pos = input_data.y_pos;

    const width = input_data.width;
    const height = input_data.height;

    const sorting_idc = input_data.sorting_idc;

    const svg_style = {
        top: y_pos,
        left: x_pos,
        width: width,
        height: height,
    };

    const div_ref = useRef();
    const svg_ref = useRef();

    useEffect(() => {
        if (sorting_idc) {
            const row_len = sorting_idc.length;
            const row_height = Math.max(1, round(height / row_len));

            d3.select(div_ref.current).selectAll('*').remove();
            const tooltip_div = d3
                .select(div_ref.current)
                .append('div')
                .style('opacity', 0)
                .attr('class', 'tooltip')
                .style('background-color', 'white')
                .style('border', 'solid')
                .style('border-width', '2px')
                .style('border-radius', '5px')
                .style('padding', '5px');

            function mouseover(_) {
                tooltip_div.style('opacity', 1).style('display', 'block');
                d3.select(this).style('stroke-opacity', 1);
            }

            function mousemove(d, e) {
                const x = d.pageX + 75 < width + x_pos ? d.pageX + 15 : width + x_pos - 50;
                const y = d.pageY + 5;

                tooltip_div
                    .html('Index of the row: ' + e)
                    .style('left', x + 'px')
                    .style('top', y + 'px');
            }

            function mouseleave(_) {
                tooltip_div.style('opacity', 0).style('display', 'none');
                d3.select(this).style('stroke-opacity', 0);
            }

            const svg = d3.select(svg_ref.current);
            const stroke_width = row_height / 100;

            svg.selectAll('*').remove();
            svg.selectAll('.sample-row')
                .data(sorting_idc)
                .enter()
                .append('g')
                .attr('class', 'sample-row')
                .attr('transform', (_, i) => {
                    return 'translate(0,' + i * row_height + ')';
                })
                .append('rect')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', width)
                .attr('height', row_height)
                .attr('fill-opacity', 0)
                .attr('stroke', 'blue')
                .attr('stroke-width', stroke_width)
                .style('stroke-opacity', 0)
                .on('mouseover', mouseover)
                .on('mousemove', mousemove)
                .on('mouseleave', mouseleave);
        }
    }, [sorting_idc]);

    return (
        <div className="interaction">
            <svg style={svg_style} ref={svg_ref}></svg>
            <div ref={div_ref}></div>
        </div>
    );
}

