import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import React, { useState, useEffect, useRef } from 'react';

import './App.css';

import 'intro.js/introjs.css';

import * as d3 from 'd3';

import Grid from '@mui/material/Grid';
import Item from '@mui/material/Grid';
import Box from '@mui/material/Box';

import { Steps } from 'intro.js-react';

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

    const start_layout = 'horizontal';
    const start_dataset = '';

    let reloader = false;

    const meta_img = {
        width: client_width - 10,
        height: client_height,
    };

    const [settings, setSettings] = useState({
        dataset: start_dataset,
        available_datasets: [],

        layout: start_layout,
        layouts: ['vertical', 'horizontal'],

        show_raw_data: true,
        show_raw_data_histogram: false,
        show_activations: true,
        show_activations_histogram: false,
        show_attributions: true,
        show_attributions_histogram: false,
        show_labels_pred: true,

        available_colormaps: [],
        raw_time_series_colormap: 'interpolateRdBu',
        raw_time_series_histogram_colormap: 'interpolateReds',
        activations_colormap: 'interpolateReds',
        activations_histogram_colormap: 'interpolateReds',
        attributions_colormap: 'interpolateRdBu',
        attributions_histogram_colormap: 'interpolateReds',
        predictions_colormap: 'viridis',
    });

    const [parameters, setParameters] = useState({
        orderings: {},
        max_samples: null,
        cur_ordering_base: '',
        cur_ordering_method: '',
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
        dataset: null,
        stage: null,
        interestingness: null,
    });

    const [error, setError] = useState(null);

    const [img_data, setImageData] = useState(null);

    const [loading, setLoading] = useState(true);

    const [stepsEnabled, setStepsEnabled] = useState(false);

    const ref = useRef();

    let start_end = 300;
    if (settings.layout === 'horizontal') {
        start_end = parseInt(client_width / 2);
    } else {
        start_end = parseInt((client_height - parameter_height) / 2);
    }

    const [url_param, setUrlParam] = useState(`${settings.dataset}?start=0&end=${start_end}`);

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
        const ordering_base = new_parameters.ordering_base;
        const ordering_method = new_parameters.ordering_method;
        const attribution_method = new_parameters.attribution_method;

        reloader = !reloader;

        setUrlParam(
            `${settings.dataset}?start=${start}&end=${end}&stage=${stage}&ordering_base=${ordering_base}&ordering_method=${ordering_method}&attribution_method=${attribution_method}&reloader=${reloader}`
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
                raw_data_histogram: settings.show_raw_data_histogram,

                activations: settings.show_activations,
                activations_histogram: settings.show_activations_histogram,

                attributions: settings.show_attributions,
                attributions_histogram: settings.show_attributions_histogram,

                labels_pred: settings.show_labels_pred,

                raw_time_series_colormap: settings.raw_time_series_colormap,
                raw_time_series_histogram_colormap: settings.raw_time_series_histogram_colormap,

                activations_colormap: settings.activations_colormap,
                activations_histogram_colormap: settings.activations_histogram_colormap,

                attributions_colormap: settings.attributions_colormap,
                attributions_histogram_colormap: settings.attributions_histogram_colormap,

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

                const orderings = data.meta.orderings;
                const max_samples = data.meta.max_samples;
                const cur_ordering_base = data.meta.cur_ordering_base;
                const cur_ordering_method = data.meta.cur_ordering_method;
                const summary_data = data.meta.summary_data;
                const cur_stage = data.meta.cur_stage;
                const cur_attribution_method = data.meta.cur_attribution_method;
                const stages = data.meta.stages;
                const attribution_methods = data.meta.attribution_methods;
                const ordering_idc = data.meta.ordering_idc;
                const data_lengths = data.meta.data_lengths;
                const data_lengths_scaled = data.meta.data_lengths_scaled;
                const interestingness = data.meta.interestingness;

                setParameters({
                    orderings: orderings,
                    max_samples: max_samples,
                    cur_ordering_base: cur_ordering_base,
                    cur_ordering_method: cur_ordering_method,
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
                    ordering_idc: ordering_idc,
                    start_end: start_end,
                    data_lengths: data_lengths,
                    data_lengths_scaled: data_lengths_scaled,
                    dataset: settings.dataset,
                    stage: cur_stage,
                    interestingness: interestingness,
                };
                setInteractions(interactions);

                console.log('Finish');
                setLoading(false);
                setStepsEnabled(true);
            })
            .catch((reason) => {
                setError(reason);
            });
    }, [url_param]); // eslint-disable-line react-hooks/exhaustive-deps

    if (error) {
        return <div>Error: {error.message}</div>;
    }

    const steps = [
        // {
        //     element: '.dense-pixel',
        //     intro: 'Dense-Pixel Visualization with each pixel representing a certain value in the data.',
        //     position: 'right',
        // },
        // {
        //     element: '.parameters',
        //     intro: 'Parameter Settings',
        // },
    ];

    const onExit = () => {
        setStepsEnabled(false);
    };

    return (
        <div className="App">
            <Steps enabled={stepsEnabled} steps={steps} initialStep={0} onExit={onExit} />
            <Grid container spacing={0}>
                <Grid item xs={12} className="dense-pixel">
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
                    className="parameters"
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

