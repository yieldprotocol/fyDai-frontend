import React from 'react';
import { useWeb3React } from '@web3-react/core';
import logo from './logo.svg';
import './App.css';



function App() {
  const { active } = useWeb3React();

  React.useEffect(() => {
    console.log(active);
  }, [active]);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
