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
    const parameter_height = 60;

    const client_width =
        window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;

    const client_height =
        (window.innerHeight ||
            document.documentElement.clientHeight ||
            document.body.clientHeight) - parameter_height;

    const [attributions, setAttributions] = useState(null);
    const [activations, setActivations] = useState(null);
    const [rawdata, setRawData] = useState(null);
    const [labels, setLabels] = useState(null);

    let start_layout = 'vertical';
    if (client_width > 3600) {
        start_layout = 'horizontal';
    }

    const [settings, setSettings] = useState({
        layout: start_layout,
        layouts: ['vertical', 'horizontal'],
        show_raw_data: true,
        show_raw_data_hist: false,
        show_activations: true,
        show_activations_hist: false,
        show_attributions: true,
        show_attributions_hist: false,
        show_labels_pred: true,
    });

    const [parameters, setParameters] = useState({
        cluster_sortings: {},
        max_samples: null,
        cur_clustering_base: '',
        cur_clustering_method: '',
        cur_stage: '',
        cur_attribution_method: '',
        summary_data: null,
        end_start: null,
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

    const [loading, setLoading] = useState(true);

    const ref = useRef();

    const [vis_height, setVisHeight] = useState(client_height);

    let start_end = 300;
    if (settings.layout === 'horizontal') {
        start_end = parseInt(client_width / 2);
    } else {
        start_end = parseInt((client_height - parameter_height) / 2);
    }
    const [url_param, setUrlParam] = useState(`forda?start=0&end=${start_end}`);

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

    const changeSettings = (new_settings) => {
        setSettings({
            ...settings,
            ...new_settings,
        });
    };

    const changeUrlParam = (new_parameters) => {
        const start = new_parameters.sample_idc[0];
        const end = new_parameters.sample_idc[1];

        if (settings.layout === 'vertical') {
            setVisHeight(Math.max(end - start, client_height));
        }

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
                console.log(data.meta);

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

                const layout = settings.layout;

                setParameters({
                    cluster_sortings: cluster_sortings,
                    max_samples: max_samples,
                    cur_clustering_base: cur_clustering_base,
                    cur_clustering_method: cur_clustering_method,
                    cur_stage: cur_stage,
                    cur_attribution_method: cur_attribution_method,
                    summary_data: summary_data,
                    start_end: start_end,
                    stages: stages,
                    attribution_methods: attribution_methods,
                });

                const inter_margin = 3;
                const intra_margin = 2;

                const raw_length = settings.show_raw_data ? data.raw[0].length : 0;
                const raw_hist_length = settings.show_raw_data_hist ? data.raw_hist[0].length : 0;

                const raw_margin =
                    settings.show_raw_data && settings.show_raw_data_his ? intra_margin : 0;
                const raw_length_overall = raw_length + raw_hist_length + raw_margin;

                const act_length = settings.show_activations ? data.activations[0].length : 0;
                const act_hist_length = settings.show_activations_hist
                    ? data.activations_hist[0].length
                    : 0;

                const act_margin =
                    settings.show_activations && settings.show_activations_hist ? intra_margin : 0;
                const act_length_overall = act_length + act_hist_length + act_margin;

                const att_length = settings.show_attributions ? data.attributions[0].length : 0;
                const att_hist_length = settings.show_attributions_hist
                    ? data.attributions_hist[0].length
                    : 0;

                const att_margin =
                    settings.show_attributions && settings.show_attributions_hist
                        ? intra_margin
                        : 0;
                const att_length_overall = att_length + att_hist_length + att_margin;

                const lab_length = settings.show_labels_pred
                    ? Math.max(5, data.labels_pred[0].length * 2)
                    : 0;

                const whole_length =
                    raw_length_overall +
                    inter_margin +
                    act_length_overall +
                    inter_margin +
                    att_length_overall +
                    inter_margin +
                    lab_length;

                if (layout === 'horizontal') {
                    setVisHeight(Math.max(whole_length, vis_height));
                }

                const dimensions = layout === 'vertical' ? client_width : vis_height;
                const samples = layout === 'vertical' ? vis_height : client_width;

                const dimensions_raw = (dimensions * raw_length_overall) / whole_length;
                const dimensions_act = (dimensions * act_length_overall) / whole_length;
                const dimensions_att = (dimensions * att_length_overall) / whole_length;
                const dimensions_lab = (dimensions * lab_length) / whole_length;

                const pos_raw = 0;
                const pos_act = pos_raw + dimensions_raw + inter_margin;
                const pos_att = pos_act + dimensions_act + inter_margin;
                const pos_lab = pos_att + dimensions_att + inter_margin;

                const att_data = att_length > 0 ? MinMaxNorm(data.attributions) : null;
                const att_hist = att_hist_length > 0 ? SqrtNorm(data.attributions_hist) : null;

                let attributions = {
                    data: att_data,
                    hist: att_hist,
                    color_data: 'interpolateRdBu',
                    color_hist: 'interpolateOranges',
                    dimensions: dimensions_att,
                    samples: samples,
                    pos: pos_att,
                    intra_margin: intra_margin,
                    layout: layout,
                };
                setAttributions(attributions);

                const act_data = act_length > 0 ? MinMaxNorm(data.activations) : null;
                const act_hist = act_hist_length > 0 ? SqrtNorm(data.activations_hist) : null;

                let activations = {
                    data: act_data,
                    hist: act_hist,
                    color_data: 'interpolateOranges',
                    color_hist: 'interpolateOranges',
                    dimensions: dimensions_act,
                    samples: samples,
                    pos: pos_act,
                    intra_margin: intra_margin,
                    layout: layout,
                };
                setActivations(activations);

                const raw_data = raw_length > 0 ? MinMaxNorm(data.raw) : null;
                const raw_hist = raw_hist_length > 0 ? SqrtNorm(data.raw_hist) : null;

                let rawdata = {
                    data: raw_data,
                    hist: raw_hist,
                    color_data: 'interpolateRdBu',
                    color_hist: 'interpolateOranges',
                    dimensions: dimensions_raw,
                    samples: samples,
                    pos: pos_raw,
                    intra_margin: intra_margin,
                    layout: layout,
                };
                setRawData(rawdata);

                const labels_pred = lab_length > 0 ? data.labels_pred.map(softmax) : null;

                let labels = {
                    data: labels_pred,
                    color_data: 'interpolateViridis',
                    dimensions: dimensions_lab,
                    samples: samples,
                    pos: pos_lab,
                    layout: layout,
                };
                setLabels(labels);

                const rect = ref.current._canvas.getBoundingClientRect();
                const interactions = {
                    x_pos: rect.left,
                    y_pos: rect.top,
                    width: rect.width,
                    height: rect.height,
                    sorting_idc: sorting_idc,
                    start_end: start_end,
                };
                setInteractions(interactions);

                console.log('Finish');
            })
            .catch((reason) => {
                setError(reason);
            });
    }, [url_param, settings]); // eslint-disable-line react-hooks/exhaustive-deps

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
                            input_settings={settings}
                        ></D3Interaction>
                    </Item>
                </Grid>
                <Parameters
                    input_data={parameters}
                    output_data={changeUrlParam}
                    input_settings={settings}
                    output_settings={changeSettings}
                ></Parameters>
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

