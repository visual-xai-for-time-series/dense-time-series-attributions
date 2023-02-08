import React, { useState, useEffect, useRef } from 'react';

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

import 'bootstrap/dist/css/bootstrap.min.css';

import './App.css';

import * as d3 from 'd3';

import { Stage } from '@pixi/react';

import { BaseDense } from './components/BaseDense';
import { BaseDenseWithHist } from './components/BaseDenseWithHist';

function App() {
    const [attributions, setAttributions] = useState(null);
    const [activations, setActivations] = useState(null);
    const [rawdata, setRawData] = useState(null);
    const [error, setError] = useState(null);

    const ref = useRef();

    const client_width =
        (window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth) -
        20;
    const client_height =
        (window.innerHeight ||
            document.documentElement.clientHeight ||
            document.body.clientHeight) - 20;

    useEffect(() => {
        d3.json(
            'http://127.0.0.1:8000/data/forda?start=0&end=1000&sorting_name=raw_test_hist_pearson'
        )
            .then((data) => {
                console.log(Object.keys(data));
                console.log(data);

                const length = data.length;

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
                    data: data.attributions_test,
                    hist: data.attributions_test_hist,
                    width: width_att,
                    height: client_height,
                    pos_x: pos_att,
                };
                setAttributions(attributions);

                let activations = {
                    data: data.activations_test,
                    hist: data.activations_test_hist,
                    width: width_act,
                    height: client_height,
                    pos_x: pos_act,
                };
                setActivations(activations);

                let rawdata = {
                    data: data.raw_test,
                    hist: data.raw_test_hist,
                    width: width_raw,
                    height: client_height,
                    pos_x: pos_raw,
                };
                setRawData(rawdata);
            })
            .catch((reason) => {
                setError(reason);
            });
    }, []);

    if (error) {
        return <div>Error: {error.message}</div>;
    }

    return (
        <div className="App" ref={ref}>
            <Stage
                width={client_width}
                height={client_height}
                options={{
                    backgroundColor: 0xffffff,
                    antialias: true,
                }}
            >
                <BaseDenseWithHist data={rawdata}></BaseDenseWithHist>
                <BaseDenseWithHist data={activations}></BaseDenseWithHist>
                <BaseDenseWithHist data={attributions}></BaseDenseWithHist>
            </Stage>
        </div>
    );
}

export default App;

