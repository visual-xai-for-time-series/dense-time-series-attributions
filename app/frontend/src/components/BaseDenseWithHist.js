import React, { useState, useRef } from 'react';

import * as d3 from 'd3';

import { densePixel } from './DensePixel';

import './BaseDenseWithHist.css';

export function BaseDenseWithHist({ data }) {
    const [error, setError] = useState(null);

    const ref = useRef();

    if (error) {
        return <div>Error: {error.message}</div>;
    }

    if (data && data.data) {
        const div = d3.select(ref.current);
        div.selectAll('*').remove();

        let data_normalized = [];
        data.data.forEach((a, i) => {
            let extent = d3.extent(a);
            let a_tmp = d3.scaleLinear().domain(extent).range([0, 1]);
            data_normalized.push(a.map(a_tmp));
        });

        let hist_normalized = [];
        data.hist.forEach((a, i) => {
            let extent = d3.extent(a);
            let a_tmp = d3.scaleLinear().domain(extent).range([0, 1]);
            hist_normalized.push(a.map(a_tmp));
        });

        const client_width = div.node().getBoundingClientRect().width - 10;
        const client_height = document.documentElement.clientHeight;

        const attr_width = client_width * 0.9;
        const hist_width = client_width * 0.1;

        const svg_data = div
            .append('svg')
            .attr('viewBox', `0 0 ${attr_width} ${client_height}`)
            .attr('preserveAspectRatio', 'xMinYMin meet')
            .attr('width', attr_width)
            .attr('height', client_height);

        densePixel(data_normalized, svg_data, attr_width, client_height);

        const svg_hist = div
            .append('svg')
            .attr('viewBox', `0 0 ${hist_width} ${client_height}`)
            .attr('preserveAspectRatio', 'xMinYMin meet')
            .attr('width', hist_width)
            .attr('height', client_height);

        densePixel(hist_normalized, svg_hist, hist_width, client_height, d3.interpolateBlues);
    }

    return (
        <div ref={ref}>
            <div>Loading...</div>
        </div>
    );
}

