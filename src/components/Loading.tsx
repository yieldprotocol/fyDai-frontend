import React, { useState, useContext, useEffect } from 'react';
import { BigNumber } from 'ethers';

import { 
  Box, 
  TextInput, 
  Text, 
  ThemeContext,
} from 'grommet';

import { ScaleLoader } from 'react-spinners';

interface ILoadingProps {
  condition: boolean;
  size: string;
  children: any;
}

function Loading({ condition, size, children }:ILoadingProps) {

  const theme:any = useContext(ThemeContext);
  
  return (
    <>
      { condition ?    
        <ScaleLoader 
          color={theme?.global?.colors['brand-transparent'].dark}
          height={(theme?.text[size].size).slice(0, -2)}
        /> 
        :
        children}
    </>
  );
}

export default Loading;
