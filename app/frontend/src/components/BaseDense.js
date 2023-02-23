import React, { useCallback } from 'react';

import * as d3 from 'd3';

import { densePixel } from './DensePixel';

import { Graphics, Container } from '@pixi/react';

export function BaseDense({ data, event }) {
    let data_normalized = null;
    if (data && data.data) {
        data_normalized = data.data;
    }

    const draw = useCallback(
        (g) => {
            if (data && data.data) {
                g.clear();

                densePixel(
                    data_normalized,
                    g,
                    data.pos_x,
                    data.width,
                    data.height,
                    data.color_data
                );

                event(true);
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

