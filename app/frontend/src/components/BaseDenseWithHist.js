import React, { useCallback } from 'react';

import * as d3 from 'd3';

import { densePixel } from './DensePixel';

import { Graphics, Container } from '@pixi/react';

import './BaseDenseWithHist.css';

export function BaseDenseWithHist({ data }) {
    console.log(data);

    let data_normalized = null;
    let hist_normalized = null;
    if (data && data.data && data.hist) {
        data_normalized = [];
        data.data.forEach((a) => {
            let extent = d3.extent(a);
            let a_tmp = d3.scaleLinear().domain(extent).range([0, 1]);
            data_normalized.push(a.map(a_tmp));
        });

        hist_normalized = [];
        data.hist.forEach((a, i) => {
            let extent = d3.extent(a);
            let a_tmp = d3.scaleLinear().domain(extent).range([0, 1]);
            hist_normalized.push(a.map(a_tmp));
        });
    }

    const draw = useCallback(
        (g) => {
            if (data && data.data && data_normalized && hist_normalized) {
                const attr_width = data.width * 0.9;
                const hist_width = data.width * 0.1;

                densePixel(data_normalized, g, data.pos_x, attr_width, data.height);
                densePixel(
                    hist_normalized,
                    g,
                    data.pos_x + attr_width,
                    hist_width,
                    data.height,
                    d3.interpolateBlues
                );
            }
        },
        [data, data_normalized, hist_normalized]
    );

    return (
        <Container>
            <Graphics draw={draw}></Graphics>
        </Container>
    );
}

