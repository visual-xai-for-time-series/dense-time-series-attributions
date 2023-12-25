import * as d3 from 'd3';

import React, { useState, useEffect } from 'react';

import Button from '@mui/material/Button';

import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import Paper from '@mui/material/Paper';
import Draggable from 'react-draggable';

// function PaperComponent(props) {
//     return <Paper {...props} />;
// }

export function PercentilePlot({ input_data, output_data }) {
    const [img_data, setImgData] = useState(null);
    const [open, setOpen] = useState(false);

    console.log(input_data);

    const idc = input_data.idc;
    const start = input_data.start;
    const end = input_data.end;
    const open_toggle = input_data.open;

    const key = input_data.key;
    const dataset = input_data.dataset;

    const base_url = process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL : '';

    useEffect(() => {
        if (idc.length > 0) {
            const url = base_url + '/api/getTimeSeriesForIdc/' + dataset;

            d3.json(url, {
                method: 'POST',
                body: JSON.stringify({
                    idc: idc,
                    start: start,
                    end: end,
                }),
                headers: {
                    'Content-type': 'application/json; charset=UTF-8',
                },
            }).then((data) => {
                console.log(data);
                setImgData(data.image);
                setOpen(true);
            });
        }
    }, [idc]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        console.log(open_toggle);
        setOpen(open_toggle);
    }, [open_toggle]);

    const handleClose = () => {
        input_data.open = false;
        setOpen(false);
    };

    const handleRemove = () => {
        setOpen(false);
        output_data(key);
    };

    return (
        <div className="lineplotdialog">
            <Draggable
                // handle="#draggable-dialog-title"
                handle={'[class*="MuiDialog-root"]'}
                cancel={'[class*="MuiDialogContent-root"]'}
            >
                <Dialog
                    fullWidth={true}
                    open={open}
                    // onClose={handleClose}
                    hideBackdrop
                    // PaperComponent={PaperComponent}
                    aria-labelledby="draggable-dialog-title"
                    sx={{
                        width: 'fit-content',
                        height: 'fit-content',
                    }}
                >
                    <DialogTitle style={{ cursor: 'move' }} id="draggable-dialog-title">
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <div>Percentile Plot</div>
                            <div>{key}</div>
                        </div>
                    </DialogTitle>
                    <DialogContent>
                        <img
                            src={`data:image/jpeg;base64,${img_data}`}
                            alt="secret"
                            style={{ maxWidth: '100%', maxHeight: '100%' }}
                        />
                        <Accordion>
                            <AccordionSummary
                                expandIcon={<ExpandMoreIcon />}
                                aria-controls="panel1a-content"
                                id="panel1a-header"
                            >
                                Indices
                            </AccordionSummary>
                            <AccordionDetails>
                                {idc.length}: [
                                {idc.map((item, index) => (
                                    <span key={index}>
                                        {index > 0 ? ', ' : ''}
                                        {item}
                                    </span>
                                ))}
                                ]
                            </AccordionDetails>
                        </Accordion>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleClose}>Close</Button>
                        <Button onClick={handleRemove}>Remove</Button>
                    </DialogActions>
                </Dialog>
            </Draggable>
        </div>
    );
}

