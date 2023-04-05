import * as d3 from 'd3';

import React, { useRef, useEffect } from 'react';

import { round } from './../Helper/Helper';

import './D3Interaction.css';

export function D3Interaction({ input_data, output_data, input_settings }) {
    const x_pos = input_data.x_pos;
    const y_pos = input_data.y_pos;

    const layout = input_settings.layout;

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

            const samples = layout === 'vertical' ? Math.max(1, round(height / row_len)) : height;
            const dimensions = layout === 'vertical' ? width : Math.max(1, round(width / row_len));

            const sample_stroke = layout === 'vertical' ? samples / 100 : dimensions / 100;

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
                const x = d.pageX + 180 < width + x_pos ? d.pageX + 15 : width + x_pos - 165;
                const y = d.pageY + 45 < height + y_pos ? d.pageY + 15 : height + y_pos - 35;

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

            svg.selectAll('*').remove();
            svg.selectAll('.sample-row')
                .data(sorting_idc)
                .enter()
                .append('g')
                .attr('class', 'sample-row')
                .attr('transform', (_, i) => {
                    if (layout === 'vertical') {
                        return 'translate(0, ' + i * samples + ')';
                    } else {
                        return 'translate(' + i * dimensions + ', 0)';
                    }
                })
                .append('rect')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', dimensions)
                .attr('height', samples)
                .attr('fill-opacity', 0)
                .attr('stroke', 'blue')
                .attr('stroke-width', sample_stroke)
                .style('stroke-opacity', 0)
                .on('mouseover', mouseover)
                .on('mousemove', mousemove)
                .on('mouseleave', mouseleave);
        }
    }, [sorting_idc]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="interaction">
            <svg style={svg_style} ref={svg_ref}></svg>
            <div ref={div_ref}></div>
        </div>
    );
}

