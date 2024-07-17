import React, { forwardRef, useEffect, useState } from 'react';

import CircularProgress from '@mui/material/CircularProgress';

import './image.css';

const Image = forwardRef(function Image({ data, meta }, ref) {
    const [img_data, setImgData] = useState(null);

    useEffect(
        () => {
            if (data) {
                setImgData(data);
            }
        },
        [data] // eslint-disable-line react-hooks/exhaustive-deps
    );

    return (
        <div className="image" style={{ width: meta.width, height: meta.height }} ref={ref}>
            {img_data ? (
                <img src={`data:image/jpeg;base64,${img_data}`} alt="secret" />
            ) : (
                <CircularProgress />
            )}
        </div>
    );
});

export default Image;

