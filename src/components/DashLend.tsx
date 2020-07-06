import React from 'react';
import { Box, Button, Select, Image, TextInput, Text, CheckBox, Collapsible, RangeInput } from 'grommet';
import { 
  FiCheckCircle, 
  FiInfo as Info,
  FiHelpCircle as Help,
  FiChevronDown as CaretDown,
  FiAlertTriangle as Warning,
} from 'react-icons/fi';


interface DashLendProps {
  // borrowFn:any
  // activeSeries?:IYieldSeries,
  // maxValue?:number
}

const DashLend = () => {

  const [ inputValue, setInputValue ] = React.useState<any>();
  const [ borrowType, setBorrowType ] = React.useState<string>('yDai');

  return (
    <Box gap='small' direction='row-responsive' fill='horizontal' justify='between'>
      <Box background='blue' fill='horizontal'>
        Lend col1
      </Box>
      <Box background='blue' fill='horizontal'>
        Lend col2
      </Box>
      <Box background='blue' fill='horizontal'>
        Lend col3
      </Box>
    </Box>

  );
};

export default DashLend;