import React from 'react';
import { Box, Grid, Heading, Text, Collapsible, Markdown, Layer, Drop, TextInput } from 'grommet';

import { Range } from 'react-range';

const Ranger = () => {

  const [inputValue, setInputValue] = React.useState<any[]>([0]);
  const [showThumb, setShowThumb] = React.useState<boolean>(false);
  const thumbRef = React.useRef<any>(null);

  return (
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
  );
};

export default Ranger;