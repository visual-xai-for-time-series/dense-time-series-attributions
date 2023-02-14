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

function MinMaxNorm(data) {
    let data_normalized = [];

    data.forEach((a) => {
        let extent = d3.extent(a);
        let a_tmp = d3.scaleLinear().domain(extent).range([0, 1]);
        data_normalized.push(a.map(a_tmp));
    });

    return data_normalized;
}

function App() {
    const [attributions, setAttributions] = useState(null);
    const [activations, setActivations] = useState(null);
    const [rawdata, setRawData] = useState(null);

    const [error, setError] = useState(null);

    const [parameters, setParameters] = useState({});

    const [url_param, setUrlParam] = useState('forda?start=0&end=100');

    const [loading, setLoading] = useState(true);

    const ref = useRef();

    const base_url = process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL : '';

    const client_width =
        (window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth) -
        20;
    const client_height =
        (window.innerHeight ||
            document.documentElement.clientHeight ||
            document.body.clientHeight) - 60;
    const [vis_height, setVisHeight] = useState(client_height);

    const loadElements = { attributions: false, activations: false, rawdata: false };
    const handleLoading = (key, param) => {
        loadElements[key] = param;

        if (Object.values(loadElements).every((e) => e === true)) {
            setLoading(false);
        }
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
        console.log(`${start}&${end}&${client_height}`);

        const ordering_data = new_parameters.ordering_data;
        const ordering_method = new_parameters.ordering_method;
        setUrlParam(
            `forda?start=${start}&end=${end}&ordering_data=${ordering_data}&ordering_method=${ordering_method}`
        );
    };

    useEffect(() => {
        setLoading(true);

        const url = base_url + '/api/data/' + url_param;
        console.log(url);
        d3.json(url)
            .then((data) => {
                const orderings = data.meta.orderings;
                const max_samples = data.meta.max_samples;
                const cur_ordering_data = data.meta.cur_ordering_data;
                const cur_ordering_method = data.meta.cur_ordering_method;
                const summary_data = data.meta.summary_data;

                console.log(data.meta);

                setParameters({
                    orderings: orderings,
                    max_samples: max_samples,
                    cur_ordering_data: cur_ordering_data,
                    cur_ordering_method: cur_ordering_method,
                    summary_data: summary_data,
                });

                const length = data.meta.length;

                const width_raw =
                    (client_width * (data.raw_test[0].length + data.raw_test_hist[0].length)) /
                    length;
                const width_act =
                    (client_width *
                        (data.activations_test[0].length + data.activations_test_hist[0].length)) /
                    length;
                const width_att =
                    (client_width *
                        (data.attributions_test[0].length +
                            data.attributions_test_hist[0].length)) /
                    length;

                const pos_raw = 0;
                const pos_act = pos_raw + width_raw;
                const pos_att = pos_act + width_act;

                let attributions = {
                    data: MinMaxNorm(data.attributions_test),
                    hist: MinMaxNorm(data.attributions_test_hist),
                    width: width_att,
                    height: vis_height,
                    pos_x: pos_att,
                };
                setAttributions(attributions);

                let activations = {
                    data: MinMaxNorm(data.activations_test),
                    hist: MinMaxNorm(data.activations_test_hist),
                    width: width_act,
                    height: vis_height,
                    pos_x: pos_act,
                };
                setActivations(activations);

                let rawdata = {
                    data: MinMaxNorm(data.raw_test),
                    hist: MinMaxNorm(data.raw_test_hist),
                    width: width_raw,
                    height: vis_height,
                    pos_x: pos_raw,
                };
                setRawData(rawdata);

                console.log('Finish');
            })
            .catch((reason) => {
                setError(reason);
            });
    }, [url_param]);

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

