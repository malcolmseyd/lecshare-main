import React from 'react'
import { makeStyles, useTheme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import LectureText from './LectureText'
import LectureSlides from './LectureSlides'
import Footer from './Footer'
import axios from 'axios'
import CircularProgress from '@material-ui/core/CircularProgress';
import { string } from 'prop-types';

interface LectureProps {
    courseName: string,
    currentValue: number
}

interface LectureState {
    courseName: string,
    textLoad: boolean,
    wordArray: Array<WordStorageType>
}

type WordStorageType = {
    word: string,
    startTimeSeconds: string,
    endTimeSeconds: string,
    endTimeNano: number,
    startTimeNano: number
}

class LectureContent extends React.Component<LectureProps, LectureState> {

    //for now this is a local file but eventually we will call to api to get this file. (then store in cache to quickly grab if revisiting the same component)
    //alternatively we have this call in the backend to create the html which is then sent back (but for demo we do not have)
    componentDidMount() {
       axios.get('vikelabs_test1.json').then(response => {
           let bodyArray: WordStorageType[] = []

           for(var key in response.data) {
               let section = response.data[key].alternatives[0]
               for(var key in section.words) {
                   let wordStorage: WordStorageType = {
                       word: section.words[key].word,
                       startTimeSeconds: section.words[key].startTime.seconds,
                       endTimeSeconds: section.words[key].endTime.seconds,
                       endTimeNano: section.words[key].endTime.nanos,
                       startTimeNano: section.words[key].endTime.nanos
                   }       
                   bodyArray.push(wordStorage)
               }
                
           }
           this.setState({wordArray: bodyArray})
           this.setState({textLoad: true})
       })
    }

    constructor(props: LectureProps) {
        super(props)
        this.state = {
            courseName: this.props.courseName,
            textLoad: false,
            wordArray: []
        }
    }

    render() {

        let lectureBody: any;

        if (this.state.textLoad) {
            lectureBody = <LectureText words={this.state.wordArray} currentValue={this.props.currentValue}/>
        } else {
            lectureBody = <CircularProgress />
        }
        return(
            <div>
                <LectureSlides/>
                {lectureBody}
                <Footer/>
            </div>     
        )
    }
    
}

export default LectureContent;