import React from 'react';
import { Layer, Box, DropButton, Button, TextInput, Header, Text, Heading, Footer, Collapsible, ThemeContext } from 'grommet';
import {
  FaCheckCircle as CheckCircle,
  FaTimes as Close,
} from 'react-icons/fa';

import { NotifyContext } from '../contexts/NotifyContext';

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
          gap="small"
          justify="between"
          round="medium"
          elevation="medium"
          pad={{ vertical: 'xsmall', horizontal: 'small' }}
          background="status-ok"
        >
          <Box align="center" direction="row" gap="xsmall">
            <CheckCircle />
            <Text>{ msg }</Text>
          </Box>
          <Button icon={<Close />} onClick={closeNotify} plain />
        </Box>
      </Layer>}
    </>
  );
}

export default NotifyLayer;