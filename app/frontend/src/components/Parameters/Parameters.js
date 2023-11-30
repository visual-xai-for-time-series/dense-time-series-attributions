import React, { useState, useEffect } from 'react';

import Grid from '@mui/material/Grid';
import Item from '@mui/material/Grid';

import InputLabel from '@mui/material/InputLabel';

import MenuItem from '@mui/material/MenuItem';

import FormControl from '@mui/material/FormControl';

import Select from '@mui/material/Select';

import Button from '@mui/material/Button';

import ModelTraining from '@mui/icons-material/ModelTraining';

import { D3Slider } from '../D3Slider/D3Slider';
import { Settings } from '../Helper/Settings';

import { capitalize } from '../Helper/Helper';

export function Parameters({ input_data, output_data, input_settings, output_settings }) {
    const cluster_sortings = Object.keys(input_data.cluster_sortings);
    const cluster_sorting_methods = input_data.cluster_sortings;
    const stages = input_data.stages;
    const attribution_methods = input_data.attribution_methods;

    const start_end = input_data.start_end > 0 ? input_data.start_end : 100;
    const max_samples = input_data.max_samples ? input_data.max_samples : start_end;
    const start_range = [0, start_end];

    const [samples_idc, setSamplesIdc] = useState('');

    const [clustering_base, setClusteringBase] = useState('');
    const [clustering_method, setClusteringMethod] = useState('');

    const [stage, setStage] = useState('');
    const [attribution_method, setAttributionMethod] = useState('');

    const [cur_clustering_methods, setCurClusteringMethods] = useState([]);

    const [slider_parameters, setSliderParameters] = useState({
        max_samples: max_samples,
        start_range: start_range,
        cur_summary_data: null,
        cur_range: null,
    });

    useEffect(() => {
        const cur_clustering_base = input_data.cur_clustering_base;
        const cur_clustering_method = input_data.cur_clustering_method;
        const cur_stage = input_data.cur_stage;
        const cur_attribution_method = input_data.cur_attribution_method;
        const cur_clustering_methods = cluster_sorting_methods[cur_clustering_base] || [];

        setClusteringBase(cur_clustering_base);
        setCurClusteringMethods(cur_clustering_methods);
        setClusteringMethod(cur_clustering_method);
        setStage(cur_stage);
        setAttributionMethod(cur_attribution_method);

        const summary_data = input_data.summary_data;
        const cur_summary_data = summary_data ? summary_data[cur_clustering_base] : null;

        if (cur_summary_data) {
            const cur_slider_parameters = {
                max_samples: max_samples,
                start_range: start_range,
                cur_summary_data: cur_summary_data,
                cur_range: samples_idc,
            };
            setSliderParameters(cur_slider_parameters);
        }
    }, [input_data, cluster_sorting_methods]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSliderChange = (new_value) => {
        setSamplesIdc(new_value);
    };

    const handleStage = (event) => {
        setStage(event.target.value);
    };

    const handleAttributionMethod = (event) => {
        setAttributionMethod(event.target.value);
    };

    const handleClusteringBase = (event) => {
        const cur_clustering_base = event.target.value;
        console.log(cur_clustering_base);

        setClusteringBase(cur_clustering_base);
        setCurClusteringMethods(cluster_sorting_methods[cur_clustering_base]);
        setClusteringMethod(cluster_sorting_methods[cur_clustering_base][0]);

        const summary_data = input_data.summary_data;
        const cur_summary_data = summary_data[cur_clustering_base];
        const cur_slider_parameters = {
            max_samples: max_samples,
            start_range: start_range,
            cur_summary_data: cur_summary_data,
            cur_range: samples_idc,
        };
        setSliderParameters(cur_slider_parameters);
    };

    const handleClusteringMethod = (event) => {
        setClusteringMethod(event.target.value);
    };

    const handleButton = (_) => {
        const new_parameters = {
            stage: stage,
            sample_idc: samples_idc,
            clustering_base: clustering_base,
            clustering_method: clustering_method,
            attribution_method: attribution_method,
        };
        output_data(new_parameters);
    };

    return (
        <Grid
            container
            spacing={0}
            sx={{ mr: 1, ml: 1 }}
            alignItems="center"
            justifyContent="center"
        >
            <Grid item xs={6}>
                <Item>
                    <D3Slider
                        input_data={slider_parameters}
                        output_data={handleSliderChange}
                    ></D3Slider>
                </Item>
            </Grid>
            <Grid item xs={6}>
                <Item>
                    <Grid
                        container
                        spacing={0}
                        sx={{ mr: 0, ml: 0 }}
                        alignItems="center"
                        justifyContent="center"
                    >
                        <Grid item xs={2}>
                            <Item>
                                <FormControl
                                    sx={{
                                        m: 1,
                                        display: 'flex',
                                        wrap: 'nowrap',
                                        fullWidth: true,
                                    }}
                                    size="small"
                                >
                                    <InputLabel id="stage-select-label">Stage</InputLabel>
                                    <Select
                                        autoWidth={true}
                                        labelId="stage-select-label"
                                        id="stage-select"
                                        label="Stage"
                                        onChange={handleStage}
                                        value={stage}
                                    >
                                        {stages.length > 0
                                            ? stages.map((name) => (
                                                  <MenuItem key={name} value={name}>
                                                      {capitalize(name)}
                                                  </MenuItem>
                                              ))
                                            : null}
                                    </Select>
                                </FormControl>
                            </Item>
                        </Grid>
                        <Grid item xs={3}>
                            <Item>
                                <FormControl
                                    sx={{
                                        m: 1,
                                        display: 'flex',
                                        wrap: 'nowrap',
                                        fullWidth: true,
                                    }}
                                    size="small"
                                >
                                    <InputLabel id="attribution-method-select-label">
                                        Attribution Methods
                                    </InputLabel>
                                    <Select
                                        autoWidth={true}
                                        labelId="attribution-method-select-label"
                                        id="attribution-method-select"
                                        value={attribution_method}
                                        label="Attribution Method Data"
                                        onChange={handleAttributionMethod}
                                        displayEmpty
                                    >
                                        {attribution_methods.length > 0
                                            ? attribution_methods.map((name) => (
                                                  <MenuItem key={name} value={name}>
                                                      {capitalize(name)}
                                                  </MenuItem>
                                              ))
                                            : null}
                                    </Select>
                                </FormControl>
                            </Item>
                        </Grid>
                        <Grid item xs={2}>
                            <Item>
                                <FormControl
                                    sx={{
                                        m: 1,
                                        display: 'flex',
                                        wrap: 'nowrap',
                                        fullWidth: true,
                                    }}
                                    size="small"
                                >
                                    <InputLabel id="clustering-select-label">
                                        Ordering Base
                                    </InputLabel>
                                    <Select
                                        autoWidth={true}
                                        labelId="clustering-select-label"
                                        id="clustering-select"
                                        value={clustering_base}
                                        label="Ordering Base Data"
                                        onChange={handleClusteringBase}
                                    >
                                        {cluster_sortings.length > 0
                                            ? cluster_sortings.map((name) => (
                                                  <MenuItem key={name} value={name}>
                                                      {capitalize(name)}
                                                  </MenuItem>
                                              ))
                                            : null}
                                    </Select>
                                </FormControl>
                            </Item>
                        </Grid>
                        <Grid item xs={3}>
                            <Item>
                                <FormControl
                                    sx={{
                                        m: 1,
                                        display: 'flex',
                                        wrap: 'nowrap',
                                        fullWidth: true,
                                    }}
                                    size="small"
                                >
                                    <InputLabel id="clustering-method-select-label">
                                        Ordering Method
                                    </InputLabel>
                                    <Select
                                        autoWidth={true}
                                        labelId="clustering-method-select-label"
                                        id="clustering-method-select"
                                        value={clustering_method}
                                        label="Ordering Method"
                                        onChange={handleClusteringMethod}
                                    >
                                        {cur_clustering_methods.length > 0
                                            ? cur_clustering_methods.map((name) => (
                                                  <MenuItem key={name} value={name}>
                                                      {capitalize(name)}
                                                  </MenuItem>
                                              ))
                                            : null}
                                    </Select>
                                </FormControl>
                            </Item>
                        </Grid>
                        <Grid item xs={1}>
                            <Item>
                                <Button onClick={handleButton} variant="contained">
                                    <ModelTraining />
                                </Button>
                            </Item>
                        </Grid>
                        <Grid item xs={1}>
                            <Item>
                                <Settings
                                    input_settings={input_settings}
                                    output_settings={output_settings}
                                ></Settings>
                            </Item>
                        </Grid>
                    </Grid>
                </Item>
            </Grid>
        </Grid>
    );
}

