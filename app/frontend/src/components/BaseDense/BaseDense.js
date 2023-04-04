import React, { useCallback } from 'react';

import { DensePixelSamplesVertical, DensePixelSamplesHorizontal } from '../Helper/DensePixel';

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

                const layout = data.layout;

                if (layout === 'vertical') {
                    DensePixelSamplesVertical(
                        data_normalized,
                        g,
                        data.dimensions,
                        data.samples,
                        data.pos,
                        data.color_data
                    );
                } else {
                    DensePixelSamplesHorizontal(
                        data_normalized,
                        g,
                        data.samples,
                        data.dimensions,
                        data.pos,
                        data.color_data
                    );
                }

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

