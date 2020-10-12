import React, { useState, useContext, Suspense } from 'react';
import { Text, Image, Grommet, base, Main, Box, ResponsiveContext } from 'grommet';
import { deepMerge } from 'grommet/utils';
import { yieldTheme } from './themes';
import logoLight from './assets/images/logo_light.svg';
import ErrorBoundary from './components/ErrorBoundry';

const App = (props:any) => {
  const screenSize = useContext(ResponsiveContext);
  return (
    <div 
      className="App" 
      style={{ background:'black' }}
    >
      <Main 
        align='center'
        justify='center'
      >  
        <Box 
          fill 
          width={screenSize==='small'? '20%':undefined} 
          pad='xxsmall'
          align='center'
          justify='center'
        >
          <Image src={logoLight} fit="contain" />
        </Box>
        <Text size='xxsmall' color='text-xweak'> coming soon...</Text>    
      </Main>
    </div>
  );
};

const WrappedApp = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [ moodLight, setMoodLight] = useState(true);

  return (
    <Suspense fallback={null}>
      <Grommet
        theme={deepMerge(base, yieldTheme)}
        themeMode={darkMode ? 'dark' : 'light'}
        full
      >     
        <ErrorBoundary>
          <App 
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            moodLight={moodLight}
            toggleMoodLight={()=>setMoodLight(!moodLight)}
          />
        </ErrorBoundary>
      </Grommet>
    </Suspense>
  );
};

export default WrappedApp;
