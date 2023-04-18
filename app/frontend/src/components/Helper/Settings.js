import React, { useState, useEffect } from 'react';

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
                                                checked={local_settings.show_raw_data_hist}
                                                onChange={handleCheck}
                                                name="show_raw_data_hist"
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
                                                checked={local_settings.show_activations_hist}
                                                onChange={handleCheck}
                                                name="show_activations_hist"
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
                                                checked={local_settings.show_attributions_hist}
                                                onChange={handleCheck}
                                                name="show_attributions_hist"
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

