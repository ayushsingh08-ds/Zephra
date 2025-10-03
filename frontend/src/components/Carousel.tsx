import React, { useState, useEffect } from 'react';
import './Carousel.css';

export interface CarouselItem {
  id: string;
  title: string;
  value: number;
  unit: string;
  color: string;
  description: string;
  icon: React.ReactNode;
}

interface CarouselProps {
  items: CarouselItem[];
  baseWidth?: number;
  autoplay?: boolean;
  autoplayDelay?: number;
  pauseOnHover?: boolean;
  loop?: boolean;
  round?: boolean;
}

const Carousel: React.FC<CarouselProps> = ({
  items,
  baseWidth = 140,
  autoplay = false,
  autoplayDelay = 3000,
  pauseOnHover = true,
  loop = true
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!autoplay || items.length <= 1) return;

    const interval = setInterval(() => {
      if (!isHovered || !pauseOnHover) {
        setCurrentIndex((prevIndex) => {
          if (loop) {
            return (prevIndex + 1) % items.length;
          } else {
            return prevIndex < items.length - 1 ? prevIndex + 1 : 0;
          }
        });
      }
    }, autoplayDelay);

    return () => clearInterval(interval);
  }, [autoplay, autoplayDelay, items.length, isHovered, pauseOnHover, loop]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const currentItem = items[currentIndex];

  if (!currentItem) return null;

  return (
    <div 
      className="carousel-container"
      style={{ width: `${baseWidth}px`, height: `${baseWidth}px` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="carousel-item active">
        <div className="carousel-item-header">
          <div className="carousel-icon-container" style={{ color: currentItem.color }}>
            {currentItem.icon}
          </div>
        </div>
        
        <div className="carousel-item-content">
          <div className="carousel-item-title">{currentItem.title}</div>
          <div className="carousel-item-value" style={{ color: currentItem.color }}>
            {currentItem.value}
            <span className="carousel-item-unit">{currentItem.unit}</span>
          </div>
          <div className="carousel-item-description">{currentItem.description}</div>
        </div>
      </div>

      {items.length > 1 && (
        <div className="carousel-indicators-container">
          <div className="carousel-indicators">
            {items.map((_, index) => (
              <button
                key={index}
                className={`carousel-indicator ${index === currentIndex ? 'active' : 'inactive'}`}
                onClick={() => goToSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Carousel;