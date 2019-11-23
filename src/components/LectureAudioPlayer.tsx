import React from 'react'
import { makeStyles, useTheme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import { Container, Button } from '@material-ui/core';
import Slider from '@material-ui/core/Slider';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import PauseIcon from '@material-ui/icons/Pause';
import CircularProgress from '@material-ui/core/CircularProgress';
import LinearProgress from '@material-ui/core/LinearProgress';
import {Howl, Howler} from 'howler';
import Axios from 'axios';

const playURL = 'http://localhost:4000/play'
const pauseURL = 'http://localhost:4000/pause'
const sliderURL = 'http://localhost:4000/shiftSlider'
const connectURL = 'http://localhost:4000/connect'

const stateURL = 'http://localhost:4000/data/appState.json'

interface AudioPlayerProps {
    value?: number
    source: string
    onChange?: (value: number) => void
}

const useStyles = makeStyles(theme => ({
    playbackButton: {
        color: "white"
    },
}));

function initializeHowler(props: AudioPlayerProps){
    return new Howl({
        src: props.source,
        preload: true
    })
}

export function formatTime(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return [
        h,
        m > 9 ? m : (h ? '0' + m : m || '0'),
        s > 9 ? s : '0' + s,
    ].filter(a => a).join(':');
}
  
export default function LectureAudioPlayer(props: AudioPlayerProps) {
    const classes = useStyles();
    const [marks, setMarks] = React.useState([{value: 0, label: '',}])
    const [howler, setHowler] = React.useState(initializeHowler(props));
    const [duration, setDuration] = React.useState(100);
    const [playing, setPlaying] = React.useState(false);
    const [value, setValue] = React.useState(0);
    const [isSliding, setIsSliding] = React.useState(false);
    const [sliderHead, setSliderHead] = React.useState(0);

    const requestRef: any = React.useRef();
  
    React.useEffect(() => {
        // runs on component mount
        requestRef.current = requestAnimationFrame(animate);

        Axios.post(connectURL, {}).then(response => {
            console.log(response.data)
        })

        

        return () => {
            // dismount
            cancelAnimationFrame(requestRef.current);
            // unload Howler
            howler.stop();
            howler.unload();
        }
    },[])

    const seek = (time?: number) => {
        return Math.floor(howler.seek() as number);
    }

    const animate = (time: any) => {
        // The 'state' will always be the initial value here
        if(howler.state() == "loaded"){
            if(props.onChange){
                props.onChange(seek());
            }
            setValue(seek());
            setLabels(seek());
        }
        requestRef.current = requestAnimationFrame(animate);
    }

    const setLabels = (time: number) => {
        setMarks([
            {
                value: 0,
                label: formatTime(time)
            },
            {
                value: howler.duration(),
                label: formatTime(duration)
            }
        ])
    }

    const handleValue = (e: any, value: any) => {
        if(!isSliding){
            setIsSliding(true);
            cancelAnimationFrame(requestRef.current);
        } 
        
        setValue(value as number);
        if(props.onChange){
            props.onChange(value as number);
        }
        setLabels(value);
    }

    const handleValueCommit = (e: any, value: any) => {
        if(value as number){
            howler.seek(value as number);
            if(!playing){
                howler.play();
                setPlaying(true);
            }
        }
        setIsSliding(false);
        requestRef.current = requestAnimationFrame(animate);

        Axios.post(sliderURL, {
            playbackTime: value as number,
            playbackState: true,
        })
    }

    const handlePlaying = () => {
        const time = seek();
        if(playing){
            howler.pause();
            setPlaying(false);

            Axios.post(pauseURL, {
                playbackTime: time
            })
        } else {
            howler.play();
            setPlaying(true);

            // It's a get since we won't desync while paused.
            Axios.get(playURL, {})
        }
        
        setLabels(time)
    }

    const updateState = () => {
        Axios.get(stateURL, {}).then(response => {
            const data = response.data();
            setPlaying(data['playing'] as boolean);
            // If desynced by > 5 seconds, update it.
            if (seek() - (data['currentTime'] as number) > 5){
                howler.seek(data['currentTime'] as number)
            }
            if (sliderHead != data['sliderHead'] as number) {
                setSliderHead(data['sliderHead'] as number);
            }
        });
    }
    
    // Howler event when audio is loaded.
    howler.on('load', () => {
        setDuration(howler.duration() as number);
        setLabels(0);
        howler.volume(0.5);
    })

    //  Howler event when audio has finished playback.
    howler.on('end', () => {
        setPlaying(false);
        setValue(0);
    })



    return (
        <Container>
            <Button onClick={handlePlaying} disabled={howler.state() != "loaded"} >
                {
                    playing ? <PauseIcon className={classes.playbackButton} /> : <PlayArrowIcon className={classes.playbackButton} />
                }
            </Button>
            
            { howler.state() === "loading" ? <LinearProgress color="secondary" /> : <Slider 
                value={value} 
                onChange={handleValue}
                onChangeCommitted={handleValueCommit}
                style={{color: 'white'}} 
                aria-labelledby="continuous-slider"
                marks={marks}
                max={duration}
                // disable the playback slider
                disabled={howler.state() != "loaded"}
                key={props.source}
            />
                
                // <CircularProgress style={{color: "white"}} />
            }
            <Typography>{props.source}</Typography>
            <form>
                <label>
                    Room Number:
                    <input type="text" name="room-number" />
                </label>
                <input type="submit" value="Join" />
            </form>
        </Container>
    )
}