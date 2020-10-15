import React, { useContext } from 'react';
import { Layer, Box, Text, Grid, ResponsiveContext } from 'grommet';
import {
  FiCheckCircle as CheckCircle,
  FiInfo as Info,
  FiXCircle as Error,
  FiAlertTriangle as Warn,
} from 'react-icons/fi';

import { NotifyContext } from '../../contexts/NotifyContext';
import RaisedButton from '../../components/RaisedButton';

function NotifyLayer(target:any, columnsWidth:any) {

  const  { state, dispatch }  = useContext<any>(NotifyContext);
  const mobile:boolean = ( useContext<any>(ResponsiveContext) === 'small' );

  const notificationTypeMap = (_type:string ) => {
    switch(_type) {
      case 'warn' : return { color: '#ffb997', icon: <Text size='small' color='#333333'><Warn /></Text>, textColor: '#333333' };
      case 'error' : return { color: '#f8a0a0', icon: <Text size='small' color='#333333'><Error /></Text>, textColor: '#333333' };
      case 'success': return { color: '#519872', icon: <Text size='small' color='#333333'><CheckCircle /></Text>, textColor: '#333333' };
      default: return { color: '#555555', icon: <Text size='small' color='#DDDDDD'><Info /></Text>, textColor: '#DDDDDD'  };
    }
  };

  return (
    <>
      { state.notifyOpen &&
      <Layer
        position='right'
        modal={false}
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
                <Text size='small' color={notificationTypeMap(state.type).textColor}>{ state.message }</Text>
              </Box>
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
      >
        <Box
          fill
          align="center"
          direction="row"
          gap="large"
          round='xsmall'
          elevation="medium"
          pad={{ vertical: 'large', horizontal: 'large' }}
          background='background'
        >
          <Text color='red'><Error /></Text>
          <Box align="center" direction="row" gap="xsmall">
            <Text>{ state.fatalMsg }</Text>
          </Box>
        </Box>
      </Layer>}

      {state.updateAvailable &&
      <Layer
        position='bottom-right'
        modal={false}
        onEsc={()=>dispatch({ type:'closeNotify' })}
        responsive={false}
        plain
        full={mobile?'horizontal': undefined}
      >
        <Box 
          width='1/2' 
        >
          <Box
            justify="center"
            elevation="large"
            pad={{ vertical:'small', horizontal:'small' }}
            background={notificationTypeMap('null').color}
            round='small'
            margin={mobile?{ bottom:'50px', horizontal:'xsmall' }: { bottom:'xlarge', right:'large' }}
            align='center'
          >
            <Box direction='row' align='center'>
              { notificationTypeMap('null').icon }
              <Box align="center" direction="row" gap="small" pad='small'>
                <Text size='small' color={notificationTypeMap('null').textColor}>An app update is available.</Text>
              </Box>
            </Box>

            <Box direction='row' gap='medium'>
              <RaisedButton
                background={notificationTypeMap('null').color}
                onClick={() => state.updateAccept()}
                label={<Text size='xsmall' color={notificationTypeMap(state.type).textColor}>Update now</Text>}
              />
              <RaisedButton
                background={notificationTypeMap('null').color}
                onClick={()=> dispatch({ type: 'updateAvailable', payload:{ updateAvailable:false } })}
                label={<Text size='xsmall' color={notificationTypeMap(state.type).textColor}>Later</Text>}
              />
            </Box>
          </Box>
          <Box background={notificationTypeMap('null').color} />
        </Box>      
      </Layer>}

      {state.slowNetwork && 
      <Layer
        position={state.position}
        modal={false}
        onEsc={()=>dispatch({ type:'closeNotify' })}
        responsive={false}
        plain
        full='vertical'
      >
        <Box
          fill
          align="center"
          direction="row"
          gap="large"
          round='xsmall'
          elevation="medium"
          pad={{ vertical: 'large', horizontal: 'large' }}
          background='background'
        >
          <Text color='red'><Error /></Text>
          <Box align="center" direction="row" gap="xsmall">
            <Text>Slow network detected</Text>
          </Box>
        </Box>
      </Layer>}
    </>
  );
}

export default NotifyLayer;