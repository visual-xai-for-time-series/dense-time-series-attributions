import * as d3 from 'd3';

import React, { useRef, useEffect, useState } from 'react';

import { round } from './../Helper/Helper';

import { D3LinePlot } from './D3LinePlot/D3LinePlot';

import './D3Interaction.css';

export function D3Interaction({ input_data, output_data, input_settings }) {
    const [brushedList, setBrushedList] = useState([]);
    const brushListKey = useRef(0);

    const x_pos = input_data.x_pos;
    const y_pos = input_data.y_pos;

    const layout = input_settings.layout;

    const width = input_data.width;
    const height = input_data.height;

    const sorting_idc = input_data.sorting_idc;

    const data_splitters = input_data.data_splitters;

    const svg_style = {
        top: y_pos,
        left: x_pos,
        width: width,
        height: height,
    };

    const div_ref = useRef();
    const svg_ref = useRef();
    const brush_ref = useRef();

    const addToBrushList = (element) => {
        setBrushedList((v) => [...v, element]);
    };

    const removeFromBrushList = (key) => {
        d3.select(svg_ref.current)
            .selectAll('.tmp_brushers')
            .filter(function () {
                return Number(d3.select(this).attr('data-key')) === Number(key);
            })
            .remove();
        setBrushedList((prevState) => prevState.filter((item) => Number(item.key) !== Number(key)));
    };

    useEffect(() => {
        if (sorting_idc) {
            const row_len = sorting_idc.length;

            const samples = layout === 'vertical' ? Math.max(1, round(height / row_len)) : height;
            const dimensions = layout === 'vertical' ? width : Math.max(1, round(width / row_len));

            const sample_stroke = layout === 'vertical' ? samples / 100 : dimensions / 100;

            const div = d3.select(div_ref.current);
            const svg = d3.select(svg_ref.current);
            const rows = svg.append('g').attr('class', 'rows');

            div.selectAll('*').remove();
            const tooltip_div = div
                .append('div')
                .style('opacity', 0)
                .attr('class', 'tooltip')
                .style('background-color', 'white')
                .style('border', 'solid')
                .style('border-width', '2px')
                .style('border-radius', '5px')
                .style('padding', '5px');

            rows.selectAll('*').remove();
            rows.selectAll('.sample-row')
                .data(sorting_idc)
                .enter()
                // .append('g')
                // .attr('class', 'sample-row')
                // .attr('transform', (_, i) => {
                //     if (layout === 'vertical') {
                //         return 'translate(0, ' + i * samples + ')';
                //     } else {
                //         return 'translate(' + i * dimensions + ', 0)';
                //     }
                // })
                .append('rect')
                .attr('class', 'sample-row')
                .attr('data-idx', (d) => {
                    return d;
                })
                // .attr('x', 0)
                .attr('x', (_, i) => {
                    if (layout === 'vertical') {
                        return i * samples;
                    } else {
                        return i * dimensions;
                    }
                })
                .attr('y', 0)
                .attr('width', dimensions)
                .attr('height', samples)
                .attr('fill-opacity', 0)
                .attr('stroke', 'blue')
                .attr('stroke-width', sample_stroke)
                .style('stroke-opacity', 0);

            function brushed({ target, type, selection }) {
                if (type === 'start' || selection === null) {
                    // svg.selectAll('.tmp_brushers').remove();
                    return;
                }
                brushListKey.current += 1;
                const key = brushListKey.current;

                const selected = target.idx;

                const x_1 = selection[0][0];
                const x_2 = selection[1][0];

                const y_1 = selection[0][1];
                const y_2 = selection[1][1];

                const relative_start = data_splitters.slice(0, selected).reduce((a, b) => a + b, 0);
                const relative_pos = y_1 - relative_start;
                const relative_pos_end = y_2 - relative_start;
                const relative_pos_ration = relative_pos / data_splitters[selected];
                const relative_pos_end_ration = relative_pos_end / data_splitters[selected];

                const idc = rows
                    .selectAll('.sample-row')
                    .filter(function () {
                        const x = d3.select(this).attr('x');
                        return x_1 < x && x < x_2;
                    })
                    .nodes()
                    .map(function (d) {
                        return d3.select(d).attr('data-idx');
                    });

                const lineplot_data = {
                    idc: idc,
                    start: relative_pos_ration,
                    end: relative_pos_end_ration,
                    key: key,
                };
                const new_lineplot = (
                    <D3LinePlot
                        key={key}
                        input_data={lineplot_data}
                        output_data={removeFromBrushList}
                    ></D3LinePlot>
                );
                addToBrushList(new_lineplot);

                let margin = 0;
                data_splitters.forEach((element, idx) => {
                    if (true) {
                        // selected !== idx
                        let rect_color = 'rgba(255, 165, 0, 0.3)';

                        let borderColor = 'rgba(255, 255, 255, 0.8)';
                        let borderWidth = 1;

                        let rectWidth = x_2 - x_1;
                        let rectHeight =
                            ((y_2 - y_1) * data_splitters[idx]) / data_splitters[selected];
                        let rectX = x_1;
                        let rectY = margin + relative_pos_ration * element;

                        svg.append('rect')
                            .attr('class', 'tmp_brushers')
                            .attr('data-key', key)
                            .attr('x', rectX)
                            .attr('y', rectY)
                            .attr('width', rectWidth)
                            .attr('height', rectHeight)
                            .attr('fill', rect_color)
                            .attr('stroke', borderColor)
                            .attr('stroke-width', borderWidth);
                    }
                    margin += element;
                });
            }

            svg.selectAll('.brushers').remove();
            let margin = 0;
            data_splitters.forEach((element, idx) => {
                let brush = d3
                    .brush()
                    .extent([
                        [0, margin],
                        [width, margin + element],
                    ])
                    .on('start end', brushed);
                brush.idx = idx;

                svg.append('g')
                    .attr('class', 'brushers')
                    .attr('id', 'brush_' + idx)
                    .call(brush);

                margin += element;
            });
        }
    }, [sorting_idc]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="interaction">
            <svg style={svg_style} ref={svg_ref}>
                <g ref={brush_ref} />
            </svg>
            <div ref={div_ref}></div>
            {brushedList}
        </div>
    );
}

