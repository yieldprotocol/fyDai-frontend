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

// import { INotification } from '../types';

function NotifyLayer() {

  const {
    open,
    msg,
    type,
    position,
    closeNotify,
    callbackAction,
    callbackCancel,
  } = React.useContext<any>(NotifyContext);

  const typeMap = (_type:string) => {
    switch(_type) {
      case 'warn' : return { color: 'orange', icon: <Warn /> };
      case 'error' : return { color: 'pink', icon: <Error /> };
      case 'success': return { color: 'lightgreen', icon: <CheckCircle /> };
      default: return { color: 'lightgrey', icon: <Info /> };
    }
  };

  return (
    <>
      { open &&
      <Layer
        position={position}
        modal={false}
        margin={{ vertical: 'large', horizontal: 'xsmall' }}
        onEsc={closeNotify}
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
          background={typeMap(type).color}
        >
          { typeMap(type).icon }
          <Box align="center" direction="row" gap="xsmall">
            <Text>{ msg }</Text>
          </Box>
          <Button icon={<Close />} onClick={closeNotify} plain />
        </Box>
      </Layer>}
    </>
  );
}

export default NotifyLayer;