import React, { useState } from 'react';

import Slider from '@mui/material/Slider';
import Grid from '@mui/material/Grid';
import Item from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import Button from '@mui/material/Button';

import { D3Slider } from './D3Slider/D3Slider';

function capitalize(str) {
    const ret = [];
    const word_array = str.replaceAll('_', ' ').split(' ');
    word_array.forEach((word) => {
        ret.push(word[0].toUpperCase() + word.slice(1));
    });
    return ret.join(' ');
}

function decapitalize(str) {
    return str.replaceAll(' ', '_').toLowerCase();
}

export function Parameters({ input_data, output_data }) {
    console.log(input_data);

    const cur_clustering_base = input_data.cur_clustering_base
        ? input_data.cur_clustering_base
        : '';
    const cur_clustering_method = input_data.cur_clustering_method
        ? input_data.cur_clustering_method
        : '';
    const cur_stage = input_data.cur_stage ? input_data.cur_stage : '';
    const cur_attribution_method = input_data.cur_attribution_method
        ? input_data.cur_attribution_method
        : '';

    const summary_data = input_data.summary_data;

    const cluster_sortings = input_data.cluster_sortings
        ? Object.keys(input_data.cluster_sortings)
        : [];
    const cluster_sorting_methods = input_data.cluster_sortings ? input_data.cluster_sortings : {};
    const stages = input_data.stages ? input_data.stages : [];
    const attribution_methods = input_data.attribution_methods
        ? input_data.attribution_methods
        : [];

    console.log(cur_stage);

    const max_samples = input_data.max_samples ? input_data.max_samples : 100;

    const [samples_idc, setSamplesIdc] = useState([0, 100]);

    const [stage, setStage] = useState(cur_stage);
    const [attribution_method, setAttributionMethod] = useState(cur_attribution_method);

    const [clustering_base, setClusteringBase] = useState(cur_clustering_base);
    const [clustering_method, setClusteringMethod] = useState(cur_clustering_method);

    const [cur_clustering_methods, setCurClusteringMethods] = useState([]);

    // setStage(cur_stage);
    console.log(stage);

    const handleSliderChange = (newValue) => {
        setSamplesIdc(newValue);
    };

    const handleStage = (event) => {
        setStage(event.target.value);
    };

    const handleAttributionethod = (event) => {
        setAttributionMethod(event.target.value);
    };

    const handleClusteringBase = (event) => {
        setClusteringBase(event.target.value);
        setCurClusteringMethods(cluster_sorting_methods[event.target.value]);
        setClusteringMethod(cluster_sorting_methods[event.target.value][0]);
    };

    const handleClusteringMethod = (event) => {
        setClusteringMethod(event.target.value);
    };

    const handleButton = (_) => {
        const new_parameters = {
            sample_idc: samples_idc,
            clustering_base: clustering_base,
            clustering_method: clustering_method,
        };
        output_data(new_parameters);
    };

    const slider_params = {
        max_samples: max_samples,
        start_range: samples_idc,
        summary_data: summary_data,
    };

    return (
        <Grid
            container
            spacing={0}
            sx={{ mr: 1, ml: 1 }}
            alignItems="center"
            justifyContent="center"
        >
            <Grid item xs={4}>
                <Item>
                    <D3Slider
                        input_data={slider_params}
                        output_data={handleSliderChange}
                    ></D3Slider>
                </Item>
            </Grid>
            <Grid item xs={1}>
                <Item>
                    <FormControl
                        sx={{
                            m: 1,
                            minWidth: 100,
                        }}
                        size="small"
                    >
                        <InputLabel id="stage-select-label">Stage</InputLabel>
                        <Select
                            labelId="stage-select-label"
                            id="stage-select"
                            value={stage}
                            label="Stage"
                            onChange={handleStage}
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
            <Grid item xs={2}>
                <Item>
                    <FormControl
                        sx={{
                            m: 1,
                            minWidth: 200,
                        }}
                        size="small"
                    >
                        <InputLabel id="attribution-method-select-label">
                            Attribution Methods
                        </InputLabel>
                        <Select
                            labelId="attribution-method-select-label"
                            id="attribution-method-select"
                            value={attribution_method}
                            label="Attribution Method Data"
                            onChange={handleAttributionethod}
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
                            minWidth: 200,
                        }}
                        size="small"
                    >
                        <InputLabel id="clustering-select-label">Clustering Base</InputLabel>
                        <Select
                            labelId="clustering-select-label"
                            id="clustering-select"
                            value={clustering_base}
                            label="Clustering Base Data"
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
            <Grid item xs={2}>
                <Item>
                    <FormControl
                        sx={{
                            m: 1,
                            minWidth: 250,
                        }}
                        size="small"
                    >
                        <InputLabel id="clustering-method-select-label">
                            Clustering Method
                        </InputLabel>
                        <Select
                            labelId="clustering-method-select-label"
                            id="clustering-method-select"
                            value={clustering_method}
                            label="Clustering Method"
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
                        Redraw
                    </Button>
                </Item>
            </Grid>
        </Grid>
    );
}

