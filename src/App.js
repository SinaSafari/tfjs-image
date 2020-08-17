import React, {useReducer, useState, useRef} from 'react';
import * as mobilenet from "@tensorflow-models/mobilenet"
import * as tf from '@tensorflow/tfjs' 
import './App.css';


/**
 * @description 6 different states in each one we have a next step and
 * other states related to react app for simplicity. on `complete` state next is 
 * ready for upload which in our case is `awaitingUpload`
 * it means only when component is mounting for fist time, 
 * we meet the `initiail` and `loadingModel`
 */
const stateMachine = {
  initial: 'initial',
  states : {
    initial: { 
      on: { 
        next: "loadingModel"
      }
    },
    loadingModel: {
      on: {
        next: "awaitingUpload"
      }
    },
    awaitingUpload: {
      on: {
        next: "ready"
      }
    },
    ready: {
      on: {
        next: "classifying"
      },
      showImage: true,
    },
    classifying: {
      on: {
        next: "complete"
      }
    },
    complete: {
      on: {
        next: "awaitingUpload"
      },
      showImage: true,
      showResults: true
    },
  }
}

/**
 * @description like any other reducer functions, it gets the current state and 
 * an action or in our case an `event` and based on the action returns new state.
 * in our case, event always is `next`
 * 
 * @param {obj} currentState 
 * @param {string} event 
 */
const reducer = (currentState, event) => {
  return stateMachine.states[currentState].on[event] || stateMachine.initial
}

function App() {

  tf.setBackend("cpu")

  // states
  const [model, setModel] = useState(null)
  const [imageUrl, setImageUrl] = useState(null)
  const [results, setResults] = useState([])

  // refs
  const inputRef = useRef()
  const imageRef = useRef()
  
  const [state, dispatch] = useReducer(reducer, stateMachine.initial)

  // call next for reaching next state in reducer
  const next = () => dispatch('next')

  // proccess loading the mobilenet model asynchronously
  // and set the state
  const loadModel = async () => {
    // next state is `loadingModel`
    next()
    const mobilenetModel = await mobilenet.load()
    setModel(mobilenetModel)
    // after finishing, next step is `awaitingUpload`
    next()
  }

  // uploading proccess
  // although it's possible to upload multiple image,
  // uploading proccess handle just on one image
  const handleUpload = e => {
    const { files } = e.target
    if (files.length > 0) {
      const url = URL.createObjectURL(files[0])
      setImageUrl(url)
      // next step is ready
      next()
    } 
  }

  // proccessing the classification
  // everything handles by mibilenet :)
  const identify = async () => {
    // next step is classifying
    next()
    const classificationResults = await model.classify(imageRef.current)
    setResults(classificationResults)
    // next step is complete
    next()
  }

  // reset app and back to `awaitingUpload`
  // clearing the image and results states
  const reset = () =>{
    setResults([])
    setImageUrl(null)
    next()
  }


  // handle different state and actions for app
  const buttonProps = {
    initial: {
      action: loadModel,
      text: "Load Model",
    },
    loadingModel: {
      action: () => {},
      text: "Loading Model...",
    },
    awaitingUpload: {
      action: () => inputRef.current.click(),
      text: "Upload photo",
    },
    ready: {
      action: identify,
      text: "Identify",
    },
    classifying: {
      action: () => {},
      text: "Identifying",
    },
    complete: {
      action: reset,
      text: "Reset",
    }
  }


  // I use these variable for showing the image just in
  // step `ready` when the image is uploaded
  // and in `complete` when the proccess is over.
  // and results only should be visible when the proccess is over
  // for avoiding facing `undefiend` I set the initial value
  // to false 
  const { 
    showImage = false, 
    showResults = false 
  } = stateMachine.states[state]

  return (
    <>
    <header>
      <h1>Image Classifier <span>📸</span></h1>
    </header>
    {results.length == 0 && (
      <div className="descarea">
        <h3>Manual</h3>
        <ol>
          <p>- Load model (it may take a few moment)</p>
          <p>- Uoload the photo</p>
          <p>- See the results!</p>
        </ol>
      </div>
    )}
    
      
      <div>
        {showImage && (
          <img 
            src={imageUrl} 
            alt="uploaded preview"
            ref={imageRef} 
          />
        )}
        {showResults && (
        <ul>
          {results.map(({ className, probability }) => (
            <li key={className}>{`${className}: %${(probability * 100).toFixed(
              2
            )}`}</li>
          ))}
        </ul>
      )}
        <input 
          type="file" 
          accept="image/*" 
          capture="camera" 
          ref={inputRef} 
          onChange={handleUpload}
        />
        <div className="btnarea">
          <button onClick={buttonProps[state].action}>
            {buttonProps[state].text}
          </button>
        </div>
        <br />
      </div>
      
      <footer>
        <div>
          <p>This app uses Tensorflowjs and MobileNet and ables to recognize various animals and objects <a 
              className="clink"
              href="https://github.com/tensorflow/tfjs-models/tree/master/mobilenet" 
              target="blank"
            >
              MobileNet Repository
            </a>
          </p>
          <p>Designed and developed with <span> ❤️&nbsp;</span> by <a target="blank" className="clink" href="https://twitter.com/iamsinasafari">SinaSafari</a></p>
            
          </div>
      </footer>
    </>
  );
}

export default App;
