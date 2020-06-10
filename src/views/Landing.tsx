import React from 'react';
import { Box, Grid, Heading, Text, Collapsible, Markdown, Layer, Drop, TextInput } from 'grommet';

import { Range } from 'react-range';

const Landing = () => {

  const [inputValue, setInputValue] = React.useState<any[]>([0]);
  const [showThumb, setShowThumb] = React.useState<boolean>(false);
  const thumbRef = React.useRef<any>(null);

  return (
    <Box 
      margin='large'
      gap='large'
      align='center'
      // background='background'
    >
      <Heading>
        I am a borrower. 
      </Heading>
      Some more copy here about borrowing. with same design language as the website.

      <Range
        step={0.1}
        min={0}
        max={32}
        values={inputValue}
        onChange={values => { setInputValue(values); }}
        renderTrack={({ props, children }) => (
          <Box
            {...props}
            background='background-front'
            round
            style={{
              ...props.style,
              height: '20px',
              width: '50%',
              backgroundColor: '#ccc'
            }}
          >
            {children}
          </Box>
        )}
        renderThumb={({ props, value, isDragged }) => (
          <>
            <Box
              {...props}
              ref={thumbRef}
              round
              background='brand'
              pad='small'
              // style={{ minWidth:'10' }}
            >
              {value.toFixed(1)}
            </Box>
            {thumbRef.current && isDragged && (
            <Drop align={{ bottom: 'top' }} target={thumbRef.current} plain>
              <Box
                // margin="xsmall"
                pad="small"
                // 
                border='all'
                background="dark-3"
              >
                { value }
                {/* <TextInput 
                  value={value}
                /> */}
              </Box>
            </Drop>
            )}
          </>
        )}
      />


      <Heading>
        I am a lender.
      </Heading>
      Some more copy here about ledning. with same design language as the website.
    </Box>
  );
};

export default Landing;
