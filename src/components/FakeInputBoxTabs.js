import * as React from 'react'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Box from '@mui/material/Box'
import FacebookIcon from '@mui/icons-material/Facebook'
import TwitterIcon from '@mui/icons-material/Twitter'
import FeedIcon from '@mui/icons-material/Feed'
import ImageSearchTwoToneIcon from '@mui/icons-material/ImageSearchTwoTone'
import Button from '@mui/material/Button'
import TravelExploreIcon from '@mui/icons-material/TravelExplore'
import FakeInputForm from './FakeInputForm'
import Result from './Result'
import Progress from './Progress'
import TabPanel from './TabPanel'
import axios from 'axios'
import DeleteIcon from '@mui/icons-material/Delete'
import { styled } from '@mui/material/styles'
import PhotoCamera from '@mui/icons-material/PhotoCamera'

//var base_url = 'http://localhost:5000'
var base_url = 'https://rumor-recognito-backend.herokuapp.com'

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition
const mic = new SpeechRecognition()

mic.continuous = true
mic.interimResults = true
mic.lang = 'en-US'

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`
  }
}

class FakeInputBoxTabs extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      tabValue: 0,
      phase: [0, 0, 0, 0],
      status: [-1, -1, -1, -1],
      progressSteps: [
        [
          'Scrapping Facebook Data',
          'Processing Facebook Data',
          'Translation in Progress',
          'Populating Knowledge-Base',
          'Predicting News Veracity'
        ],
        [
          'Scrapping Twitter Data',
          'Processing Twitter Data',
          'Translation in Progress',
          'Populating Knowledge-Base',
          'Predicting News Veracity'
        ],
        [
          'Analyzing Text',
          'Processing Text Data',
          'Translation in Progress',
          'Populating Knowledge-Base',
          'Predicting News Veracity'
        ],
        [
          'Analyzing Image',
          'Processing Image Data',
          'Translation in Progress',
          'Populating Knowledge-Base',
          'Predicting News Veracity'
        ]
      ],
      labels: ['Facebook', 'Twitter', 'Normal News', 'Image Analysis'],
      inputTypes: ['text', 'text', 'text', 'file'],
      adorement: [
        'https://www.facebook.com/.../posts/',
        'https://twitter.com/.../status/',
        '',
        ''
      ],
      placeholder: [
        'Paste the facebook post-url of the news',
        'Paste the twitter post-url of the news',
        'Type the news here',
        'Choose your image file (jpeg, jpg or png)'
      ],
      searchInputs: ['', '', '', ''],
      file: null,
      fileUrl: null,
      output: ['', '', '', ''],
      isListening: false,
      note: null
    }

    //don't perform any operation on mic click.
    //block the mic to handle setState operation
    this.micIsBlocked = false
  }

  componentDidMount() {
    mic.onstart = () => {
      console.log('Mics on')
    }

    mic.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0])
        .map((result) => result.transcript)
        .join('')
      console.log(transcript)

      var newSearchInputs = this.state.searchInputs
      newSearchInputs[2] = transcript
      this.setState({
        searchInput: newSearchInputs,
        note: transcript
      })

      mic.onerror = (event) => {
        console.log(event.error)
      }
    }
  }

  //control the mic
  handleListen = (event) => {
    event.preventDefault()

    if (!this.micIsBlocked) {
      console.log(this.micIsBlocked + ' ' + this.state.isListening)

      if (!this.state.isListening) {
        mic.start()
        mic.onend = () => {
          console.log('continue..')
          mic.start()
        }
      } else {
        mic.stop()
        mic.onend = () => {
          console.log('Stopped Mic on Click')
        }
      }

      console.log('mic testing : ' + this.micIsBlocked)
      this.micIsBlocked = !this.micIsBlocked
      this.setState(
        {
          isListening: !this.state.isListening
        },
        () => {
          this.micIsBlocked = !this.micIsBlocked
        }
      )
    }
  }

  //control the Input-box
  handleSearchInput = (event) => {
    var newSearchInputs = this.state.searchInputs
    newSearchInputs[this.state.tabValue] = event.target.value
    this.setState({
      searchInputs: newSearchInputs
    })
    if (this.state.tabValue == 3) {
      console.log(event.target.files[0])
      this.setState({
        file: event.target.files[0],
        fileUrl: URL.createObjectURL(event.target.files[0])
      })
    }
  }

  resetStatus = () => {
    axios
      .get(base_url + '/reset-status')
      .then(function (response) {
        console.log('reset done')
      })
      .catch(function (error) {
        // handle error
        console.log(error)
      })
  }

  analyseFacebookPost = async (postUrl) => {
    var executed = false
    var response_got = null
    axios
      .post(base_url + '/facebook-scrape', {
        link: postUrl
      })
      .then(function (response) {
        // handle success
        response_got = response
      })
      .catch(function (error) {
        // handle error
        console.log(error)
      })
      .then(function () {
        executed = true
      })

    while (!executed) {
      try {
        const response = await axios.get(base_url + '/status')
        console.log(response)

        var newStatus = this.state.status
        newStatus[0] = response.data
        this.setState({
          status: newStatus
        })
      } catch (error) {
        console.error(error)
      }
    }

    return response_got
  }

  analyseTwitterPost = async (postUrl) => {
    var executed = false
    var response_got = null
    axios
      .post(base_url + '/tweet-scrape', {
        link: postUrl
      })
      .then(function (response) {
        // handle success
        response_got = response
      })
      .catch(function (error) {
        // handle error
        console.log(error)
      })
      .then(function () {
        executed = true
      })

    while (!executed) {
      try {
        const response = await axios.get(base_url + '/status')
        console.log(response)

        var newStatus = this.state.status
        newStatus[1] = response.data
        this.setState({
          status: newStatus
        })
      } catch (error) {
        console.error(error)
      }
    }

    return response_got
  }

  analyseNormalNews = async (news) => {
    var executed = false
    var response_got = null
    axios
      .get(base_url + '/plain-text?text=' + news)
      .then(function (response) {
        // handle success
        response_got = response
      })
      .catch(function (error) {
        // handle error
        console.log(error)
      })
      .then(function () {
        executed = true
      })

    while (!executed) {
      try {
        const response = await axios.get(base_url + '/status')
        console.log(response)

        var newStatus = this.state.status
        newStatus[2] = response.data
        this.setState({
          status: newStatus
        })
      } catch (error) {
        console.error(error)
      }
    }

    return response_got
  }

  analyseImage = async (imageFile) => {
    var executed = false
    var response_got = null
    const formData = new FormData()
    formData.append('file', imageFile)
    axios
      .post(base_url + '/analyze-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      .then(function (response) {
        // handle success
        response_got = response
      })
      .catch(function (error) {
        // handle error
        console.log(error)
      })
      .then(function () {
        executed = true
      })

    while (!executed) {
      try {
        const response = await axios.get(base_url + '/status')
        console.log(response)

        var newStatus = this.state.status
        newStatus[3] = response.data
        this.setState({
          status: newStatus
        })
      } catch (error) {
        console.error(error)
      }
    }

    return response_got
  }

  //On submit of the link
  handleSubmit = async (event) => {
    event.preventDefault()

    var tab = this.state.tabValue

    var postText = this.state.searchInputs[tab] //to get the input
    var verdict

    var newPhase = this.state.phase
    newPhase[tab] = 1

    this.setState({
      phase: newPhase
    })

    if (tab === 0) {
      //analyse facebook post
      verdict = await this.analyseFacebookPost(postText)
    } else if (tab === 1) {
      //analyse twitter post
      verdict = await this.analyseTwitterPost(postText)
    } else if (tab === 2) {
      //analyse normal news

      verdict = await this.analyseNormalNews(postText)
    } else {
      var imageFile = this.state.file
      verdict = await this.analyseImage(imageFile)
    }

    this.resetStatus()

    var newOutput = this.state.output
    newOutput[tab] = verdict.data

    newPhase = this.state.phase
    newPhase[tab] = 2

    var newStatus = this.state.status
    newStatus[tab] = -1

    this.setState({
      phase: newPhase,
      status: newStatus,
      output: newOutput
    })
  }

  handleTabChange = (event, newValue) => {
    this.setState({
      tabValue: newValue
    })
  }

  render() {
    return (
      <Box sx={{ width: '75%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={this.state.tabValue}
            onChange={this.handleTabChange}
            aria-label="basic tabs example"
            centered
          >
            <Tab
              icon={<FacebookIcon />}
              label={this.state.labels[0]}
              {...a11yProps(0)}
              iconPosition="start"
            />

            <Tab
              icon={<TwitterIcon />}
              label={this.state.labels[1]}
              {...a11yProps(1)}
              iconPosition="start"
            />

            <Tab
              icon={<FeedIcon />}
              label={this.state.labels[2]}
              {...a11yProps(2)}
              iconPosition="start"
            />

            <Tab
              icon={<ImageSearchTwoToneIcon />}
              label={this.state.labels[3]}
              {...a11yProps(3)}
              iconPosition="start"
            />
          </Tabs>
        </Box>

        <div>
          <TabPanel value={this.state.tabValue} index={0}>
            <FakeInputForm
              id={0}
              label={this.state.labels[0]}
              inputType={this.state.inputTypes[0]}
              handleSearchInput={this.handleSearchInput}
              searchInputValue={this.state.searchInputs[0]}
              handleSubmit={this.handleSubmit}
              handleListen={this.handleListen}
              /*adorement={this.state.adorement[0]}*/
              placeholder={this.state.placeholder[0]}
            />
            <div style={{ marginTop: '25px' }}>
              {this.state.phase[0] == 0 ? (
                <SearchButton
                  handleSubmit={this.handleSubmit}
                  searchInput={this.state.searchInputs[0]}
                />
              ) : this.state.phase[0] == 1 ? (
                <Progress
                  status={this.state.status[0]}
                  steps={this.state.progressSteps[0]}
                />
              ) : (
                <Result verdict={this.state.output[0]} />
              )}
            </div>
          </TabPanel>

          <TabPanel value={this.state.tabValue} index={1}>
            <FakeInputForm
              id={1}
              label={this.state.labels[1]}
              inputType={this.state.inputTypes[1]}
              handleSearchInput={this.handleSearchInput}
              searchInputValue={this.state.searchInputs[1]}
              handleSubmit={this.handleSubmit}
              handleListen={this.handleListen}
              /*adorement={this.state.adorement[1]}*/
              placeholder={this.state.placeholder[1]}
            />
            <div style={{ marginTop: '25px' }}>
              {this.state.phase[1] == 0 ? (
                <SearchButton
                  handleSubmit={this.handleSubmit}
                  searchInput={this.state.searchInputs[1]}
                />
              ) : this.state.phase[1] == 1 ? (
                <Progress
                  status={this.state.status[1]}
                  steps={this.state.progressSteps[1]}
                />
              ) : (
                <Result verdict={this.state.output[1]} />
              )}
            </div>
          </TabPanel>

          <TabPanel value={this.state.tabValue} index={2}>
            <FakeInputForm
              id={2}
              label={this.state.labels[2]}
              inputType={this.state.inputTypes[2]}
              handleSearchInput={this.handleSearchInput}
              searchInputValue={this.state.searchInputs[2]}
              handleSubmit={this.handleSubmit}
              handleListen={this.handleListen}
              hasAudioFeature={true}
              isListening={this.state.isListening}
              /*adorement={this.state.adorement[2]}*/
              placeholder={this.state.placeholder[2]}
            />
            <div style={{ marginTop: '25px' }}>
              {this.state.phase[2] == 0 ? (
                <SearchButton
                  handleSubmit={this.handleSubmit}
                  searchInput={this.state.searchInputs[2]}
                />
              ) : this.state.phase[2] == 1 ? (
                <Progress
                  status={this.state.status[2]}
                  steps={this.state.progressSteps[2]}
                />
              ) : (
                <Result verdict={this.state.output[2]} />
              )}
            </div>
          </TabPanel>

          <TabPanel value={this.state.tabValue} index={3}>
            <img
              src={this.state.fileUrl}
              style={{
                width: 250,
                height: 120,
                marginTop: '10px'
              }}
            />
            <UploadButton handleSearchInput={this.handleSearchInput} />
            <div style={{ marginTop: '25px' }}>
              {this.state.phase[3] == 0 ? (
                <SearchButton
                  handleSubmit={this.handleSubmit}
                  searchInput={this.state.searchInputs[3]}
                />
              ) : this.state.phase[3] == 1 ? (
                <Progress
                  status={this.state.status[3]}
                  steps={this.state.progressSteps[3]}
                />
              ) : (
                <Result verdict={this.state.output[3]} />
              )}
            </div>
          </TabPanel>
        </div>
      </Box>
    )
  }
}

class SearchButton extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    return (
      <>
        <Button
          type="submit"
          variant="contained"
          startIcon={<TravelExploreIcon />}
          onClick={(event) => this.props.handleSubmit(event)}
          disabled={this.props.searchInput == '' ? true : false}
        >
          Predict
        </Button>
      </>
    )
  }
}

const Input = styled('input')({
  display: 'none'
})

class UploadButton extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    return (
      <label htmlFor="icon-button-file">
        <Input
          accept="image/*"
          id="icon-button-file"
          type="file"
          onChange={(event) => this.props.handleSearchInput(event)}
        />
        <Button
          variant="contained"
          component="span"
          startIcon={<PhotoCamera />}
          style={{ margin: '0 50px' }}
        >
          Upload
        </Button>
      </label>
    )
  }
}

class FlushButton extends React.Component {
  render() {
    return (
      <>
        <Button
          type="submit"
          variant="contained"
          startIcon={<DeleteIcon />}
          onClick={(event) => this.props.handleSubmit(event)}
          disabled={this.props.searchInput == '' ? 'true' : ''}
        >
          Predict
        </Button>
      </>
    )
  }
}

export default FakeInputBoxTabs