import React, { Component } from 'react';
import Spotify from 'spotify-web-api-js';
import Spinner from 'react-spinkit';
import AlertContainer from 'react-alert';

// component imports
import Avatar from './components/Avatar/avatar';
import BigButton from './components/Button';
import SliderSelector from './components/Slider/SliderSelector';
import Player from './components/Player/Player';
import SongStatistics from './components/SongStats/SongStatistics';
import RadarSection from './components/Radar/RadarSection';
import HowItWorks from './components/Instructions/HowItWorks';

// css imports
import './styles/buttons.css';
import './styles/compiled-player.css';
import './styles/details.css';
import './styles/main.css';
import './styles/slider.css';

// data imports
import songApiData from './songData.json';
import songDetailData from './songDetails.json';

// helper function imports
import { getHashParams, setLoginEventListener, spotifyImplicitAuth } from './javascripts/helpers';


const calcInitialQueue = () => {
  let queue = [];
  let data = songApiData.items;
  for (let i = 0; i < data.length; i++){
    queue.push(data[i].track);
  }
  return queue;
}

class App extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      energyValue: 50,
      valenceValue: 50,
      acousticValue: 50,
      danceValue: 50,
      popularityValue: 50,
      filterBy: {
        energy: true,
        valence: true,
        acoustic: true,
        dance: true,
        popularity: true,
      },
      songRecommendation: songApiData.items[0].track,
      params: {},
      loading: false,
      songInLibrary: false,
      queue: calcInitialQueue(),
      queuePosition: 0,
      createdPlaylist: false
    }
    this.nextSong = this.nextSong.bind(this);
    this.prevSong = this.prevSong.bind(this);
    this.addSong = this.addSong.bind(this);
  }

  componentDidMount() {
    this.setState({ 
      params: getHashParams()},
      () => {
        console.log("component did mount");
        console.log(this.state)
        if (this.state.params.access_token) {
          const spotifyApi = new Spotify()
          spotifyApi.setAccessToken(this.state.params.access_token);
          spotifyApi.containsMySavedTracks([this.state.songRecommendation.id])
          .then( (response) => {
            console.log(response);
            this.setState({
              songInLibrary: response[0]
            })
          });
          spotifyApi.getMe().then( (response) => {
            console.log('me response: ');
            console.log(response);
            this.setState({
              me: response
            })
          });
        }
      }
    );
    setLoginEventListener();
    setTimeout(() => {this.showSessionTimeout(); this.setState({ params: {} }); }, 1000 * 60 * 60);
  }

  // adjust slider values
  handleEnergyChange = value => { console.log(value); this.setState({ energyValue: value }) };
  handleValenceChange = value => { this.setState({ valenceValue: value }) };
  handleAcousticChange = value => { this.setState({ acousticValue: value }) };
  handleDanceChange = value => { this.setState({ danceValue: value }) };
  handlePopularityChange = value => { this.setState({ popularityValue: value }) };

  // handle radio buttons to select what to filter by
  toggleEnergyFilter = () => { this.setState({ filterBy: { ...this.state.filterBy, energy: !this.state.filterBy.energy } }) };
  toggleValenceFilter = () => { this.setState({ filterBy: { ...this.state.filterBy, valence: !this.state.filterBy.valence } }) };
  toggleAcousticFilter = () => { this.setState({ filterBy: { ...this.state.filterBy, acoustic: !this.state.filterBy.acoustic } }) };
  toggleDanceFilter = () => { this.setState({ filterBy: { ...this.state.filterBy, dance: !this.state.filterBy.dance } }) };
  togglePopularityFilter = () => { this.setState({ filterBy: { ...this.state.filterBy, popularity: !this.state.filterBy.popularity } }) };

  // main calculation button 
  handleClick = () => {
    console.log('starting...');
    this.setState({loading: true});
    this.child.stopPlayback();

    let data = songApiData.items;
    let dataDetails = songDetailData;
    let calculatedData = [];
    let trackIds = [];
    const s = new Spotify();
		s.setAccessToken(this.state.params.access_token);

    // enter entire dataset loop for each song
    for (let i = 0; i < data.length; i++){
      let songObj = data[i].track;
      let songDetails = dataDetails[i];

      let trackId = songObj.id;
      trackIds.push(trackId);

      let trackDetails = songDetails;

      let trackEnergy = Math.round(trackDetails.energy*100) || 0;
      let trackValence = Math.round(trackDetails.valence*100) || 0;
      let trackAcousticness = Math.round(trackDetails.acousticness*100) || 0;
      let trackDance = Math.round(trackDetails.danceability*100) || 0;
      let trackPopularity = Math.abs(Math.round(songObj.popularity));

      let differenceEnergy = 0, differenceValence = 0, differenceAcousticness = 0, differenceDance = 0, differencePopularity = 0;
      if (this.state.filterBy.energy) { differenceEnergy = Math.abs(trackEnergy - this.state.energyValue); }
      if (this.state.filterBy.valence) { differenceValence = Math.abs(trackValence - this.state.valenceValue); }
      if (this.state.filterBy.acoustic) { differenceAcousticness = Math.abs(trackAcousticness - this.state.acousticValue); }
      if (this.state.filterBy.dance) { differenceDance = Math.abs(trackDance - this.state.danceValue); }
      if (this.state.filterBy.popularity) { differencePopularity = Math.abs(trackPopularity - this.state.popularityValue); }
      let totalDifference = differenceEnergy + differenceValence + differenceAcousticness + differenceDance + differencePopularity;
      songObj['ResultDifference'] = totalDifference;
      calculatedData.push(songObj);

    }

    console.log(trackIds);
    // s.getAudioFeaturesForTracks(trackIds, (error, response) => {
		// 	console.log(response); 
		// });

    // sort by the absolute value of the subtracted entered user amount for each value and resort by that value
    console.log(calculatedData);
    calculatedData.sort(function(a, b){return a.ResultDifference - b.ResultDifference})
    console.log(calculatedData);

    if (this.state.params.access_token){
      s.containsMySavedTracks([calculatedData[0].id])
      .then((response) => {
        console.log('in songs');
        console.log(response);
        this.setState({ songInLibrary: response[0] })
      });
    }
    
    // final assignment of top calculated track, remove loading, and load the queue
    this.setState({ 
      songRecommendation: calculatedData[0], 
      loading: false,
      queue: calculatedData,
      queuePosition: 0,
      createdPlaylist: false
    })
    let audio = document.getElementById('audio');
		audio.load();
    console.log('audio loaded');
  };

  // control button functions (add, play/pause, next)
  addSong = () => {
		console.log('add song to library');
		const s = new Spotify();
		s.setAccessToken(this.state.params.access_token);
    if (this.state.params.access_token !== undefined) {
      s.addToMySavedTracks([this.state.songRecommendation.id], {})
      .then(() => {
        this.setState({songInLibrary: true});
      });
      this.showAdded(this.state.songInLibrary);
    } else {
      this.showAlert();
    }
  };
  prevSong = () => {
    console.log('prev song');
    let state = this.state;
    let newQueuePosition = state.queuePosition - 1;
    if (newQueuePosition < 0 ) {newQueuePosition = 0;};
    const spotifyApi = new Spotify()
    spotifyApi.setAccessToken(state.params.access_token);

    // check if user has access token before making request
    if (this.state.params.access_token !== undefined) {
      spotifyApi.containsMySavedTracks([state.queue[newQueuePosition].id])
      .then( (response) => {
        console.log('in library');
        console.log(response);
        this.setState({
          queuePosition: newQueuePosition,
          songRecommendation: state.queue[newQueuePosition],
          songInLibrary: response[0]
        })
        let audio = document.getElementById('audio');
        audio.load();
        this.child.stopPlayback();
      });
    } else {
      this.setState({
        queuePosition: newQueuePosition,
        songRecommendation: state.queue[newQueuePosition]
      })
      let audio = document.getElementById('audio');
      audio.load();
      this.child.stopPlayback();
    }
  };
  nextSong = () => {
    console.log('next song');
    let state = this.state;
    let newQueuePosition = state.queuePosition + 1;
    const spotifyApi = new Spotify()
    spotifyApi.setAccessToken(state.params.access_token);

    // check if user has access token before making request
    if (this.state.params.access_token !== undefined) {
      spotifyApi.containsMySavedTracks([state.queue[newQueuePosition].id])
      .then( (response) => {
        console.log('in library');
        console.log(response);
        this.setState({
          queuePosition: newQueuePosition,
          songRecommendation: state.queue[newQueuePosition],
          songInLibrary: response[0]
        })
        let audio = document.getElementById('audio');
        audio.load();
        this.child.stopPlayback();
      });
    } else {
      this.setState({
        queuePosition: newQueuePosition,
        songRecommendation: state.queue[newQueuePosition]
      })
      let audio = document.getElementById('audio');
      audio.load();
      this.child.stopPlayback();
    }
  };
  addPlaylist = () => {
    console.log('add playlist for user');
		const s = new Spotify();
		s.setAccessToken(this.state.params.access_token);
    if (this.state.params.access_token !== undefined) {
      if (!this.state.createdPlaylist) 
      {
        // create blank playlist
        s.createPlaylist(this.state.me.id, {
          name: 'Music+ Recommendations',
          description: 'Playlist recommendations from online.'
        })
        .then((response) => {
          this.setState({createdPlaylist: true});
          console.log(response);
          
          s.addTracksToPlaylist()
        });
      }

      // show msg whether playlist was created or already generated
      this.showCreatedPlaylist(this.state.createdPlaylist);
    } else {
      this.showAlert();
    }
  };
  
  
  // react alert messages and options
  alertOptions = {
    offset: 14,
    position: 'bottom right',
    theme: 'dark',
    time: 5000,
    transition: 'fade'
  }
  showAlert = () => {
    this.msg.show('Login with Spotify to add songs or playlists to your library', {
      time: 4000,
      type: 'success',
      icon: <img style={{height: 32, width: 32}} src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Exclamation_mark_white_icon.svg/1200px-Exclamation_mark_white_icon.svg.png" />
    })
  }
  showAdded = songInLibrary => {
    if (songInLibrary) {
      this.msg.show('Song has already been added to your library', {
        time: 4000,
        type: 'warning',
      })
    } else {
      this.msg.show('Song added to your library', {
        time: 4000,
        type: 'success',
      })
    }
  }
  showCreatedPlaylist = createdPlaylist => {
    if (createdPlaylist) {
      this.msg.show('Playlist has already been generated with this data', {
        time: 4000,
        type: 'warning',
      })
    } else {
      this.msg.show('Playlist generated from these recommendations', {
        time: 4000,
        type: 'success',
      })
    }
  }
  showSessionTimeout = () => {
    this.msg.show('Your session has expired, login again to access user-specific functions', {
      time: 0,
      type: 'success',
      icon: <img style={{height: 32, width: 32}} src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Exclamation_mark_white_icon.svg/1200px-Exclamation_mark_white_icon.svg.png" />
    })
  }

  render() {
    const { energyValue, valenceValue, acousticValue, danceValue, popularityValue, songRecommendation } = this.state
    return (
      <div className='App'>
        <div className='app-header'>
            <div className='app-header-title'>MUSIC+</div>
            <div className='login-section'>
              {this.state.params.access_token ? 
              <Avatar
                me={this.state.me}
              />
               :
               <BigButton
                type='button'
                id='login-button'
                className='loginButton'
                value='Login'
                onClick={() => spotifyImplicitAuth()}
              />
              } 
            </div>
        </div>
        <div className='playlist-selector'>Standard Selection</div>
        <SliderSelector
          label="ENERGY"
          value={energyValue}
          onChange={this.handleEnergyChange}
          toggleFilter={this.toggleEnergyFilter}
          filterOn={this.state.filterBy.energy}
        />
        <SliderSelector
          label="VALENCE"
          value={valenceValue}
          onChange={this.handleValenceChange}
          toggleFilter={this.toggleValenceFilter}
          filterOn={this.state.filterBy.valence}
        />
        <SliderSelector
          label="ACOUSTIC"
          value={acousticValue}
          onChange={this.handleAcousticChange}
          toggleFilter={this.toggleAcousticFilter}
          filterOn={this.state.filterBy.acoustic}
        />
        <SliderSelector
          label="DANCE"
          value={danceValue}
          onChange={this.handleDanceChange}
          toggleFilter={this.toggleDanceFilter}
          filterOn={this.state.filterBy.dance}
        />
        <SliderSelector
          label="POPULARITY"
          value={popularityValue}
          onChange={this.handlePopularityChange}
          toggleFilter={this.togglePopularityFilter}
          filterOn={this.state.filterBy.popularity}
        />
        <div className='calculateButton-section'>
          <BigButton
            type='button'
            className='calculateButton'
            value='Calculate'
            onClick={this.handleClick}
            disabled={this.state.loading}
          />
        </div>
        <div className='song-info'>
          {this.state.loading ? 
            <Spinner name='line-scale-pulse-out-rapid' color='#34BAFD' fadeIn='quarter' /> 
            : 
            <div>
              <div className='player-section'>
                <RadarSection 
                  energyValue={this.state.energyValue}
                  valenceValue={this.state.valenceValue}
                  acousticValue={this.state.acousticValue}
                  danceValue={this.state.danceValue}
                  popularityValue={this.state.popularityValue}
                  track={songRecommendation}
                  trackDetails={songDetailData.filter(object => object.id === songRecommendation.id)[0]}
                />
                <Player 
                  access_token={this.state.params.access_token}
                  trackId={songRecommendation.id}
                  track={{
                    name: songRecommendation.name,
                    artist: songRecommendation.artists[0].name,
                    album: songRecommendation.album.name,
                    artwork: songRecommendation.album.images[0].url,
                    duration: 30,
                    source: songRecommendation.preview_url
                  }}
                  ref={ref => (this.child = ref)}
                  songInLibrary={this.state.songInLibrary}
                  nextSong={this.nextSong}
                  addSong={this.addSong}
                  prevSong={this.prevSong}
                  addPlaylist={this.addPlaylist}
                  createdPlaylist={this.state.createdPlaylist}
                />
                <SongStatistics
                  track={songRecommendation}
                  trackDetails={songDetailData.filter(object => object.id === songRecommendation.id)[0]}
                />
              </div>
            </div>
          }
        </div>
        <HowItWorks />
        <div className='app-footer'>
          <a  href='https://github.com/gillkyle/musicvault' target='_blank' rel='noopener noreferrer'><i className='fa fa-github' /></a>
        </div>
        <AlertContainer ref={a => this.msg = a} {...this.alertOptions} />
      </div>
    );
  }
}

export default App;
