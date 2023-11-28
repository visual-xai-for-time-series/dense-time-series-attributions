import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import React, { useState, useEffect, useRef } from 'react';

import './App.css';

import * as d3 from 'd3';

import Grid from '@mui/material/Grid';
import Item from '@mui/material/Grid';
import Box from '@mui/material/Box';

import { alpha } from '@mui/material';

import CircularProgress from '@mui/material/CircularProgress';

import { Parameters } from './components/Parameters/Parameters';
import { D3Interaction } from './components/D3Interaction/D3Interaction';

import Image from './components/Image/image';

function App() {
    const parameter_height = 60;

    const client_width = document.documentElement.clientWidth || document.body.clientWidth - 10;

    const client_height =
        (document.documentElement.clientHeight || document.body.clientHeight) -
        parameter_height -
        10;

    let start_layout = 'horizontal';
    let start_dataset = 'forda';

    let reloader = false;

    const meta_img = {
        width: client_width - 10,
        height: client_height,
    };

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

        available_colormaps: [],
        raw_time_series_colormap: 'interpolateRdBu',
        raw_time_series_hist_colormap: 'interpolateReds',
        activations_colormap: 'interpolateReds',
        activations_hist_colormap: 'interpolateReds',
        attributions_colormap: 'interpolateRdBu',
        attributions_hist_colormap: 'interpolateReds',
        predictions_colormap: 'viridis',
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

    const [img_data, setImageData] = useState(null);

    const [loading, setLoading] = useState(true);

    const ref = useRef();

    let start_end = 300;
    if (settings.layout === 'horizontal') {
        start_end = parseInt(client_width / 2);
    } else {
        start_end = parseInt((client_height - parameter_height) / 2);
    }

    const [url_param, setUrlParam] = useState(`${start_dataset}?start=0&end=${start_end}`);

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

    const changeSettings = (new_settings) => {
        setSettings({
            ...settings,
            ...new_settings,
        });
    };

    const changeUrlParam = (new_parameters) => {
        const start = new_parameters.sample_idc[0];
        const end = new_parameters.sample_idc[1];

        const stage = new_parameters.stage;
        const clustering_base = new_parameters.clustering_base;
        const clustering_method = new_parameters.clustering_method;
        const attribution_method = new_parameters.attribution_method;

        reloader = !reloader;

        setUrlParam(
            `${start_dataset}?start=${start}&end=${end}&stage=${stage}&clustering_base=${clustering_base}&clustering_method=${clustering_method}&attribution_method=${attribution_method}&reloader=${reloader}`
        );
    };

    const base_url = process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL : '';

    useEffect(() => {
        setLoading(true);
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth',
        });

        const url = base_url + '/api/getPixelImage/' + url_param;
        console.log(url);

        d3.json(url, {
            method: 'POST',
            body: JSON.stringify({
                layout: settings.layout,

                resolution_width: client_width - 10,
                resolution_height: client_height,

                raw: settings.show_raw_data,
                raw_hist: settings.show_raw_data_hist,

                activations: settings.show_activations,
                activations_hist: settings.show_activations_hist,

                attributions: settings.show_attributions,
                attributions_hist: settings.show_attributions_hist,

                labels_pred: settings.show_labels_pred,

                raw_time_series_colormap: settings.raw_time_series_colormap,
                raw_time_series_hist_colormap: settings.raw_time_series_hist_colormap,

                activations_colormap: settings.activations_colormap,
                activations_hist_colormap: settings.activations_hist_colormap,

                attributions_colormap: settings.attributions_colormap,
                attributions_hist_colormap: settings.attributions_hist_colormap,

                predictions_colormap: settings.predictions_colormap,
            }),
            headers: {
                'Content-type': 'application/json; charset=UTF-8',
            },
        })
            .then((data) => {
                console.log(data);

                setImageData(data.image);

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
                const data_splitters = data.meta.data_splitters;

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

                const rect = ref.current.getBoundingClientRect();
                console.log(rect);
                const interactions = {
                    x_pos: rect.left,
                    y_pos: rect.top,
                    width: rect.width,
                    height: rect.height,
                    sorting_idc: sorting_idc,
                    start_end: start_end,
                    data_splitters: data_splitters,
                };
                setInteractions(interactions);

                console.log('Finish');
                setLoading(false);
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
                        <Image data={img_data} meta={meta_img} ref={ref}></Image>
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
                    height: client_height,
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

