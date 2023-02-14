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
    const cur_ordering_data = input_data.cur_ordering_data ? input_data.cur_ordering_data : '';
    const cur_ordering_method = input_data.cur_ordering_method
        ? input_data.cur_ordering_method
        : '';
    const summary_data = input_data.summary_data;

    const orderings = input_data.orderings ? Object.keys(input_data.orderings) : [];
    const orderings_methods = input_data.orderings ? input_data.orderings : {};

    const max_samples = input_data.max_samples ? input_data.max_samples : 100;

    const [samples_idc, setSamplesIdc] = useState([0, 100]);

    const [ordering, setOrdering] = useState(cur_ordering_data);
    const [ordering_method, setOrderingMethod] = useState(cur_ordering_method);

    const [cur_ordering_methods, setCurOrderingMethods] = useState([]);

    const handleSliderChange = (newValue) => {
        setSamplesIdc(newValue);
    };

    const handleOrdering = (event) => {
        setOrdering(event.target.value);
        setCurOrderingMethods(orderings_methods[event.target.value]);
        setOrderingMethod(orderings_methods[event.target.value][0]);
    };

    const handleMethod = (event) => {
        setOrderingMethod(event.target.value);
    };

    const handleButton = (_) => {
        const new_parameters = {
            sample_idc: samples_idc,
            ordering_data: ordering,
            ordering_method: ordering_method,
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
            sx={{ mr: 4, ml: 4 }}
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
            <Grid item xs={3}>
                <Item>
                    <FormControl
                        sx={{
                            m: 1,
                            minWidth: 400,
                        }}
                        size="small"
                    >
                        <InputLabel id="ordering-select-label">Ordering</InputLabel>
                        <Select
                            labelId="ordering-select-label"
                            id="ordering-select"
                            value={ordering}
                            label="Ordering Data"
                            onChange={handleOrdering}
                        >
                            {orderings.length > 0
                                ? orderings.map((name) => (
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
                            minWidth: 400,
                        }}
                        size="small"
                    >
                        <InputLabel id="ordering-method-select-label">Method</InputLabel>
                        <Select
                            labelId="ordering-method-select-label"
                            id="ordering-method-select"
                            value={ordering_method}
                            label="Ordering Method"
                            onChange={handleMethod}
                        >
                            {cur_ordering_methods.length > 0
                                ? cur_ordering_methods.map((name) => (
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
                    <Button onClick={handleButton} variant="contained">
                        Redraw
                    </Button>
                </Item>
            </Grid>
        </Grid>
    );
}

