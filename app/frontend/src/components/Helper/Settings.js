import React, { useState } from 'react';

import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';

import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import Switch from '@mui/material/Switch';

import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';

import Link from '@mui/material/Link';
import Button from '@mui/material/Button';

import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';

import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import GitHubIcon from '@mui/icons-material/GitHub';

export function Settings(settings) {
    console.log(settings.settings);

    const default_layout = settings.settings.layout;

    const [local_settings, setSettings] = useState(settings.settings);

    const [open, setOpen] = useState(false);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleSwitch = (event) => {
        setSettings({
            ...local_settings,
            [event.target.name]: event.target.checked,
        });
    };

    const handleSelect = (event) => {
        setSettings({
            ...local_settings,
            [event.target.name]: event.target.value,
        });
    };

    return (
        <div>
            <Button variant="outlined" onClick={handleClickOpen}>
                <InfoOutlinedIcon />
            </Button>
            <Drawer anchor="right" open={open} onClose={handleClose}>
                <Box
                    sx={{ width: 750, padding: 2 }}
                    role="presentation"
                    // onClick={handleClose}
                    // onKeyDown={handleClose}
                >
                    <div>
                        Dense Pixel Visualization for Attribution Techniques on Time Series (DAVOTS)
                    </div>
                    <div>
                        Dense Pixel Visualization for Attribution Techniques on Time Series (DAVOTS)
                        as the proposed application to explore attributions, activations, and raw
                        time series inputs for deep learning models. More information at:<br></br>
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
                    </div>
                    <div>
                        <TextField
                            id="filled-select-layout"
                            select
                            label="Select Layout"
                            defaultValue={default_layout}
                            variant="filled"
                            onChange={handleSelect}
                            name="layout"
                        >
                            {local_settings.layouts.map((option) => (
                                <MenuItem key={option} value={option}>
                                    {option}
                                </MenuItem>
                            ))}
                        </TextField>
                    </div>
                    <div>
                        <FormGroup>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={local_settings.show_raw_data}
                                        onChange={handleSwitch}
                                        name="show_raw_data"
                                    />
                                }
                                label="Show Raw Time Series"
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={local_settings.show_raw_data_hist}
                                        onChange={handleSwitch}
                                        name="show_raw_data_hist"
                                    />
                                }
                                label="Show Raw Time Series Histogram"
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={local_settings.show_activations}
                                        onChange={handleSwitch}
                                        name="show_activations"
                                    />
                                }
                                label="Show Model Activations"
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={local_settings.show_activations_hist}
                                        onChange={handleSwitch}
                                        name="show_activations_hist"
                                    />
                                }
                                label="Show Model Activations Histogram"
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={local_settings.show_attributions}
                                        onChange={handleSwitch}
                                        name="show_attributions"
                                    />
                                }
                                label="Show Model Attributions"
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={local_settings.show_attributions_hist}
                                        onChange={handleSwitch}
                                        name="show_attributions_hist"
                                    />
                                }
                                label="Show Model Attributions Histogram"
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={local_settings.show_labels_pred}
                                        onChange={handleSwitch}
                                        name="show_labels_pred"
                                    />
                                }
                                label="Show Model Predictions Labels"
                            />
                        </FormGroup>
                    </div>
                </Box>
            </Drawer>
            {/* <Dialog
                maxWidth="md"
                open={open}
                onClose={handleClose}
                aria-labelledby="info-dialog-title"
                aria-describedby="info-dialog-description"
            >
                <DialogTitle id="info-dialog-title">
                    {'Dense Pixel Visualization for Attribution Techniques on Time Series (DAVOTS)'}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="info-dialog-description">
                        Dense Pixel Visualization for Attribution Techniques on Time Series (DAVOTS)
                        as the proposed application to explore attributions, activations, and raw
                        time series inputs for deep learning models. More information at:<br></br>
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
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Close</Button>
                </DialogActions>
            </Dialog> */}
        </div>
    );
}

