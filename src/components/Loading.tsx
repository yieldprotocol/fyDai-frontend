import React, { useContext } from 'react';

import { 
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
          height={`${(theme?.text[size].size).slice(0, -2)}px`}
        /> 
        :
        children}
    </>
  );
}

export default Loading;
