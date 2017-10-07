import React, { Component } from 'react';
import glamorous from 'glamorous';
import { Button } from 'semantic-ui-react';
import Slider from './components/Slider/Slider'
import logo from './../logo.svg';
import './styles/App.css';
import './styles/details.css';
import songData from './SongMetrics.json';


const SliderRow = glamorous.div({
  maxWidth: 820,
  margin: "0 auto",
  paddingBottom: 35,
  lineHeight: 1.25,
  '@media only screen and (max-width: 768px)': {
    paddingBottom: 10,
  }
});

class App extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      energyValue: 25,
      valenceValue: 50,
      depthValue: 75,
      songTitle: songData[0].Title
    }
  }

  handleEnergyChange = value => {
    this.setState({
      energyValue: value
    })
  };
  handleValenceChange = value => {
    this.setState({
      valenceValue: value
    })
  };
  handleDepthChange = value => {
    this.setState({
      depthValue: value
    })
  };

  handleClick = () => {
    console.log('calculating...');

    

    console.log('finished');
  };

  render() {
    const { energyValue, valenceValue, depthValue } = this.state
    return (
      <div className="App">
        <div className="App-header">
          <h2>MUSIC VAULT</h2>
          <h4>Adjust the sliders and press calculate to receive an algorithmically generated recommendation.</h4>
        </div>
        <SliderRow>
          <div className='slider-grid'>
            <div className='slider-label'>ENERGY</div>
            <Slider
              min={0}
              max={100}
              value={energyValue}
              onChange={this.handleEnergyChange}
            />
            <div className='value'>{energyValue}</div>
          </div>
        </SliderRow>
        <SliderRow>
          <div className='slider-grid'>
            <div className='slider-label'>VALENCE</div>
            <Slider
              min={0}
              max={100}
              value={valenceValue}
              onChange={this.handleValenceChange}
            />
            <div className='value'>{valenceValue}</div>
          </div>
        </SliderRow>
        <SliderRow>
          <div className='slider-grid'>
            <div className='slider-label'>DEPTH</div>
            <Slider
              min={0}
              max={100}
              value={depthValue}
              onChange={this.handleDepthChange}
            />
            <div className='value'>{depthValue}</div>
          </div>
        </SliderRow>
        <div className="calculateButton-section">
          <Button
            className='calculateButton'
            content='Calculate'
            onClick={this.handleClick}
          />
        </div>
        <div className="song-info">
          {this.state.songTitle}
        </div>
        <div className="App-footer">
          <img src={logo} className="App-logo" alt="logo" />
        </div>
      </div>
    );
  }
}

export default App;
