import React from "react";
import {
  Box,
  Heading,
  Diagram,
  Stack,
  Grid,
  Text,
  DataTable,
  Meter,
  List,
} from "grommet";
import {
  FaSortAmountDownAlt as SortDes,
  FaSortAmountUpAlt as SortAsc,
  FaQuestionCircle as Question,
} from "react-icons/fa";

import YieldSeries from "../components/YieldSeries";
import LendLayer from "./layers/LendLayer";

import { IYieldSeries } from "../types";

// const someData = [
//   { maturityDate: new Date('30 June 2020'), interestRate: 3.22, currentValue: 0.9921 },
//   { maturityDate: new Date('31 Sep 2020'), interestRate: 3.51, currentValue: 0.9829 },
//   { maturityDate: new Date('31 Dec 2020'), interestRate: 3.69, currentValue: 0.9732 },
//   { maturityDate: new Date('30 Mar 2021'), interestRate: 3.78, currentValue: 0.9636 },
//   { maturityDate: new Date('30 June 2021'), interestRate: 3.91, currentValue: 0.9636 },
// ];

const someData = [
  {
    maturityDate: new Date(),
    interestRate: 3.22,
    currentValue: 0.9921,
    balance: 0,
    debt: 0,
  },
  {
    maturityDate: new Date(),
    interestRate: 3.51,
    currentValue: 0.9829,
    balance: 0,
    debt: 0,
  },
  {
    maturityDate: new Date(),
    interestRate: 3.69,
    currentValue: 0.9732,
    balance: 0,
    debt: 0,
  },
  {
    maturityDate: new Date(),
    interestRate: 3.78,
    currentValue: 0.9636,
    balance: 0,
    debt: 0,
  },
  {
    maturityDate: new Date(),
    interestRate: 3.91,
    currentValue: 0.9636,
    balance: 0,
    debt: 0,
  },
];

const Lend = () => {
  const [showLendLayer, setShowLendLayer] = React.useState<boolean>();
  const [selectedSeries, setSelectedSeries] = React.useState<IYieldSeries>();
  const [sortAsc, setSortAsc] = React.useState<boolean>(true);

  const handleSelectSeries = (_series: IYieldSeries) => {
    setSelectedSeries(_series);
    setShowLendLayer(true);
  };

  const handleCloseLayer = () => {
    setShowLendLayer(false);
  };

  React.useEffect(() => {
    // some loading effect
  }, []);

  // const sortedData = (data:[IYieldSeries]) => {
  //   return data.sort();
  // };

  return (
    <Box pad="medium" round="medium" fill background="background-front">
      {showLendLayer && selectedSeries && (
        <LendLayer
          series={selectedSeries}
          closeLayer={() => handleCloseLayer()}
        />
      )}

      <Box
        pad={{ top: "small", bottom: "medium" }}
        direction="row"
        justify="between"
      >
        <Box
          flex
          direction="row"
          justify="between"
          pad={{ horizontal: "small" }}
        >
          <Box>Select an available series:</Box>
          {sortAsc ? (
            <SortAsc onClick={() => setSortAsc(!sortAsc)} />
          ) : (
            <SortDes onClick={() => setSortAsc(!sortAsc)} />
          )}
        </Box>
        <Box margin={{ horizontal: "large" }} direction="row" />
      </Box>

      <Box gap="small" overflow="auto" pad={{ right: "right" }}>
        {someData.map((x, i) => {
          return (
            <Box
              direction="row"
              key={x.maturityDate.toTimeString()}
              justify="between"
              align="baseline"
            >
              <Box flex>
                <YieldSeries
                  series={x}
                  seriesAction={() => handleSelectSeries(x)}
                />
              </Box>
              <Box margin={{ horizontal: "large" }}>{/* <Question /> */}</Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default Lend;
