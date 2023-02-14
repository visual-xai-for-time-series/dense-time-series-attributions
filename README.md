# Dense Pixel Visualization for Attribution Techniques on Time Series (DAVOTS)

The application visualizes the raw time series data, the activations of the last fully connected layer, and the attributions in a dense pixel visualization using PIXI.js.

### Data and Model to explore:

Dataset: Ford A (Training: 3601 / Test: 1320)  
Model: 3 Conv1D (5, 10, 50, kernel=3, stride=2), 2 FC (100, 2)  
Attribution: IntegratedGradients  
Activations: 100 FC

## Start the application

You can start the application using:  
`docker-compose up`  
and go to `localhost` to use and explore the application.

## Extend with other data

You can rerun the preprocessing script with other data or models.

## Development

For further development, you can make use of the yarn (react-scripts) server with:  
`docker-compose -f docker-compose-dev.yaml up`  
and go to `localhost:3000`.

## Libraries

Frontend:

-   React (https://reactjs.org/)
-   React MUI (https://mui.com/)
-   PixiJS (https://pixijs.download/dev/docs/index.html)

Backend:

-   Python v3.10
-   FastAPI (https://fastapi.tiangolo.com/)
-   Pytorch (https://pytorch.org/)
-   Captum (https://captum.ai/)
-   Numpy (https://numpy.org/)
-   Scipy (https://scipy.org/)
-   Pandas (https://pandas.pydata.org/)

