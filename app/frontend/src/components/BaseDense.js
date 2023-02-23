import React, { useCallback } from 'react';

import * as d3 from 'd3';

import { densePixel } from './DensePixel';

import { Graphics, Container } from '@pixi/react';

export function BaseDense({ data }) {
    let data_normalized = null;
    if (data && data.data) {
        data_normalized = [];
        data.data.forEach((a) => {
            let extent = d3.extent(a);
            let a_tmp = d3.scaleLinear().domain(extent).range([0, 1]);
            data_normalized.push(a.map(a_tmp));
        });
    }

    const draw = useCallback(
        (g) => {
            if (data && data.data) {
                densePixel(data_normalized, g, data.pos_x, data.width, data.height);
            }
        },
        [data, data_normalized]
    );

    return (
        <Container>
            <Graphics draw={draw}></Graphics>
        </Container>
    );
}

