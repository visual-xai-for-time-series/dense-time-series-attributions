import * as React from 'react';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Item from '@mui/material/ListItem';
import Modal from '@mui/material/Modal';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import GitHubIcon from '@mui/icons-material/GitHub';
import CardMedia from '@mui/material/CardMedia';
import { CardActionArea } from '@mui/material';

export default function WelcomeModal({ isOpen, setShowWelcomeModal, inputSettings, setDataset }) {

    const scenarioCard = (scenario) => {
        return (
            <Card sx={{ width: '45%', height: '100%' }}>
                <CardActionArea
                    onClick={() => {
                        setDataset(scenario.dataset);
                        setShowWelcomeModal(false);
                    }}
                >
                    <CardMedia
                        component="img"
                        height="140"
                        image={scenario.image}
                        alt={scenario.title}
                    />
                    <CardContent>
                        <Typography gutterBottom variant="h5" component="div">
                            {scenario.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {scenario.description}
                        </Typography>
                    </CardContent>
                </CardActionArea>
            </Card>
        );
    }

    const style = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: "40vw",
        bgcolor: 'background.paper',
        border: '2px solid #000',
        boxShadow: 24,
        p: 4,
      };


    return (
        <Modal
            open={isOpen}
            onClose={() => setShowWelcomeModal(false)}
            aria-labelledby="simple-modal-title"
            aria-describedby="simple-modal-description"
        >
                <Box sx={style}>
                <Typography variant="h6" color="inherit">
                        Dense Pixel Visualization for Attribution Techniques on Time Series (DAVOTS)
                    </Typography>
                    <Box sx={{ padding: 3 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                {/* Teaser image */}
                                <img
                                    src="/images/davots_teaser_image.png"
                                    alt="DAVOTS Teaser"
                                    style={{
                                        width: '100%',
                                        height: 'auto',
                                    }}
                                />
                            </Grid>
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
                                           
                                            <span
                                                style={{
                                                    margin: '5px',
                                                }}
                                            >
                                                 <GitHubIcon sx={{marginRight: 1}} />
                                                https://github.com/visual-xai-for-time-series/dense-time-series-attributions
                                            </span>
                                        </div>
                                    </Link>
                                </Item>
                            </Grid>
                            <Grid item xs={1}></Grid>
                        </Grid>
                    </Box>
                    <Typography variant="h6" color="inherit" sx={{ marginBottom: 2 }}>
                        Select a scenario to start
                    </Typography>
                    <Stack spacing={2} direction="row" justifyContent="space-evenly" alignItems="center">
                        {inputSettings?.map((scenario) => {
                            return scenarioCard(scenario);
                        })}
                    </Stack>
                    <Button
                        variant="contained"
                        color="primary"
                        sx={{ marginTop: 2, float: 'right' }}
                        onClick={() => {
                            setShowWelcomeModal(false);
                        }}
                    >
                        Close
                    </Button>
                </Box>
        </Modal>
    )
}