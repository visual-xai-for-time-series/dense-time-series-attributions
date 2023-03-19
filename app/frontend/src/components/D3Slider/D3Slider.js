import React, { useRef, useEffect } from 'react';

import * as d3 from 'd3';

export function D3Slider({ input_data, output_data }) {
    const wrapper_ref = useRef(null);

    console.log(input_data);

    useEffect(() => {
        const wrapper_element = d3.select(wrapper_ref.current);
        wrapper_element.selectAll('*').remove();

        const width = wrapper_element.node().clientWidth;
        const height = wrapper_element.node().parentNode.parentNode.parentNode.clientHeight;

        const max_samples = input_data.max_samples;
        const start_range = input_data.start_range;

        const margin = {
            left: 10,
            right: 10,
            top: 2.5,
            bottom: 2.5,
        };

        const x = d3.scaleLinear([0, max_samples], [margin.left, width - margin.right]).nice();

        const brush = d3
            .brushX()
            .extent([
                [margin.left, margin.top],
                [width - margin.right, height - margin.bottom],
            ])
            .on('start brush end', brushed);

        function brushed(event) {
            const selection = event.selection.map(x.invert).map(Math.round);
            output_data(selection);
        }

        const svg = wrapper_element
            .append('svg')
            .attr('width', width - margin.left - margin.right)
            .attr('height', height - margin.top - margin.bottom)
            .attr('viewbox', [0, 0, width, height]);

        svg.append('g').call(brush).call(brush.move, start_range.map(x));

        if (input_data.cur_summary_data) {
            const summary_data = input_data.cur_summary_data;
            const extent = d3.extent(summary_data);

            const y = d3.scaleLinear(extent, [margin.top, height - margin.bottom - 20]).nice();

            const line = d3
                .line()
                .x((_, i) => x(i))
                .y((d) => y(d))
                .curve(d3.curveCatmullRom.alpha(0.5));

            svg.append('g')
                .append('path')
                .datum(summary_data)
                .attr('fill', 'none')
                .attr('stroke', 'steelblue')
                .attr('stroke-width', 1.5)
                .attr('d', line);

            const tick_width = 50;
            const x_axis = (g) =>
                g
                    .attr('transform', `translate(0,${height - margin.bottom - 20})`)
                    .call(d3.axisBottom(x).ticks(width / tick_width));
            svg.append('g').call(x_axis);
        }
    }, [input_data.max_samples, input_data.cur_summary_data]); // eslint-disable-line react-hooks/exhaustive-deps

    return <div ref={wrapper_ref}></div>;
}

