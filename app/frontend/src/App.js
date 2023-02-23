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

// import { BaseDense } from './components/BaseDense';
import { BaseDenseWithHist } from './components/BaseDenseWithHist/BaseDenseWithHist';
import { Parameters } from './components/Parameters';
import { BaseDense } from './components/BaseDense';

function MinMaxNorm(data) {
    const data_normalized = [];

    data.forEach((d) => {
        const ext = d3.extent(d);
        const scaler = d3.scaleLinear().domain(ext).range([0, 1]);
        data_normalized.push(d.map(scaler));
    });

    return data_normalized;
}

function LogNorm(data) {
    const data_normalized = [];

    data.forEach((d) => {
        const d_fixed = d.map((e) => {
            return e + 0.000000001;
        });
        const ext = d3.extent(d_fixed);
        const scaler = d3.scaleSqrt().domain(ext).range([0, 1]);
        data_normalized.push(d_fixed.map(scaler));
    });

    return data_normalized;
}

function App() {
    const [attributions, setAttributions] = useState(null);
    const [activations, setActivations] = useState(null);
    const [rawdata, setRawData] = useState(null);
    const [labels, setLabels] = useState(null);

    const [error, setError] = useState(null);

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

        const base_url = process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL : '';
        const url = base_url + '/api/data/' + url_param;
        console.log(url);

        d3.json(url)
            .then((data) => {
                const cluster_sortings = data.meta.cluster_sortings;
                const max_samples = data.meta.max_samples;
                const cur_clustering_base = data.meta.cur_clustering_base;
                const cur_clustering_method = data.meta.cur_clustering_method;
                const summary_data = data.meta.summary_data;
                const cur_stage = data.meta.cur_stage;
                const cur_attribution_method = data.meta.cur_attribution_method;
                const stages = data.meta.stages;
                const attribution_methods = data.meta.attribution_methods;

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

                const length = data.meta.length + 8;

                const width_raw =
                    (client_width * (data.raw[0].length + data.raw_hist[0].length)) / length;
                const width_act =
                    (client_width *
                        (data.activations[0].length + data.activations_hist[0].length)) /
                    length;
                const width_att =
                    (client_width *
                        (data.attributions[0].length + data.attributions_hist[0].length)) /
                    length;
                const width_lab = (client_width * data.labels_pred[0].length) / length;

                const pos_raw = 0;
                const pos_act = pos_raw + width_raw + 2;
                const pos_att = pos_act + width_act + 2;
                const pos_lab = pos_att + width_att + 2;

                let attributions = {
                    data: MinMaxNorm(data.attributions),
                    hist: LogNorm(data.attributions_hist),
                    color_data: 'interpolateRdBu',
                    color_hist: 'interpolateOranges',
                    width: width_att,
                    height: vis_height,
                    pos_x: pos_att,
                };
                setAttributions(attributions);

                let activations = {
                    data: MinMaxNorm(data.activations),
                    hist: LogNorm(data.activations_hist),
                    color_data: 'interpolateOranges',
                    color_hist: 'interpolateOranges',
                    width: width_act,
                    height: vis_height,
                    pos_x: pos_act,
                };
                setActivations(activations);

                let rawdata = {
                    data: MinMaxNorm(data.raw),
                    hist: LogNorm(data.raw_hist),
                    color_data: 'interpolateRdBu',
                    color_hist: 'interpolateOranges',
                    width: width_raw,
                    height: vis_height,
                    pos_x: pos_raw,
                };
                setRawData(rawdata);

                let labels = {
                    data: data.labels_pred,
                    color_data: 'interpolatePuOr',
                    width: width_lab,
                    height: vis_height,
                    pos_x: pos_lab,
                };
                setLabels(labels);

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
            <Grid container spacing={0} ref={ref}>
                <Grid item xs={12}>
                    <Item>
                        <Stage
                            width={client_width}
                            height={vis_height}
                            options={{
                                backgroundColor: 0xffffff,
                                antialias: true,
                            }}
                            raf={false}
                            renderOnComponentChange={true}
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

