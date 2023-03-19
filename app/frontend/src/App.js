import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import React, { useState, useEffect, useRef } from 'react';

import './App.css';

import * as d3 from 'd3';

import { Stage } from '@pixi/react';

import Grid from '@mui/material/Grid';
import Item from '@mui/material/Grid';
import Box from '@mui/material/Box';

import { alpha } from '@mui/material';

import CircularProgress from '@mui/material/CircularProgress';

import { MinMaxNorm, SqrtNorm, softmax } from './components/Helper/Helper';
import { BaseDenseWithHist } from './components/BaseDenseWithHist/BaseDenseWithHist';
import { Parameters } from './components/Parameters/Parameters';
import { BaseDense } from './components/BaseDense/BaseDense';
import { D3Interaction } from './components/D3Interaction/D3Interaction';

function App() {
    const [attributions, setAttributions] = useState(null);
    const [activations, setActivations] = useState(null);
    const [rawdata, setRawData] = useState(null);
    const [labels, setLabels] = useState(null);

    const [parameters, setParameters] = useState({
        cluster_sortings: {},
        max_samples: null,
        cur_clustering_base: '',
        cur_clustering_method: '',
        cur_stage: '',
        cur_attribution_method: '',
        summary_data: null,
        stages: [],
        attribution_methods: [],
    });

    const [interactions, setInteractions] = useState({
        x_pos: null,
        y_pos: null,
        width: null,
        height: null,
        data: null,
    });

    const [error, setError] = useState(null);

    const [url_param, setUrlParam] = useState('forda?start=0&end=100');

    const [loading, setLoading] = useState(true);

    const ref = useRef();

    const client_width =
        (window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth) -
        20;
    const client_height =
        (window.innerHeight ||
            document.documentElement.clientHeight ||
            document.body.clientHeight) - 60;
    const [vis_height, setVisHeight] = useState(client_height);

    const loadElements = { labels: false, attributions: false, activations: false, rawdata: false };
    const handleLoading = (key, param) => {
        loadElements[key] = param;

        if (Object.values(loadElements).every((e) => e === true)) {
            setLoading(false);
        }
    };
    const labelElement = (param) => {
        handleLoading('labels', param);
    };
    const attributionElement = (param) => {
        handleLoading('attributions', param);
    };
    const activationsElement = (param) => {
        handleLoading('activations', param);
    };
    const rawdataElement = (param) => {
        handleLoading('rawdata', param);
    };

    const changeUrlParam = (new_parameters) => {
        const start = new_parameters.sample_idc[0];
        const end = new_parameters.sample_idc[1];

        setVisHeight(Math.max(end - start, client_height));

        const stage = new_parameters.stage;
        const clustering_base = new_parameters.clustering_base;
        const clustering_method = new_parameters.clustering_method;
        const attribution_method = new_parameters.attribution_method;
        setUrlParam(
            `forda?start=${start}&end=${end}&stage=${stage}&clustering_base=${clustering_base}&clustering_method=${clustering_method}&attribution_method=${attribution_method}`
        );
    };

    useEffect(() => {
        setLoading(true);
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth',
        });

        const base_url = process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL : '';
        const url = base_url + '/api/data/' + url_param;
        console.log(url);

        d3.json(url)
            .then((data) => {
                console.log(data);

                const cluster_sortings = data.meta.cluster_sortings;
                const max_samples = data.meta.max_samples;
                const cur_clustering_base = data.meta.cur_clustering_base;
                const cur_clustering_method = data.meta.cur_clustering_method;
                const summary_data = data.meta.summary_data;
                const cur_stage = data.meta.cur_stage;
                const cur_attribution_method = data.meta.cur_attribution_method;
                const stages = data.meta.stages;
                const attribution_methods = data.meta.attribution_methods;
                const sorting_idc = data.meta.sorting_idc;

                setParameters({
                    cluster_sortings: cluster_sortings,
                    max_samples: max_samples,
                    cur_clustering_base: cur_clustering_base,
                    cur_clustering_method: cur_clustering_method,
                    cur_stage: cur_stage,
                    cur_attribution_method: cur_attribution_method,
                    summary_data: summary_data,
                    stages: stages,
                    attribution_methods: attribution_methods,
                });

                const inter_margin = 5;
                const intra_margin = 3;

                const data_length =
                    data.raw[0].length +
                    data.raw_hist[0].length +
                    data.activations[0].length +
                    data.activations_hist[0].length +
                    data.attributions[0].length +
                    data.attributions_hist[0].length +
                    data.labels_pred[0].length;
                const length = data_length + intra_margin * 3 + inter_margin * 3;

                const raw_length = data.raw[0].length + data.raw_hist[0].length + intra_margin;
                const width_raw = (client_width * raw_length) / length;

                const act_length =
                    data.activations[0].length + data.activations_hist[0].length + intra_margin;
                const width_act = (client_width * act_length) / length;

                const att_length =
                    data.attributions[0].length + data.attributions_hist[0].length + intra_margin;
                const width_att = (client_width * att_length) / length;

                const lab_length = data.labels_pred[0].length;
                const width_lab = (client_width * lab_length) / length;

                const pos_raw = 0;
                const pos_act = pos_raw + width_raw + inter_margin;
                const pos_att = pos_act + width_act + inter_margin;
                const pos_lab = pos_att + width_att + inter_margin;

                let attributions = {
                    data: MinMaxNorm(data.attributions),
                    hist: SqrtNorm(data.attributions_hist),
                    color_data: 'interpolateRdBu',
                    color_hist: 'interpolateOranges',
                    width: width_att,
                    height: vis_height,
                    pos_x: pos_att,
                    intra_margin: intra_margin,
                };
                setAttributions(attributions);

                let activations = {
                    data: MinMaxNorm(data.activations),
                    hist: SqrtNorm(data.activations_hist),
                    color_data: 'interpolateOranges',
                    color_hist: 'interpolateOranges',
                    width: width_act,
                    height: vis_height,
                    pos_x: pos_act,
                    intra_margin: intra_margin,
                };
                setActivations(activations);

                let rawdata = {
                    data: MinMaxNorm(data.raw),
                    hist: SqrtNorm(data.raw_hist),
                    color_data: 'interpolateRdBu',
                    color_hist: 'interpolateOranges',
                    width: width_raw,
                    height: vis_height,
                    pos_x: pos_raw,
                    intra_margin: intra_margin,
                };
                setRawData(rawdata);

                let labels = {
                    data: data.labels_pred.map(softmax),
                    color_data: 'interpolateViridis',
                    width: width_lab,
                    height: vis_height,
                    pos_x: pos_lab,
                };
                setLabels(labels);

                const rect = ref.current._canvas.getBoundingClientRect();
                const interactions = {
                    x_pos: rect.left,
                    y_pos: rect.top,
                    width: rect.width,
                    height: rect.height,
                    sorting_idc: sorting_idc,
                };
                setInteractions(interactions);

                console.log('Finish');
            })
            .catch((reason) => {
                setError(reason);
            });
    }, [url_param]); // eslint-disable-line react-hooks/exhaustive-deps

    if (error) {
        return <div>Error: {error.message}</div>;
    }

    return (
        <div className="App">
            <Grid container spacing={0}>
                <Grid item xs={12}>
                    <Item>
                        <Stage
                            width={client_width}
                            height={vis_height}
                            options={{
                                backgroundColor: 0xffffff,
                                // backgroundColor: 0x000000,
                                backgroundAlpha: 1,
                                antialias: true,
                            }}
                            raf={false}
                            renderOnComponentChange={true}
                            ref={ref}
                        >
                            <BaseDenseWithHist
                                data={rawdata}
                                event={rawdataElement}
                            ></BaseDenseWithHist>
                            <BaseDenseWithHist
                                data={activations}
                                event={activationsElement}
                            ></BaseDenseWithHist>
                            <BaseDenseWithHist
                                data={attributions}
                                event={attributionElement}
                            ></BaseDenseWithHist>
                            <BaseDense data={labels} event={labelElement}></BaseDense>
                        </Stage>
                        <D3Interaction
                            input_data={interactions}
                            output_data={labelElement}
                        ></D3Interaction>
                    </Item>
                </Grid>
                <Parameters input_data={parameters} output_data={changeUrlParam}></Parameters>
            </Grid>
            <Box
                sx={{
                    width: '100vw',
                    height: vis_height,
                    backgroundColor: alpha('#eeeeee', 0.9),
                    displayPrint: 'none',
                    position: 'absolute',
                    top: 0,
                    visibility: loading ? 'visible' : 'hidden',
                }}
                alignItems="center"
                justifyContent="center"
                display="flex"
            >
                <CircularProgress />
            </Box>
        </div>
    );
}

export default App;

