import React, { useContext } from 'react';
import { ThemeContext } from 'grommet';
import { ScaleLoader } from 'react-spinners';

interface ILoadingProps {
  condition: boolean;
  size: string;
  children: any;
  color?: any;
}

function Loading({ condition, size, children, color }:ILoadingProps) {
  const theme:any = useContext(ThemeContext);
  const defaultColor = theme.dark? theme?.global?.colors['text'].dark: theme?.global?.colors['text'].light;
  return (
    <>
      { condition ? 
        <ScaleLoader 
          color={color || defaultColor}
          height={`${(theme?.text[size].size).slice(0, -2)}px`}
        />
        :
        children}
    </>
  );
}

Loading.defaultProps = { color:null };

export default Loading;
