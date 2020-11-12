import React, { useContext } from 'react';
import styled, { css } from 'styled-components';
import { Text, Box, Layer, ResponsiveContext, ThemeContext } from 'grommet';
import { FiArrowRight as ArrowRight } from 'react-icons/fi';

import { SeriesContext } from '../contexts/SeriesContext';
import { UserContext } from '../contexts/UserContext';

import Authorization from './Authorization';
import { modColor } from '../utils';

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

  const { state: seriesState } = useContext(SeriesContext);
  const { activeSeries } = seriesState;
  
  const { state: userState } = useContext(UserContext);
  const { authorization: { hasDelegatedProxy } } = userState;

  return (
    <>
      {/* Handles the 'ALL clear to transact' case for mobile and other */}
      { hasDelegatedProxy && props.hasPoolDelegatedProxy && !props.disabled &&
       ( !mobile ? 
         <StyledBox 
           {...props} 
           fill='horizontal'
           align='center'
           pad='small'
           background={defaultBackground}
         >
           <Text 
             weight='bold'
             size='large'
           >
             {props.label}
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

      {/* Handles the 'No proxy authorised' case */}
      { !hasDelegatedProxy && 
        !props.disabled &&   
        <Authorization authWrap>
          { !mobile ?
            <StyledBox 
              {...props} 
              fill='horizontal'
              align='center'
              pad='small'
              onClick={()=>{ }}
              background={defaultBackground}
            >
              <Text 
                size='medium'
              >
                Please authorize Yield before going any further
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
                background={defaultBackground}
                direction="row"  
                elevation='medium'
                pad="medium"
                justify='between'
                align='center'
                fill
              >    
                <Box 
                  onClick={(e:any)=>{e.stopPropagation(); props.clearInput();}}
                >
                  <Text size='xxsmall'>Cancel</Text>
                </Box>
                <Box width={{ max:'75%' }} direction='row' align='center' gap='small'>  
                  <Text size='xsmall' textAlign='center'> Please authorize Yield before going any further</Text>
                </Box>     
              </Box>
            </Layer>}
        </Authorization>}

      {/* Handles the 'No Series auth' case */}
      { hasDelegatedProxy && 
        !props.hasPoolDelegatedProxy &&
        !props.disabled &&
        <Authorization 
          authWrap
          series={activeSeries}
        >
          { !mobile? 
            <StyledBox 
              {...props} 
              fill='horizontal'
              align='center'
              pad='small'
              onClick={()=>{ }}
              background={defaultBackground}
            >
              <Text 
                size='medium'
              >
                Please unlock this series first
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
                  onClick={(e:any)=>{e.stopPropagation(); props.clearInput();}}
                > 
                  <Text size='xxsmall'>Cancel</Text>
                </Box>
                <Box direction='row' align='center' gap='small'>  
                  <Text size='xsmall'>Please unlock this series first</Text>
                  <ArrowRight color={activeSeries?.seriesColor} />
                </Box>     
              </Box>
            </Layer>}
        </Authorization>}

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