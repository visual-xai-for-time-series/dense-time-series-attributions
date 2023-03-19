import React, { useState } from 'react';

import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';

import Link from '@mui/material/Link';
import Button from '@mui/material/Button';

import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import GitHubIcon from '@mui/icons-material/GitHub';

export function Information() {
    const [open, setOpen] = useState(false);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    return (
        <div>
            <Button variant="outlined" onClick={handleClickOpen}>
                <InfoOutlinedIcon />
            </Button>
            <Dialog
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
            </Dialog>
        </div>
    );
}

