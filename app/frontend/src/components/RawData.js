import React, { useState, useRef } from 'react';

import * as d3 from 'd3';

import { densePixel } from './DensePixel';

export function RawData({ rawdata }) {
    const [error, setError] = useState(null);

    const ref = useRef();

    if (error) {
        return <div>Error: {error.message}</div>;
    }

    if (rawdata) {
        const div = d3.select(ref.current);

        div.selectAll('*').remove();

        let rawdata_normalized = [];
        rawdata.forEach((a) => {
            let extent = d3.extent(a);
            let a_tmp = d3.scaleLinear().domain(extent).range([0, 1]);
            rawdata_normalized.push(a.map(a_tmp));
        });

        const client_width = div.node().getBoundingClientRect().width - 10;
        const client_height = document.documentElement.clientHeight;

        const svg = div
            .append('svg')
            .attr('viewBox', `0 0 ${client_width} ${client_height}`)
            .attr('preserveAspectRatio', 'xMinYMin meet')
            .attr('width', client_width)
            .attr('height', client_height);

        densePixel(rawdata_normalized, svg, client_width, client_height);
    }

    return (
        <div ref={ref}>
            <div>Loading...</div>
        </div>
    );
}

