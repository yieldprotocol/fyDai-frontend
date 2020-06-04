import React from 'react';
import { Box, Heading, Text } from 'grommet';

import {
  FaRegEye as EyeOpen,
  FaRegEyeSlash as EyeClosed,
} from 'react-icons/fa';

import YieldPosition from '../components/YieldPosition';


import { PositionsContext } from '../contexts/PositionsContext';


const Positions = () => {

  const [showCurrent, setShowCurrent] = React.useState<boolean>(true);
  const [showMature, setShowMature] = React.useState<boolean>(false);
  const [showSettled, setShowSettled] = React.useState<boolean>(false);

  const [ seriesPosition, setSeriesPosition] = React.useState<any>();
  const { state: positionsState, dispatch: positionsDispatch } = React.useContext(PositionsContext);

  // React.useEffect(()=>{
  // }, [positionsState]);

  return (

    <Box 
      pad="medium" 
      border={{ side:'all', color:'lightgreen' }}
      round
      gap='small'
    >
      <Box>
        <Box 
          fill='horizontal' 
          justify='between'
          direction='row'
          pad={{ horizontal:'small' }}
          align='baseline'
          hoverIndicator='background-front'
          round
          onClick={()=>setShowCurrent(!showCurrent)}
        >
          <Box direction='row' align='baseline'>
            <Heading level='5' margin='small'>Current Positions</Heading>
            <Text>({positionsState.positionsData.length})</Text> 
          </Box>
          {showCurrent ? <EyeOpen onClick={()=>setShowCurrent(false)} /> : <EyeClosed onClick={()=>setShowCurrent(true)} />}
        </Box>

        {showCurrent && 
          <Box margin={{ vertical:'none' }} gap='small'>
            { positionsState.positionsData.length > 0 ? 
              positionsState.positionsData.map((x:any)=>{
                return (
                  <Box key={x.type}>
                    <YieldPosition position={x} header={true} />
                  </Box>
                );
              })
              : <Box color='border' pad='small' align='center' round> You dont hold any positions yet.</Box> }
          </Box>}
      </Box>

      <Box>
        <Box 
          fill='horizontal'
          justify='between'
          direction='row'
          pad={{ horizontal:'small' }}
          align='baseline'
          round
          hoverIndicator='background-front'
          onClick={()=>setShowMature(!showMature)}
        >
          <Box direction='row' align='baseline'>
            <Heading level='5' margin='small'>Matured Positions </Heading>
            <Text>({positionsState.positionsData.length})</Text> 
          </Box>
          {showMature ? <EyeOpen onClick={()=>setShowMature(false)} /> : <EyeClosed onClick={()=>setShowMature(true)} />}
          
        </Box>
        {showMature && 
          <Box margin={{ vertical:'none' }} gap='small'>
            { positionsState.positionsData.length > 0 ? 
              positionsState.positionsData.map((x:any)=>{
                return (
                  <Box key={x.type}>
                    <YieldPosition position={x} header={true} />
                  </Box>
                );
              })
              : <Box color='border' pad='small' align='center' round> No mature positions yet.</Box> }
          </Box>}
      </Box>

      <Box>
        <Box
          fill='horizontal'
          justify='between'
          direction='row'
          pad={{ horizontal:'small' }}
          align='baseline'
          round
          hoverIndicator='background-front'
          onClick={()=>setShowSettled(!showSettled)}
        >
          <Box direction='row' align='baseline'>
            <Heading level='5' margin='small'>Previously Settled Positions </Heading>
            <Text>({positionsState.positionsData.length})</Text> 
          </Box>
          {showSettled ? <EyeOpen onClick={()=>setShowSettled(false)} /> : <EyeClosed onClick={()=>setShowSettled(true)} />}
        </Box>
        {showSettled &&
          <Box margin={{ vertical:'none' }} gap='small'>
            { positionsState.positionsData.length > 0 ? 
              positionsState.positionsData.map((x:any)=>{
                return (
                  <Box key={x.type}>
                    <YieldPosition position={x} header={true} />
                  </Box>
                );
              })
              : <Box color='border' pad='small' align='center' round> No settled positions.</Box> }
          </Box>}
      </Box>
    </Box>

  );
};

export default Positions;
