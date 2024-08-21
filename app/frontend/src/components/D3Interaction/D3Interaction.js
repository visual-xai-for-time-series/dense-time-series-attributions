import * as d3 from 'd3';

import React, { useRef, useEffect, useState } from 'react';

import { round } from './../Helper/Helper';

import { PercentilePlot } from './PercentilePlot/PercentilePlot';

import './D3Interaction.css';

export function D3Interaction({ input_data, output_data, input_settings, clean }) {
    const [percentilePlotsData, setPercentilePlotsData] = useState({});
    const brushListKey = useRef(0);

    const x_pos = input_data.x_pos;
    const y_pos = input_data.y_pos;

    const layout = input_settings.layout;

    const width = input_data.width;
    const height = input_data.height;

    const ordering_idc = input_data.ordering_idc;

    const data_lengths = input_data.data_lengths;
    const data_lengths_scaled = input_data.data_lengths_scaled;

    const dataset = input_data.dataset;
    const stage = input_data.stage;

    const interestingness = input_data.interestingness;

    const svg_style = {
        top: y_pos,
        left: x_pos,
        width: width,
        height: height,
    };

    const div_ref = useRef();
    const svg_ref = useRef();
    const brush_ref = useRef();

    const addToPercentilePlotsData = (key, element) => {
        // const new_element = {};
        // new_element[key] = element;
        percentilePlotsData[key] = element;
        // setPercentilePlotsData((v) => ({ ...v, ...new_element }));
        const newData = { ...percentilePlotsData };
        newData[key] = element;
        setPercentilePlotsData(newData);
    };

    const removeFromPercentilePlotsData = (key) => {
        d3.select(svg_ref.current)
            .selectAll('.tmp_brushers')
            .filter(function () {
                return Number(d3.select(this).attr('data-key')) === Number(key);
            })
            .remove();
        const newData = { ...percentilePlotsData };
        newData[key] = 0;
        delete newData[key];
    };

    const clearPercentilePlots = () => {
        d3.select(svg_ref.current).selectAll('.tmp_brushers').remove();
        setPercentilePlotsData({});
    };

    const openPercentilePlot = (key) => {
        const selectedItem = percentilePlotsData[key];
        selectedItem['open'] = true;
        selectedItem['open_toggle'] = true;
        const newData = { ...percentilePlotsData };
        newData[key] = selectedItem;
        setPercentilePlotsData(newData);
    };

    useEffect(() => {
        if (ordering_idc) {
            const row_len = ordering_idc.length;

            const samples = layout === 'vertical' ? Math.max(1, round(height / row_len)) : height;
            const dimensions = layout === 'vertical' ? width : Math.max(1, round(width / row_len));

            const sample_stroke = layout === 'vertical' ? samples / 100 : dimensions / 100;

            // const div = d3.select(div_ref.current);
            const svg = d3.select(svg_ref.current);
            svg.selectAll('*').remove();
            const rows = svg.append('g').attr('class', 'rows');

            rows.selectAll('.sample-row')
                .data(ordering_idc)
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

                const relative_start = data_lengths_scaled
                    .slice(0, selected)
                    .reduce((a, b) => a + b, 0);
                const relative_pos = y_1 - relative_start;
                const relative_pos_end = y_2 - relative_start;
                const relative_pos_ration = relative_pos / data_lengths_scaled[selected];
                const relative_pos_end_ration = relative_pos_end / data_lengths_scaled[selected];

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

                const newPercentilePlotData = {
                    idc: idc,
                    start: relative_pos_ration,
                    end: relative_pos_end_ration,
                    key: key,
                    open: true,
                    dataset: dataset,
                    stage: stage,
                };
                addToPercentilePlotsData(key, newPercentilePlotData);

                let margin = 0;
                data_lengths_scaled.forEach((element, idx) => {
                    if (true) {
                        // selected !== idx
                        let rect_color = 'rgba(255, 165, 0, 0.3)';

                        let borderColor = 'rgba(255, 255, 255, 0.8)';
                        let borderWidth = 1;

                        let rectWidth = x_2 - x_1;
                        let rectHeight =
                            ((y_2 - y_1) * data_lengths_scaled[idx]) /
                            data_lengths_scaled[selected];
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
                            .attr('stroke-width', borderWidth)
                            .on('click', () => {
                                openPercentilePlot(key);
                            });

                        svg.append('text')
                            .attr('class', 'tmp_brushers')
                            .attr('data-key', key)
                            .attr('x', x_2 - 20)
                            .attr('y', rectY + 15)
                            .text('' + key);
                    }
                    margin += element;
                });
            }

            svg.selectAll('.brushers').remove();
            let margin = 0;
            data_lengths_scaled.forEach((element, idx) => {
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
    }, [ordering_idc]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (interestingness) {
            interestingness.forEach((interestingness_window) => {
                const samples_start = interestingness_window[0][0];
                const samples_end = interestingness_window[0][1];
                const time_point = interestingness_window[1];
                const time_point_start = time_point - 15;
                const time_point_end = time_point + 15;

                const window_length = interestingness_window[0][1] - interestingness_window[0][0];
                if (window_length > 25) {
                    brushListKey.current += 1;
                    const key = brushListKey.current;

                    const svg = d3.select(svg_ref.current);

                    const idc = ordering_idc.slice(samples_start, samples_end);

                    console.log(
                        `Key: ${key}\nWindow length: ${window_length}\nTime point: ${time_point}\nIdc: ${idc}`
                    );

                    const newPercentilePlotData = {
                        idc: idc,
                        start: Math.max(0, time_point_start),
                        end: Math.min(data_lengths[0], time_point_end),
                        key: key,
                        open: false,
                        dataset: dataset,
                        stage: stage,
                    };
                    addToPercentilePlotsData(key, newPercentilePlotData);

                    const start_x = svg
                        .selectAll('.sample-row')
                        .nodes()
                        .filter(function (d) {
                            if (d3.select(d).attr('data-idx') == idc[0]) {
                                return true;
                            }
                            // const x = d3.select(this).attr('x');
                            return false;
                        })
                        .map(function (d) {
                            return d3.select(d).attr('x');
                        });

                    console.log(start_x);

                    const end_x = svg
                        .selectAll('.sample-row')
                        .nodes()
                        .filter(function (d) {
                            if (d3.select(d).attr('data-idx') == idc[idc.length - 1]) {
                                return true;
                            }
                            // const x = d3.select(this).attr('x');
                            return false;
                        })
                        .map(function (d) {
                            return d3.select(d).attr('x');
                        });

                    console.log(start_x);
                    console.log(end_x);

                    const start = svg
                        .selectAll('.sample-row')
                        .filter(function () {
                            const x = d3.select(this).attr('x');
                            return samples_start < x && x < samples_end;
                        })
                        .nodes()
                        .map(function (d) {
                            return d3.select(d).attr('data-idx');
                        });
                    console.log(start);

                    let margin = 0;
                    data_lengths_scaled.forEach((element, idx) => {
                        if (true) {
                            const start_y =
                                margin + (time_point_start / data_lengths[idx]) * element;
                            const end_y = margin + (time_point_end / data_lengths[idx]) * element;

                            console.log('-------------------');
                            console.log(start_y + ' - ' + end_y);
                            console.log(start_x + ' - ' + end_x);
                            console.log('-------------------');

                            //         // selected !== idx
                            let rect_color = 'rgba(255, 165, 0, 0.3)';

                            let borderColor = 'rgba(255, 255, 255, 0.8)';
                            let borderWidth = 1;

                            //         let rectWidth = x_2 - x_1;
                            //         let rectHeight =
                            //             ((y_2 - y_1) * data_splitters[idx]) / data_splitters[selected];
                            //         let rectX = x_1;
                            //         let rectY = margin + relative_pos_ration * element;

                            svg.append('rect')
                                .attr('class', 'tmp_brushers')
                                .attr('data-key', key)
                                .attr('x', start_x)
                                .attr('y', start_y)
                                .attr('width', end_x - start_x)
                                .attr('height', end_y - start_y)
                                .attr('fill', rect_color)
                                .attr('stroke', borderColor)
                                .attr('stroke-width', borderWidth)
                                .on('click', () => {
                                    openPercentilePlot(key);
                                });

                            svg.append('text')
                                .attr('class', 'tmp_brushers')
                                .attr('data-key', key)
                                .attr('x', end_x - 20)
                                .attr('y', start_y + 15)
                                .text('' + key);
                        }
                        margin += element;
                    });
                }
            });
        }
    }, [interestingness]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        console.log(clean);
        clearPercentilePlots();
    }, [clean]);

    return (
        <div className="interaction">
            <svg style={svg_style} ref={svg_ref}>
                <g ref={brush_ref} />
            </svg>
            <div ref={div_ref}></div>
            <div>
                {Object.entries(percentilePlotsData).map(([key, percentilePlotData]) => (
                    <PercentilePlot
                        key={key}
                        input_data={percentilePlotData}
                        output_data={removeFromPercentilePlotsData}
                    ></PercentilePlot>
                ))}
            </div>
        </div>
    );
}

