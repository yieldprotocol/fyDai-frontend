import React, { useContext } from 'react';

import {
  Layer,
  Footer,
  Box,
  Text,
  ResponsiveContext,
} from 'grommet';

import { 
  FiArrowLeft as ArrowLeft,
} from 'react-icons/fi';

import FlatButton from './FlatButton';
import { UserContext } from '../contexts/UserContext';

const HistoryWrap = ({ children, closeLayer, series } : any) => {

  const screenSize = useContext(ResponsiveContext);
  const { actions }= useContext(UserContext);

  return (
    <Layer
      onClickOutside={() => closeLayer(true)}
      animation='slide'
      onEsc={() => closeLayer(true)}
    >
      <Box
        width={screenSize!=='small'?{ min:'620px', max:'620px' }: undefined}
        background="background-front"
        direction="column"
        fill="vertical"
        style={{
          borderRadius: '0.5rem',
          padding: '2rem',
        }}
      >   
        <Box pad="medium" gap="small"> 
          <Text size='xlarge' weight='bold'> Transaction History  {series?.displayName} </Text> 
        </Box>
        <Box pad="medium" gap="small"> 
          {children}
        </Box> 
        <Footer direction="row-responsive" justify='between' pad="medium" margin={{ top:'medium' }}>
          <FlatButton 
            onClick={() => closeLayer()}
            label={
              <Box direction='row' gap='medium' align='center'>
                <ArrowLeft color='text-weak' />                    
                <Text size='xsmall' color='text-weak'> go back  </Text>
              </Box>
                  }
          />
          <FlatButton
            label={<Text size='xsmall' color='text-weak'>Rebuild history</Text>}
            onClick={()=>actions.rebuildHistory()}
          />
        </Footer>
      </Box>
    </Layer>
  );
};

export default HistoryWrap;