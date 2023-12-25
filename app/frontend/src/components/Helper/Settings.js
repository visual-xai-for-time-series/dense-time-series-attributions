import React, { useState, useEffect } from 'react';

import * as d3 from 'd3';

import Drawer from '@mui/material/Drawer';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Item from '@mui/material/Grid';

import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';

import Checkbox from '@mui/material/Checkbox';

import RadioGroup from '@mui/material/RadioGroup';
import Radio from '@mui/material/Radio';

import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Button from '@mui/material/Button';

import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import GitHubIcon from '@mui/icons-material/GitHub';

import { Selector } from './Selector/Selector';

export function Settings({ input_settings, output_settings }) {
    const default_layout = input_settings.layout;

    const [local_settings, setSettings] = useState(input_settings);
    const [open, setOpen] = useState(false);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleCheck = (event) => {
        setSettings({
            ...local_settings,
            [event.target.name]: event.target.checked,
        });
    };

    const handleRadio = (event) => {
        setSettings({
            ...local_settings,
            [event.target.name]: event.target.value,
        });
    };

    const handleSelect = (event) => {
        console.log(event);
        setSettings({
            ...local_settings,
            [event.target.name]: event.target.value,
        });
    };

    const base_url = process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL : '';

    useEffect(() => {
        d3.json(base_url + '/api/getAvailableColors', {
            method: 'GET',
        }).then((data) => {
            console.log(data);
            // local_settings.available_colormaps
            // setSettings({
            //     ...local_settings,
            //     available_colormaps: data,
            // });

            d3.json(base_url + '/api/getAvailableDatasets', {
                method: 'GET',
            }).then((datasets) => {
                console.log(datasets);
                setSettings({
                    ...local_settings,
                    available_colormaps: data,
                    available_datasets: datasets,
                });
            });
        });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        d3.json(base_url + '/api/getAvailableDatasets', {
            method: 'GET',
        }).then((data) => {
            console.log(data);
            setSettings({
                ...local_settings,
                available_datasets: data,
            });
        });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        output_settings(local_settings);
    }, [local_settings]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div>
            <Button variant="outlined" onClick={handleClickOpen}>
                <InfoOutlinedIcon />
            </Button>
            <Drawer anchor="right" open={open} onClose={handleClose}>
                <Box sx={{ width: 750, padding: 3 }} role="presentation">
                    <Typography variant="h6" color="inherit" noWrap>
                        Dense Pixel Visualization for Attribution Techniques on Time Series (DAVOTS)
                    </Typography>
                    <Box sx={{ padding: 3 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Item>
                                    {' '}
                                    Dense Pixel Visualization for Attribution Techniques on Time
                                    Series (DAVOTS) as the proposed application to explore
                                    attributions, activations, and raw time series inputs for deep
                                    learning models. More information at:
                                </Item>
                            </Grid>
                            <Grid item xs={1}></Grid>
                            <Grid item xs={10}>
                                <Item>
                                    <Link href="https://github.com/visual-xai-for-time-series/dense-time-series-attributions">
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                flexWrap: 'wrap',
                                            }}
                                        >
                                            <GitHubIcon />
                                            <span
                                                style={{
                                                    margin: '5px',
                                                }}
                                            >
                                                https://github.com/visual-xai-for-time-series/dense-time-series-attributions
                                            </span>
                                        </div>
                                    </Link>
                                </Item>
                            </Grid>
                            <Grid item xs={1}></Grid>
                        </Grid>
                    </Box>
                    <Typography variant="h6" color="inherit" noWrap>
                        Settings
                    </Typography>
                    <Box sx={{ padding: 3 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Item>
                                    Change settings regarding the orientation of the layout and the
                                    displayed data.
                                </Item>
                            </Grid>
                            <Grid item xs={1}></Grid>
                            <Grid item xs={10}>
                                <Item>
                                    <RadioGroup
                                        aria-labelledby="demo-controlled-radio-buttons-group"
                                        name="controlled-radio-buttons-group"
                                        defaultValue={default_layout}
                                        onChange={handleRadio}
                                        row
                                    >
                                        {input_settings.layouts.map((option) => (
                                            <FormControlLabel
                                                value={option}
                                                key={option}
                                                name="layout"
                                                control={<Radio />}
                                                label={option}
                                            />
                                        ))}
                                    </RadioGroup>
                                </Item>
                            </Grid>
                            <Grid item xs={1}></Grid>

                            <Grid item xs={1}></Grid>
                            <Grid item xs={10}>
                                <FormGroup row>
                                    <Selector
                                        input={{
                                            id: 'dataset-selector',
                                            name: 'Dataset',
                                            available_options: local_settings.available_datasets,
                                            value: local_settings.dataset,
                                        }}
                                        output={handleSelect}
                                    ></Selector>
                                </FormGroup>
                            </Grid>
                            <Grid item xs={1}></Grid>

                            <Grid item xs={1}></Grid>
                            <Grid item xs={10}>
                                <FormGroup row>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={local_settings.show_raw_data}
                                                onChange={handleCheck}
                                                name="show_raw_data"
                                            />
                                        }
                                        label="Raw Time Series"
                                    />
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={local_settings.show_raw_data_histogram}
                                                onChange={handleCheck}
                                                name="show_raw_data_histogram"
                                            />
                                        }
                                        label="Raw Time Series Histogram"
                                    />
                                </FormGroup>
                            </Grid>
                            <Grid item xs={1}></Grid>

                            <Grid item xs={1}></Grid>
                            <Grid item xs={10}>
                                <FormGroup row>
                                    <Selector
                                        input={{
                                            id: 'raw-time-series',
                                            name: 'Raw Time Series Colormap',
                                            available_options: local_settings.available_colormaps,
                                            value: local_settings.raw_time_series_colormap,
                                        }}
                                        output={handleSelect}
                                    ></Selector>

                                    <Selector
                                        input={{
                                            id: 'raw-time-series-histogram',
                                            name: 'Raw Time Series Histogram Colormap',
                                            available_options: local_settings.available_colormaps,
                                            value: local_settings.raw_time_series_histogram_colormap,
                                        }}
                                        output={handleSelect}
                                    ></Selector>
                                </FormGroup>
                            </Grid>
                            <Grid item xs={1}></Grid>

                            <Grid item xs={1}></Grid>
                            <Grid item xs={10}>
                                <FormGroup row>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={local_settings.show_activations}
                                                onChange={handleCheck}
                                                name="show_activations"
                                            />
                                        }
                                        label="Model Activations"
                                    />
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={local_settings.show_activations_histogram}
                                                onChange={handleCheck}
                                                name="show_activations_histogram"
                                            />
                                        }
                                        label="Model Activations Histogram"
                                    />
                                </FormGroup>
                            </Grid>
                            <Grid item xs={1}></Grid>

                            <Grid item xs={1}></Grid>
                            <Grid item xs={10}>
                                <FormGroup row>
                                    <Selector
                                        input={{
                                            id: 'activations-series',
                                            name: 'Activations Colormap',
                                            available_options: local_settings.available_colormaps,
                                            value: local_settings.activations_colormap,
                                        }}
                                        output={handleSelect}
                                    ></Selector>

                                    <Selector
                                        input={{
                                            id: 'activations-histogram',
                                            name: 'Activations Histogram Colormap',
                                            available_options: local_settings.available_colormaps,
                                            value: local_settings.activations_histogram_colormap,
                                        }}
                                        output={handleSelect}
                                    ></Selector>
                                </FormGroup>
                            </Grid>
                            <Grid item xs={1}></Grid>

                            <Grid item xs={1}></Grid>
                            <Grid item xs={10}>
                                <FormGroup row>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={local_settings.show_attributions}
                                                onChange={handleCheck}
                                                name="show_attributions"
                                            />
                                        }
                                        label="Model Attributions"
                                    />
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={local_settings.show_attributions_histogram}
                                                onChange={handleCheck}
                                                name="show_attributions_histogram"
                                            />
                                        }
                                        label="Model Attributions Histogram"
                                    />
                                </FormGroup>
                            </Grid>
                            <Grid item xs={1}></Grid>

                            <Grid item xs={1}></Grid>
                            <Grid item xs={10}>
                                <FormGroup row>
                                    <Selector
                                        input={{
                                            id: 'attributions-series',
                                            name: 'Attributions Colormap',
                                            available_options: local_settings.available_colormaps,
                                            value: local_settings.attributions_colormap,
                                        }}
                                        output={handleSelect}
                                    ></Selector>

                                    <Selector
                                        input={{
                                            id: 'attributions-histogram',
                                            name: 'Attributions Histogram Colormap',
                                            available_options: local_settings.available_colormaps,
                                            value: local_settings.attributions_histogram_colormap,
                                        }}
                                        output={handleSelect}
                                    ></Selector>
                                </FormGroup>
                            </Grid>
                            <Grid item xs={1}></Grid>

                            <Grid item xs={1}></Grid>
                            <Grid item xs={10}>
                                <FormGroup row>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={local_settings.show_labels_pred}
                                                onChange={handleCheck}
                                                name="show_labels_pred"
                                            />
                                        }
                                        label="Model Predictions Labels"
                                    />
                                </FormGroup>
                            </Grid>
                            <Grid item xs={1}></Grid>
                        </Grid>
                    </Box>
                </Box>
            </Drawer>
        </div>
    );
}

