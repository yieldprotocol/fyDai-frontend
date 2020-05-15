import React from 'react';


const LayerContext = React.createContext<any>({});

const LayerProvider = (props:any) => {
  const { children } = props;
  return (
    <LayerContext.Provider
      value={{ something: 'hello',
        someObj: {
          helloagain: 'helloagain',
        }, 
        somefunction: ()=>{ console.log('oof');},
      }}
    >
      {children}
    </LayerContext.Provider>
  );
};

export { LayerContext, LayerProvider } ;