import React, { useContext, useState, useEffect } from 'react';
import styled, { css } from 'styled-components';
import { Text, Box, Layer, ResponsiveContext, ThemeContext } from 'grommet';
import { FiArrowRight as ArrowRight } from 'react-icons/fi';

import { SeriesContext } from '../contexts/SeriesContext';
import { UserContext } from '../contexts/UserContext';
import { TxContext } from '../contexts/TxContext';

import { modColor } from '../utils';
import { useDsRegistry } from '../hooks/dsRegistryHook';

const StyledBox = styled(Box)`
  border-radius: 8px;
  transition: all 0.3s ease-in-out;

  ${(props:any) => props.disabled && css`
  background: ${ props.background };
  box-shadow:  0px 0px 0px ${modColor(props.background, -15)}, 
  -0px -0px 0px ${modColor(props.background, 10)};
  :hover {
    transform: scale(1);
    box-shadow:  0px 0px 0px ${modColor(props.background, -15)},  
    -0px -0px 0px ${modColor(props.background, 10)};
    }
  `}

  ${(props:any) => !(props.disabled) && css`
  background: ${ props.background };
  box-shadow:  6px 6px 11px ${modColor(props.background, -15)},  
  -6px -6px 11px ${modColor(props.background, 10)};
  :active:hover {
    box-shadow:  0px 0px 0px ${modColor(props.background, -15)}, 
        -0px -0px 0px ${modColor(props.background, 10)};
    } 
  :hover {
    transform: scale(1.01);
    box-shadow:  8px 8px 11px ${modColor(props.background, -15)},  
    -8px -8px 11px ${modColor(props.background, 10)};
    }
  `}
`;

function ActionButton({ ...props }:any ) {

  const mobile:boolean = ( useContext<any>(ResponsiveContext) === 'small' );
  const theme:any = React.useContext(ThemeContext);
  const themeBackground = theme.global.colors.background;
  const defaultBackground = theme.dark === true ? themeBackground.dark: themeBackground.light;

  const { state: { pendingTxs }, dispatch } = useContext(TxContext);

  const { state: seriesState, actions: seriesActions } = useContext(SeriesContext);
  const { activeSeries } = seriesState;

  const { state: { authorization:{ hasDsProxy } }, actions: userActions } = useContext(UserContext);
  const { buildDsProxy } = useDsRegistry();

  const [proxyLabel, setProxyLabel] = useState<any>('First, create a Yield proxy'); 
  useEffect(()=>{
    pendingTxs.some((x:any) => x.type === 'CREATE_PROXY' ) ? setProxyLabel('Building a new proxy...') : setProxyLabel('First, create a Yield proxy');
  }, [pendingTxs]);

  const buildProxyProcedure = async () => {
    if (!pendingTxs.some((x:any) => x.type === 'CREATE_PROXY')) {
      await buildDsProxy();
      await Promise.all([
        userActions.updateAuthorizations(),
        seriesActions.updateActiveSeries()
      ]);
    }
  };

  return (
    <>
      { !props.disabled &&
       ( !mobile ? 
         <StyledBox 
           {...props}
           onClick={hasDsProxy ? props.onClick : ()=> buildProxyProcedure()}
           fill='horizontal'
           align='center'
           pad='small'
           background={defaultBackground}
         >
           <Text 
             weight='bold'
             size='large'
           >
             {hasDsProxy ? props.label : proxyLabel } 
           </Text>
         </StyledBox> 
         :
         <Layer
           position='bottom'
           modal={false}
           responsive={false}
           full='horizontal'
         >
           <Box
             // background='background'
             direction="row"  
             elevation='medium'
             pad="medium"
             justify='between'
             align='center'
             background={defaultBackground}
           >          
             <Box
               onClick={()=>props.clearInput()}
             > 
               <Text size='xxsmall'>Cancel</Text>
             </Box>
             <Box {...props} direction='row' align='center' gap='small'>  
               <Text weight='bold'> {props.label} </Text>
               <ArrowRight color={activeSeries?.seriesColor} />
             </Box>     
           </Box>
         </Layer>
       )}

      { !mobile && props.disabled && 
        <Box 
          fill='horizontal'
          align='center'
          pad='medium'
          background={defaultBackground}
        />}
    </>
  );
}

export default ActionButton;