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
import { HistoryContext } from '../contexts/HistoryContext';

const HistoryWrap = ({ children, closeLayer, series } : any) => {
  const mobile:boolean = ( useContext<any>(ResponsiveContext) === 'small' );
  const { actions }= useContext(HistoryContext);
  return (
    <Layer
      onClickOutside={() => closeLayer(true)}
      animation='slide'
      onEsc={() => closeLayer(true)}
    >
      <Box
        width={!mobile?{ min:'620px', max:'620px' }: undefined}
        // height={!mobile?{ min:'620px', max:'620px' }: undefined}
        background="background"
        direction="column"
        fill="vertical"
        style={{
          borderRadius: '0.5rem',
          padding: '2rem',
        }}
        justify='between'
      >  
        <Box>
          <Box pad="medium" gap="small"> 
            <Text size='xlarge' weight='bold'> Transaction History  {series?.displayName} </Text> 
          </Box>
          <Box pad="medium" gap="small"> 
            {children}
          </Box>
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
            label={<Text size='xsmall' color='text-weak'>Refresh</Text>}
            onClick={()=>actions.rebuildHistory()}
          />
        </Footer>
      </Box>
    </Layer>
  );
};

export default HistoryWrap;