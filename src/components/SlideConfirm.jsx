import React from 'react';
import { useSpring, animated, interpolate } from 'react-spring';
import { useDrag } from 'react-use-gesture';
import { Stack } from 'grommet';
import { 
  FaTimes as Reject, 
  FaCheck as Confirm,
  FaArrowAltCircleRight as ArrowRight,
  FaThumbsUp,
} from 'react-icons/fa';

const SlideConfirm = (props) => {

  const { brandColor, onConfirm }= props;
  const [{ x, size, delta0 }, set] = useSpring(() => ({ x: 0, size:1, delta0: 0 }));

  const bind = useDrag(({ event, down, movement, delta }) => set({
    x: down ? movement[0]: 0,
    size: down? 1.1 : 1,
    delta0: delta[0],
    onFrame:(_x) => { if(_x.x > 120) { onConfirm(); } }
  }) && event.preventDefault(), {
    bounds: { left: 0, right: 100 },
    rubberband: true,
  } );
  const iconSize = x.interpolate({ map: Math.abs, range: [50, 300], output: ['scale(0)', 'scale(3)'], extrapolate: 'clamp' });
  // bg: `linear-gradient(120deg, ${delta[0] < 0 ? '#f093fb 0%, #f5576c' : '#96fbc4 0%, #f9f586'} 100%)`,
  //     <animated.div class="av" style={{ transform: avSize, justifySelf: delta[0] < 0 ? 'end' : 'start' }} />
  //     <animated.div class="fg" style={{ transform: interpolate([x, size], (x, s) => `translate3d(${x}px,0,0) scale(${s})`) }}>

  const style = {
    color: 'white',
    padding: '5px',
    textDecoration:'none',
    // fontSize: '15px',
    margin: '5px 5px',
    borderRadius: '36px',
  };

  const BottomElement = () => {
    return (
      <animated.div
        {...bind()}
        style={{ 
          backgroundColor: x.interpolate({ range: [0, 100], output: ['grey', brandColor] }), 
          minWidth:'150px',
          display: 'flex',
          alignItems: 'center',
          ...style,
        }}
      >
        <animated.div 
          style={{ 
            transform: iconSize,
            width:'75px',
          }}
        >
          <FaThumbsUp />
        </animated.div>

        <animated.div
          {...bind()}
          style={{ 
            marginRight:'5px',
            opacity: x.interpolate({ range: [0, 100], output: [1, 0] }),
          }}
        > Slide to sign
        </animated.div>
      </animated.div>
    );
  };

  const TopElement = ()=> {
    return (
      <animated.div
        {...bind()}
        style={{ 
          transform: interpolate([x, size], (_x, s) => `translate3d(${_x}px,0,0) scale(${s})`),
          background: brandColor,
          maxWidth:'50px',
          textAlign:'center',
          ...style,
        }}
      >
        <ArrowRight />
      </animated.div>
    );
  };

  return (
    <Stack>
      <BottomElement />
      <TopElement />
    </Stack>
  );
};

export default SlideConfirm;