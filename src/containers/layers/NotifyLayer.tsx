import React, { useEffect, useState, useContext } from 'react';
import { Layer, Box, DropButton, Button, TextInput, Header, Text, Heading, Footer, Collapsible, ThemeContext, Grid } from 'grommet';
import {
  FiCheckCircle as CheckCircle,
  FiX as Close,
  FiInfo as Info,
  FiXCircle as Error,
  FiAlertTriangle as Warn,
} from 'react-icons/fi';

import { NotifyContext } from '../../contexts/NotifyContext';

function NotifyLayer(target:any, columnsWidth:any) {

  const  { state, dispatch }  = useContext<any>(NotifyContext);
  const notificationTypeMap = (_type:string ) => {
    switch(_type) {
      case 'warn' : return { color: 'orange', icon: <Warn /> };
      case 'error' : return { color: 'pink', icon: <Error /> };
      case 'success': return { color: 'lightgreen', icon: <CheckCircle /> };
      default: return { color: 'background', icon: <Info /> };
    }
  };

  return (
    <>
      { state.open &&
      <Layer
        position={state.position}
        modal={false}
        // margin={{ vertical: 'large', horizontal: 'small' }}
        onEsc={()=>dispatch({ type:'closeNotify' })}
        responsive={false}
        plain
        target={target.target}
        full='vertical'
      >
        <Box width='1/2'>
          <Grid columns={columnsWidth}>
            {/* <Box background={notificationTypeMap(state.type).color} /> */}
            <Box />
            <Box
              direction="row"
              justify="center"
              elevation="xsmall"
              gap='medium'
              pad={{ vertical:'small', horizontal:'medium' }}
              background={notificationTypeMap(state.type).color}
              align='center'
            >
              { notificationTypeMap(state.type).icon }
              <Box align="center" direction="row" gap="small" pad='small'>
                <Text>{ state.message }</Text>
              </Box>
              <Button icon={<Close />} onClick={()=>dispatch({ type:'closeNotify' })} plain />
            </Box>
            <Box background={notificationTypeMap(state.type).color} />
          </Grid> 
        </Box>
      </Layer>}

      {state.fatalOpen && 
      <Layer
        position='center'
        modal={true}
        margin={{ vertical: 'large', horizontal: 'large' }}
        onEsc={()=>dispatch({ type:'closeNotify' })}
        // responsive={true}
        // plain  
      >
        <Box
          fill
          align="center"
          direction="row"
          gap="large"
          round='xsmall'
          elevation="medium"
          pad={{ vertical: 'large', horizontal: 'large' }}
          border={{ color:'red' }}
          background='background'
        >
          { notificationTypeMap(state.type).icon }
          <Box align="center" direction="row" gap="xsmall">
            <Text>{ state.fatalMsg }</Text>
          </Box>
        </Box>
      </Layer>}

    </>
  );
}

export default NotifyLayer;