import * as d3 from 'd3';

export function MinMaxNorm(data) {
    const data_normalized = [];

    data.forEach((d) => {
        const ext = d3.extent(d);
        const scaler = d3.scaleLinear().domain(ext).range([0, 1]);
        data_normalized.push(d.map(scaler));
    });

    return data_normalized;
}

export function SqrtNorm(data) {
    const data_normalized = [];

    data.forEach((d) => {
        const d_fixed = d.map((e) => {
            return e + 0.000000001;
        });
        const ext = d3.extent(d_fixed);
        const scaler = d3.scaleSqrt().domain(ext).range([0, 1]);
        data_normalized.push(d_fixed.map(scaler));
    });

    return data_normalized;
}

export function LogNorm(data) {
    const data_normalized = [];

    data.forEach((d) => {
        const d_fixed = d.map((e) => {
            return e + 0.000000001;
        });
        const ext = d3.extent(d_fixed);
        const scaler = d3.scaleLog().domain(ext).range([0, 1]);
        data_normalized.push(d_fixed.map(scaler));
    });

    return data_normalized;
}

export function round(x) {
    return Number.parseFloat(x).toFixed(2);
}

