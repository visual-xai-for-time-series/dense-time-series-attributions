import React, { useState, useEffect, useRef } from 'react';

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

import 'bootstrap/dist/css/bootstrap.min.css';

import './App.css';

import * as d3 from 'd3';

import { RawData } from './components/RawData';
import { BaseDenseWithHist } from './components/BaseDenseWithHist';

function App() {
    const [attributions, setAttributions] = useState(null);
    const [activations, setActivations] = useState(null);
    const [rawdata, setRawData] = useState(null);
    const [error, setError] = useState(null);

    const ref = useRef();

    useEffect(() => {
        d3.json(
            'http://127.0.0.1:8000/data/forda?start=0&end=500&sorting_name=activations_test_hist_euclidean'
        )
            .then((data) => {
                console.log(Object.keys(data));
                console.log(data);

                let attributions = {
                    data: data.attributions_test,
                    hist: data.attributions_test_hist,
                };
                setAttributions(attributions);

                let activations = {
                    data: data.activations_test,
                    hist: data.activations_test_hist,
                };
                setActivations(activations);

                let rawdata = data.raw_test;
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
            <Container fluid className="noPadding noMargin">
                <Row className="noPadding noMargin">
                    <Col className="noPadding noMargin">
                        <RawData rawdata={rawdata} />
                    </Col>
                    <Col className="noPadding noMargin">
                        <BaseDenseWithHist data={activations} />
                    </Col>
                    <Col className="noPadding noMargin">
                        <BaseDenseWithHist data={attributions} />
                    </Col>
                </Row>
            </Container>
        </div>
    );
}

export default App;

