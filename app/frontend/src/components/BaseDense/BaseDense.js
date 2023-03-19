import React, { useCallback } from 'react';

import { densePixel } from '../Helper/DensePixel';

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
        [data, data_normalized] // eslint-disable-line react-hooks/exhaustive-deps
    );

    return (
        <Container>
            <Graphics draw={draw}></Graphics>
        </Container>
    );
}

