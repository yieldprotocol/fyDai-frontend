import React from 'react';
import { Layer, Box, DropButton, Button, TextInput, Header, Text, Heading, Footer, Collapsible, ThemeContext } from 'grommet';
import {
  FaCheckCircle as CheckCircle,
  FaTimes as Close,
  FaInfoCircle as Info,
  FaTimesCircle as Error,
  FaExclamationCircle as Warn,
} from 'react-icons/fa';

import { NotifyContext } from '../../contexts/NotifyContext';

function NotifyLayer() {

  const  { state, dispatch }  = React.useContext<any>(NotifyContext);

  const notificationTypeMap = (_type:string) => {
    switch(_type) {
      case 'warn' : return { color: 'orange', icon: <Warn /> };
      case 'error' : return { color: 'pink', icon: <Error /> };
      case 'success': return { color: 'lightgreen', icon: <CheckCircle /> };
      default: return { color: 'lightgrey', icon: <Info /> };
    }
  };

  return (
    <>
      { state.open &&
      <Layer
        position={state.position}
        modal={false}
        margin={{ vertical: 'large', horizontal: 'xsmall' }}
        onEsc={()=>dispatch({ type:'closeNotify' })}
        responsive={false}
        plain
      >
        <Box
          fill
          align="center"
          direction="row"
          gap="large"
          justify="between"
          round="medium"
          elevation="medium"
          pad={{ vertical: 'xsmall', horizontal: 'small' }}
          background={notificationTypeMap(state.type).color}
        >
          { notificationTypeMap(state.type).icon }
          <Box align="center" direction="row" gap="xsmall">
            <Text>{ state.message }</Text>
          </Box>
          <Button icon={<Close />} onClick={()=>dispatch({ type:'closeNotify' })} plain />
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
          round="medium"
          elevation="medium"
          pad={{ vertical: 'large', horizontal: 'large' }}
          border={{ color:'red' }}
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