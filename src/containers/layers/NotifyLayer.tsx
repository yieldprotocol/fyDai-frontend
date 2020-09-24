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
import RaisedButton from '../../components/RaisedButton';
import FlatButton from '../../components/FlatButton';

function NotifyLayer(target:any, columnsWidth:any) {

  const  { state, dispatch }  = useContext<any>(NotifyContext);
  const notificationTypeMap = (_type:string ) => {
    switch(_type) {
      case 'warn' : return { color: '#ffa274', icon: <Text size='small' color='#333333'><Warn /></Text> };
      case 'error' : return { color: '#ff748c', icon: <Text size='small' color='#333333'><Error /></Text> };
      case 'success': return { color: '#8cff74', icon: <Text size='small' color='#333333'><CheckCircle /></Text> };
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
        <Box 
          width='1/2' 
        >
          <Grid columns={columnsWidth}>
            {/* <Box background={notificationTypeMap(state.type).color} /> */}
            <Box />
            <Box
              direction="row"
              justify="center"
              elevation="large"
              gap='medium'
              pad={{ vertical:'small', horizontal:'medium' }}
              background={notificationTypeMap(state.type).color}
              round={{ corner:'left', size:'small' }}
              align='center'
            >
              { notificationTypeMap(state.type).icon }
              <Box align="center" direction="row" gap="small" pad='small'>
                <Text size='small' color='#333333'>{ state.message }</Text>
              </Box>
              <RaisedButton
                background={notificationTypeMap(state.type).color}
                onClick={()=>dispatch({ type:'closeNotify' })}
                label={<Text size='small' color='#333333'>Close</Text>}
              />
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