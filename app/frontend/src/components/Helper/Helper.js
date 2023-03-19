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

export function softmax(logits) {
    const maxLogit = logits.reduce((a, b) => Math.max(a, b), -Infinity);
    const scores = logits.map((l) => Math.exp(l - maxLogit));
    const denom = scores.reduce((a, b) => a + b);
    return scores.map((s) => s / denom);
}

export function round(x, fixed = 2) {
    return Number.parseFloat(x).toFixed(fixed);
}

export function colorToSigned24Bit(s) {
    return (parseInt(s.substr(1), 16) << 8) / 256;
}

export function colorStringToD3Color(color) {
    if (color === 'interpolateRdBu') {
        return d3.interpolateRdBu;
    }
    if (color === 'interpolateOranges') {
        return d3.interpolateOranges;
    }
    if (color === 'interpolatePuOr') {
        return d3.interpolatePuOr;
    }
    if (color === 'interpolateBlues') {
        return d3.interpolateBlues;
    }
    if (color === 'interpolateTurbo') {
        return d3.interpolateTurbo;
    }
    if (color === 'interpolateViridis') {
        return d3.interpolateViridis;
    }
    if (color === 'interpolateMagma') {
        return d3.interpolateMagma;
    }
}

export function capitalize(str) {
    const ret = [];
    const word_array = str.replaceAll('_', ' ').split(' ');
    word_array.forEach((word) => {
        ret.push(word[0].toUpperCase() + word.slice(1));
    });
    return ret.join(' ');
}

export function decapitalize(str) {
    return str.replaceAll(' ', '_').toLowerCase();
}

