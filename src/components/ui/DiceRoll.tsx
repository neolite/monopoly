'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface DiceRollProps {
  dice: [number, number];
  isRolling: boolean;
  onRollComplete?: () => void;
}

const DiceRoll: React.FC<DiceRollProps> = ({ dice, isRolling, onRollComplete }) => {
  const [animatingDice, setAnimatingDice] = useState<[number, number]>([1, 1]);
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    if (isRolling) {
      setShowAnimation(true);
      
      // Animate random dice values during rolling
      const animationInterval = setInterval(() => {
        setAnimatingDice([
          Math.floor(Math.random() * 6) + 1,
          Math.floor(Math.random() * 6) + 1
        ]);
      }, 100);
      
      // Stop animation after 1 second and show final dice values
      setTimeout(() => {
        clearInterval(animationInterval);
        setAnimatingDice(dice);
        
        // Notify parent component that roll is complete
        setTimeout(() => {
          setShowAnimation(false);
          if (onRollComplete) {
            onRollComplete();
          }
        }, 500);
      }, 1000);
    }
  }, [isRolling, dice, onRollComplete]);

  // Render dice dots based on value
  const renderDots = (value: number) => {
    switch (value) {
      case 1:
        return <div className="dot center"></div>;
      case 2:
        return (
          <>
            <div className="dot top-left"></div>
            <div className="dot bottom-right"></div>
          </>
        );
      case 3:
        return (
          <>
            <div className="dot top-left"></div>
            <div className="dot center"></div>
            <div className="dot bottom-right"></div>
          </>
        );
      case 4:
        return (
          <>
            <div className="dot top-left"></div>
            <div className="dot top-right"></div>
            <div className="dot bottom-left"></div>
            <div className="dot bottom-right"></div>
          </>
        );
      case 5:
        return (
          <>
            <div className="dot top-left"></div>
            <div className="dot top-right"></div>
            <div className="dot center"></div>
            <div className="dot bottom-left"></div>
            <div className="dot bottom-right"></div>
          </>
        );
      case 6:
        return (
          <>
            <div className="dot top-left"></div>
            <div className="dot top-right"></div>
            <div className="dot middle-left"></div>
            <div className="dot middle-right"></div>
            <div className="dot bottom-left"></div>
            <div className="dot bottom-right"></div>
          </>
        );
      default:
        return null;
    }
  };

  if (!showAnimation && dice[0] === 0 && dice[1] === 0) {
    return null;
  }

  return (
    <div className="flex justify-center items-center space-x-4 my-4">
      {showAnimation ? (
        <>
          <motion.div
            className="dice"
            animate={{
              rotate: [0, 360, 720, 1080],
              scale: [1, 1.2, 0.8, 1]
            }}
            transition={{ duration: 1 }}
          >
            {renderDots(animatingDice[0])}
          </motion.div>
          <motion.div
            className="dice"
            animate={{
              rotate: [0, -360, -720, -1080],
              scale: [1, 0.8, 1.2, 1]
            }}
            transition={{ duration: 1 }}
          >
            {renderDots(animatingDice[1])}
          </motion.div>
        </>
      ) : (
        <>
          <div className="dice">
            {renderDots(dice[0])}
          </div>
          <div className="dice">
            {renderDots(dice[1])}
          </div>
        </>
      )}
    </div>
  );
};

export default DiceRoll;
