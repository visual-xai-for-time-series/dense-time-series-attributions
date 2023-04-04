import React, { useCallback } from 'react';

import { DensePixelSamplesVertical, DensePixelSamplesHorizontal } from '../Helper/DensePixel';

import { Graphics, Container } from '@pixi/react';

import './BaseDenseWithHist.css';

export function BaseDenseWithHist({ data, event }) {
    let data_normalized = null;
    let hist_normalized = null;
    if (data) {
        data_normalized = data.data;
        hist_normalized = data.hist;
    }

    const draw = useCallback(
        (g) => {
            if (data) {
                g.clear();

                const layout = data.layout;

                const intra_margin = data.intra_margin;
                const dimensions = data.dimensions - intra_margin;

                let data_dimensions = dimensions;
                let hist_dimensions = dimensions;
                if (data_normalized && hist_normalized) {
                    data_dimensions = dimensions * 0.9;
                    hist_dimensions = dimensions * 0.1;
                }

                if (layout === 'vertical') {
                    DensePixelSamplesVertical(
                        data_normalized,
                        g,
                        data_dimensions,
                        data.samples,
                        data.pos,
                        data.color_data
                    );

                    DensePixelSamplesVertical(
                        hist_normalized,
                        g,
                        hist_dimensions,
                        data.samples,
                        data.pos + data_dimensions + intra_margin,
                        data.color_hist
                    );
                } else {
                    DensePixelSamplesHorizontal(
                        data_normalized,
                        g,
                        data.samples,
                        data_dimensions,
                        data.pos,
                        data.color_data
                    );

                    DensePixelSamplesHorizontal(
                        hist_normalized,
                        g,
                        data.samples,
                        hist_dimensions,
                        data.pos + data_dimensions + intra_margin,
                        data.color_hist
                    );
                }

                event(true);
            }
        },
        [data, data_normalized, hist_normalized] // eslint-disable-line react-hooks/exhaustive-deps
    );

    return (
        <Container>
            <Graphics draw={draw}></Graphics>
        </Container>
    );
}

