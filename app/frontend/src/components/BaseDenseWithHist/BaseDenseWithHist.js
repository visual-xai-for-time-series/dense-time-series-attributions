import React, { useCallback } from 'react';

import { densePixel } from '../Helper/DensePixel';

import { Graphics, Container } from '@pixi/react';

import './BaseDenseWithHist.css';

export function BaseDenseWithHist({ data, event }) {
    let data_normalized = null;
    let hist_normalized = null;
    if (data && data.data && data.hist) {
        data_normalized = data.data;
        hist_normalized = data.hist;
    }

    const draw = useCallback(
        (g) => {
            if (data && data.data && data_normalized && hist_normalized) {
                g.clear();

                const intra_margin = data.intra_margin;
                const width = data.width - intra_margin;

                const attr_width = width * 0.9;
                const hist_width = width * 0.1;

                densePixel(
                    data_normalized,
                    g,
                    data.pos_x,
                    attr_width,
                    data.height,
                    data.color_data
                );
                densePixel(
                    hist_normalized,
                    g,
                    data.pos_x + attr_width + intra_margin,
                    hist_width,
                    data.height,
                    data.color_hist
                );
                event(true);
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

